import { NextResponse } from "next/server";
import { headlessTool, liveServers, readApiKey } from "../../../lib/mcp-studio";
import { findDemoUser } from "../../../lib/demo-users";

/**
 * Escalation lookup: before a support engineer replies to a customer, ask
 * Headless Context MCP what that customer has connected. It is the same
 * `list_servers` tool an engineer would call from Claude or Cursor, run here
 * from the backend with the customer named in `X-MCP-Studio-End-User`.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { user?: string };
  const user = findDemoUser(body.user);
  if (!user) return NextResponse.json({ error: "unknown_user" }, { status: 400 });

  const apiKey = readApiKey();
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 503 });

  const result = await headlessTool("list_servers", {}, { apiKey, endUserId: user.id });
  if (!result.ok) {
    return NextResponse.json({ error: "headless_failed", message: result.message }, { status: 502 });
  }

  return NextResponse.json({
    customer: user.label,
    servers: liveServers(result.data).map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      visibility: s.visibility,
      totalCalls: s.totalCalls,
    })),
  });
}
