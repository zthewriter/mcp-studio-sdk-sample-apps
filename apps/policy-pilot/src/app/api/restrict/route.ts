import { NextResponse } from "next/server";
import { headlessTool, readApiKey } from "../../../lib/mcp-studio";
import { findDemoUser } from "../../../lib/demo-users";

/**
 * Compliance control: policy content must not be readable by anyone holding
 * the URL, so the owner can restrict a server to authorized agents. This runs
 * the `set_server_visibility` tool on Headless Context MCP, the same call a
 * compliance engineer could make from Claude or Cursor, as that owner.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { user?: string; server?: string };
  const user = findDemoUser(body.user);
  if (!user || typeof body.server !== "string" || !body.server) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = readApiKey();
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 503 });

  const result = await headlessTool(
    "set_server_visibility",
    { server: body.server, visibility: "private" },
    { apiKey, endUserId: user.id },
  );
  if (!result.ok) return NextResponse.json({ error: "headless_failed", message: result.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
