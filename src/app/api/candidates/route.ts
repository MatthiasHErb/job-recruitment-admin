import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: files, error: listError } = await admin.storage
    .from("job-applications")
    .list("applications", { sortBy: { column: "created_at", order: "desc" } });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const allPdfPaths =
    files
      ?.filter((f) => f.name?.endsWith(".pdf"))
      .map((f) => `applications/${f.name}`) ?? [];

  const { data: archived } = await supabase
    .from("archived_applications")
    .select("pdf_path");
  const archivedSet = new Set((archived ?? []).map((a) => a.pdf_path));

  const pdfPaths = allPdfPaths.filter((p) => !archivedSet.has(p));

  const { data: candidates } = await supabase
    .from("recruitment_candidates")
    .select("*")
    .in("pdf_path", pdfPaths.length ? pdfPaths : ["__none__"]);

  const candidateMap = new Map(
    (candidates ?? []).map((c) => [c.pdf_path, c])
  );

  const result = pdfPaths.map((path) => {
    const nameFromPath = path
      .replace(/^applications\/\d{4}-\d{2}-\d{2}T[^_]+_/, "")
      .replace(/\.pdf$/, "");
    const cached = candidateMap.get(path);
    return {
      pdf_path: path,
      name: cached
        ? `${cached.first_name || ""} ${cached.last_name || ""}`.trim() || nameFromPath
        : nameFromPath,
      first_name: cached?.first_name,
      last_name: cached?.last_name,
      email: cached?.email,
      current_position: cached?.current_position,
      ranking_score: cached?.ranking_score,
      recruiter_ranking: cached?.recruiter_ranking,
      strengths: cached?.strengths,
      weaknesses: cached?.weaknesses,
      analyzed_at: cached?.analyzed_at,
    };
  });

  return NextResponse.json(result);
}
