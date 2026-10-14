import { NextResponse } from "next/server";
import {
  getEmbedConfig,
  liveServers,
  readApiKey,
  readCredentials,
  serversPerEndUser,
  studioApi,
} from "../../../lib/mcp-studio";
import { findDemoUser } from "../../../lib/demo-users";

/**
 * Audit evidence for one framework owner: every server they hold, whether it
 * is public or private, and how reliably it has answered. The figures come
 * from the REST API (list, then per-server analytics) as that owner; the
 * branding disclosure comes from the public embed config.
 */
export const dynamic = "force-dynamic";

type Analytics = { totalCalls: number; successRate: number; avgDuration: number };

export async function GET(request: Request) {
  const user = findDemoUser(new URL(request.url).searchParams.get("user"));
  if (!user) return NextResponse.json({ error: "unknown_user" }, { status: 400 });

  const credentials = readCredentials();
  if (!credentials.ok) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const embed = await getEmbedConfig(credentials.clientId);
  const base = {
    plan: embed?.plan ?? null,
    branding: embed?.branding ?? null,
    serversPerOwner: serversPerEndUser(embed?.plan),
  };

  const apiKey = readApiKey();
  if (!apiKey) return NextResponse.json({ ...base, hasApiKey: false, servers: [] });

  const list = await studioApi("/api/mcp/list", { apiKey, endUserId: user.id });
  if (!list.ok) return NextResponse.json({ ...base, hasApiKey: true, error: list.message, servers: [] });

  const servers = await Promise.all(
    liveServers(list.data).map(async (s) => {
      const stats = await studioApi<Analytics>(`/api/analytics/${s.id}`, { apiKey, endUserId: user.id });
      return {
        id: s.id,
        name: s.name,
        visibility: s.visibility,
        totalCalls: stats.ok ? stats.data.totalCalls : s.totalCalls,
        successRate: stats.ok ? stats.data.successRate : null,
        avgDuration: stats.ok ? stats.data.avgDuration : null,
      };
    }),
  );

  return NextResponse.json({ ...base, hasApiKey: true, servers }, { headers: { "cache-control": "no-store" } });
}
