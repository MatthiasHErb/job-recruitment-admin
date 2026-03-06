import { NextResponse } from "next/server";

function normalizeProvider(rawProvider: string | undefined): "openai" | "infomaniak" {
  if (!rawProvider) return "openai";
  const cleaned = rawProvider.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  return cleaned === "infomaniak" ? "infomaniak" : "openai";
}

export async function GET() {
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  return NextResponse.json({ provider });
}
