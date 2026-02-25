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

  const { pdf_path } = (await request.json()) as { pdf_path?: string };
  if (!pdf_path) {
    return NextResponse.json({ error: "pdf_path required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("archived_applications")
    .upsert({ pdf_path }, { onConflict: "pdf_path" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
