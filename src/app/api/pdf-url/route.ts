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
  const { data, error } = await admin.storage
    .from("job-applications")
    .createSignedUrl(pdf_path, 3600);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Could not create URL" },
      { status: 404 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
