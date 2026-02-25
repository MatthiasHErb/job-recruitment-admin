import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pdf_path, recruiter_ranking } = (await request.json()) as {
    pdf_path?: string;
    recruiter_ranking?: string | null;
  };

  if (!pdf_path) {
    return NextResponse.json({ error: "pdf_path required" }, { status: 400 });
  }

  if (recruiter_ranking !== null && !["A", "B", "C"].includes(recruiter_ranking ?? "")) {
    return NextResponse.json(
      { error: "recruiter_ranking must be A, B, or C" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("recruitment_candidates")
    .upsert(
      { pdf_path, recruiter_ranking: recruiter_ranking || null },
      { onConflict: "pdf_path" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
