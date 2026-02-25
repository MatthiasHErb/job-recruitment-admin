import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("recruitment_settings")
    .select("value")
    .eq("key", "analysis_prompt")
    .single();

  return NextResponse.json({
    prompt: data?.value ?? DEFAULT_PROMPT,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("recruitment_settings")
    .upsert({ key: "analysis_prompt", value: prompt }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
