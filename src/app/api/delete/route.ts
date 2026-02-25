import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();

  await admin.storage.from("job-applications").remove([pdf_path]);
  await supabase.from("recruitment_candidates").delete().eq("pdf_path", pdf_path);
  await supabase.from("archived_applications").delete().eq("pdf_path", pdf_path);

  return NextResponse.json({ success: true });
}
