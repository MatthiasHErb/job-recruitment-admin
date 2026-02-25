import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: fileData, error } = await admin.storage
    .from("job-applications")
    .download(path);

  if (error || !fileData) {
    return NextResponse.json(
      { error: error?.message || "File not found" },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const filename = path.split("/").pop() ?? "application.pdf";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
