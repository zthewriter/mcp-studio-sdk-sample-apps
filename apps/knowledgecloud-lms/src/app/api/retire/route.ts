import { NextResponse } from "next/server";
import { headlessTool, readApiKey } from "../../../lib/mcp-studio";
import { findDemoUser } from "../../../lib/demo-users";

/**
 * Retiring a course: the admin removes the instructor's course server, which
 * frees their seat for the next course. Runs the `delete_server` tool on
 * Headless Context MCP as that instructor. The tool refuses unless `confirm`
 * is `true`, so this route sends it only after the admin confirmed in the UI.
 * The instructor can restore the server from My servers for 7 days.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { user?: string; server?: string; confirmed?: boolean };
  const user = findDemoUser(body.user);
  if (!user || typeof body.server !== "string" || !body.server || body.confirmed !== true) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = readApiKey();
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 503 });

  const result = await headlessTool(
    "delete_server",
    { server: body.server, confirm: true },
    { apiKey, endUserId: user.id },
  );
  if (!result.ok) return NextResponse.json({ error: "headless_failed", message: result.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
