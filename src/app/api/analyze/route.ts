import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";
import pdf from "pdf-parse";

type AIProvider = "openai" | "infomaniak";

function normalizeProvider(rawProvider: string | undefined): AIProvider | null {
  if (!rawProvider) return "openai";
  const cleaned = rawProvider.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  if (cleaned === "openai" || cleaned === "infomaniak") return cleaned;
  return null;
}

function normalizeModel(rawModel: string | undefined, fallback: string): string {
  if (!rawModel) return fallback;
  const cleaned = rawModel.trim().replace(/^['"]|['"]$/g, "");
  return cleaned || fallback;
}

function normalizeInfomaniakModel(rawModel: string | undefined): string {
  const cleaned = normalizeModel(rawModel, "qwen3").toLowerCase();
  // Keep backward compatibility with older config values.
  if (cleaned === "qwen3-vl" || cleaned === "qwen3_vl") return "qwen3";
  return cleaned;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pdf_path } = (await request.json()) as { pdf_path?: string };
  if (!pdf_path) {
    return NextResponse.json({ error: "pdf_path required" }, { status: 400 });
  }

  const provider = normalizeProvider(process.env.AI_PROVIDER);
  if (!provider) {
    return NextResponse.json(
      { error: "AI_PROVIDER must be either 'openai' or 'infomaniak'" },
      { status: 500 }
    );
  }
  const isInfomaniak = provider === "infomaniak";
  const isOpenAI = provider === "openai";

  const apiKey = isInfomaniak
    ? process.env.INFOMANIAK_API_KEY
    : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: isInfomaniak
          ? "INFOMANIAK_API_KEY not configured"
          : "OPENAI_API_KEY not configured",
      },
      { status: 500 }
    );
  }

  const infomaniakProductId = process.env.INFOMANIAK_PRODUCT_ID;
  if (isInfomaniak && !infomaniakProductId) {
    return NextResponse.json(
      { error: "INFOMANIAK_PRODUCT_ID not configured" },
      { status: 500 }
    );
  }

  const model = isInfomaniak
    ? normalizeInfomaniakModel(process.env.INFOMANIAK_MODEL)
    : normalizeModel(process.env.OPENAI_MODEL, "gpt-5.2");

  const admin = createAdminClient();
  const { data: fileData, error: downloadError } = await admin.storage
    .from("job-applications")
    .download(pdf_path);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: downloadError?.message || "File not found" },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  let text: string;
  try {
    const parsed = await pdf(buffer);
    text = parsed.text;
  } catch {
    return NextResponse.json(
      { error: "Could not parse PDF" },
      { status: 400 }
    );
  }

  if (!text || text.trim().length < 50) {
    return NextResponse.json(
      { error: "PDF appears empty or unreadable" },
      { status: 400 }
    );
  }

  const openai = new OpenAI(
    isInfomaniak
      ? {
          apiKey,
          baseURL: `https://api.infomaniak.com/2/ai/${infomaniakProductId}/openai/v1`,
        }
      : { apiKey }
  );

  const { data: settingsRow } = await supabase
    .from("recruitment_settings")
    .select("value")
    .eq("key", "analysis_prompt")
    .single();

  const DEFAULT_PROMPT = `You are analyzing a job application (CV/cover letter) for a Post Doc position in Plant Volatile Interactions at the University of Bern.

Extract and analyze the following. Respond ONLY with valid JSON in this exact structure (no markdown, no extra text):
{
  "first_name": "string",
  "last_name": "string",
  "email": "string or null if not found",
  "current_position": "string - their current job/role",
  "ranking_score": number 1-100 (100=ideal fit: PhD in relevant field, experience in chemical ecology/analytical chemistry/molecular biology, interdisciplinary interest, strong publications),
  "strengths": "2-4 bullet points, concise",
  "weaknesses": "1-3 bullet points, constructive"
}`;

  const instructions = settingsRow?.value ?? DEFAULT_PROMPT;
  const prompt = `${instructions}

Application text:
---
${text.slice(0, 12000)}
---`;

  const responseFormat = isInfomaniak
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: "cv_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              first_name: { type: "string" },
              last_name: { type: "string" },
              email: { anyOf: [{ type: "string" }, { type: "null" }] },
              current_position: { type: "string" },
              ranking_score: { type: "number" },
              strengths: { type: "string" },
              weaknesses: { type: "string" },
            },
            required: [
              "first_name",
              "last_name",
              "email",
              "current_position",
              "ranking_score",
              "strengths",
              "weaknesses",
            ],
          },
        },
      }
    : ({ type: "json_object" as const });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: responseFormat,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error(`No response from ${provider}`);

    const analysis = JSON.parse(content) as {
      first_name?: string;
      last_name?: string;
      email?: string | null;
      current_position?: string;
      ranking_score?: number;
      strengths?: string;
      weaknesses?: string;
    };

    const { error: upsertError } = await supabase.from("recruitment_candidates").upsert(
      {
        pdf_path,
        first_name: analysis.first_name ?? null,
        last_name: analysis.last_name ?? null,
        email: analysis.email ?? null,
        current_position: analysis.current_position ?? null,
        ranking_score: Math.min(100, Math.max(1, analysis.ranking_score ?? 50)),
        strengths: analysis.strengths ?? null,
        weaknesses: analysis.weaknesses ?? null,
        raw_analysis: analysis,
        analyzed_at: new Date().toISOString(),
      },
      { onConflict: "pdf_path" }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
