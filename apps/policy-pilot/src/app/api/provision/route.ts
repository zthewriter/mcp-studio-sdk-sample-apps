import { NextResponse } from "next/server";
import { readApiKey, studioApi } from "../../../lib/mcp-studio";
import { findDemoUser, HARBORLINE_TERMS_URL } from "../../../lib/demo-users";

/**
 * Backend provisioning: when a framework owner is onboarded, PolicyPilot
 * creates their approved-policy MCP server itself, with no wizard. The REST
 * API is called with the integrator API key, and `X-MCP-Studio-End-User` makes
 * the server theirs, so it appears in their dashboard and counts against their
 * per-user limit on your SDK plan.
 */
export const dynamic = "force-dynamic";

type Created = { serverId: string; name: string; url: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { user?: string };
  const user = findDemoUser(body.user);
  if (!user) return NextResponse.json({ error: "unknown_user" }, { status: 400 });

  const apiKey = readApiKey();
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 503 });

  const result = await studioApi<Created>("/api/mcp/create", {
    apiKey,
    endUserId: user.id,
    method: "POST",
    body: {
      name: `${user.framework} approved policies`,
      description: `Approved policy documents for the ${user.framework} program, owned by ${user.label}.`,
      sources: [{ url: HARBORLINE_TERMS_URL, type: "website" }],
      tools: ["search_docs", "ask_question", "query_source", "summarize_content"],
    },
  });

  if (!result.ok) {
    // A plan limit arrives as 403 `sdk_plan_limit` with a message written for
    // the end user, so it can be shown as is.
    return NextResponse.json(
      { error: result.status === 403 ? "limit" : "create_failed", message: result.message },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({ server: { id: result.data.serverId, name: result.data.name, url: result.data.url } });
}
