import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { postMortemToJson, postMortemToMarkdown } from "@/lib/postmortem/export";
import {
  PostMortemNotFoundError,
  getPostMortemReport,
} from "@/lib/postmortem/service";

export const dynamic = "force-dynamic";

function safeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  try {
    const report = await getPostMortemReport(user, id);
    const filename = `postmortem-${safeFilename(report.incident.title)}`;

    if (format === "markdown" || format === "md") {
      const body = postMortemToMarkdown(report);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.md"`,
        },
      });
    }

    if (format === "json") {
      const body = postMortemToJson(report);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    return NextResponse.json({ error: "format invalide (json|markdown)" }, { status: 400 });
  } catch (error) {
    if (error instanceof PostMortemNotFoundError) {
      return NextResponse.json({ error: "Incident introuvable" }, { status: 404 });
    }
    throw error;
  }
}
