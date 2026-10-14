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
 * The learning admin's roster: every instructor's course servers, read from
 * the REST API with the integrator API key once per instructor via
 * `X-MCP-Studio-End-User`. The plan from the public embed config says how many
 * course servers each instructor may hold and how many requests all of them
 * share each month.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = readCredentials();
  if (!credentials.ok) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const embed = await getEmbedConfig(credentials.clientId);
  const apiKey = readApiKey();

  const instructors = await Promise.all(
    DEMO_USERS.map(async (user) => {
      if (!apiKey) return { ...user, servers: null, error: null };
      const list = await studioApi("/api/mcp/list", { apiKey, endUserId: user.id });
      if (!list.ok) return { ...user, servers: null, error: list.message };
      return {
        ...user,
        servers: liveServers(list.data).map((s) => ({ id: s.id, name: s.name, totalCalls: s.totalCalls })),
        error: null,
      };
    }),
  );

  return NextResponse.json(
    {
      // Public, so the page can fetch branding from the browser with it.
      clientId: credentials.clientId,
      plan: embed?.plan ?? null,
      serversPerInstructor: serversPerEndUser(embed?.plan),
      monthlyRequests: monthlyRequests(embed?.plan),
      hasApiKey: Boolean(apiKey),
      instructors,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
