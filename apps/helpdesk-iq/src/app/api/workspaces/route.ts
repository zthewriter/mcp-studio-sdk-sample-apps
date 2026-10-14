import { NextResponse } from "next/server";
import {
  getEmbedConfig,
  liveServers,
  monthlyRequests,
  readApiKey,
  readCredentials,
  serversPerEndUser,
  studioApi,
} from "../../../lib/mcp-studio";
import { DEMO_USERS } from "../../../lib/demo-users";

/**
 * The support manager's view of every customer workspace: how many MCP servers
 * each one holds against the plan's per-customer limit, and how many MCP
 * requests each has served. The plan comes from the public embed config; the
 * counts come from the REST API, called with your integrator API key once per
 * customer via `X-MCP-Studio-End-User`.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = readCredentials();
  if (!credentials.ok) {
    return NextResponse.json({ error: "not_configured", missing: credentials.missing }, { status: 503 });
  }

  const embed = await getEmbedConfig(credentials.clientId);
  const apiKey = readApiKey();

  const workspaces = await Promise.all(
    DEMO_USERS.map(async (user) => {
      if (!apiKey) return { ...user, servers: null, calls: null, error: null };
      const list = await studioApi("/api/mcp/list", { apiKey, endUserId: user.id });
      if (!list.ok) return { ...user, servers: null, calls: null, error: list.message };
      const servers = liveServers(list.data);
      return {
        ...user,
        servers: servers.length,
        calls: servers.reduce((sum, s) => sum + (s.totalCalls ?? 0), 0),
        error: null,
      };
    }),
  );

  return NextResponse.json(
    {
      clientId: credentials.clientId,
      plan: embed?.plan ?? null,
      branding: embed?.branding ?? null,
      serversPerCustomer: serversPerEndUser(embed?.plan),
      monthlyRequests: monthlyRequests(embed?.plan),
      hasApiKey: Boolean(apiKey),
      workspaces,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
