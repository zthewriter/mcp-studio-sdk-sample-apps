import { NextResponse } from "next/server";
import { mintAttributionToken, readCredentials } from "../../../../lib/mcp-studio";

/**
 * Starts one embed session.
 *
 * This route is the part of the integration you cannot skip. Your client secret
 * stays in this process, and the browser receives only the public client id and
 * a token that expires in 15 minutes and works once.
 *
 * MCP Studio refuses this exchange if it arrives with an `Origin` header,
 * precisely so that calling it from the browser is not an option.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = readCredentials();

  if (!credentials.ok) {
    return NextResponse.json(
      { error: "not_configured", missing: credentials.missing },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  // A real application would pass the id of the signed-in user, which lets you
  // tell later which of your users created a given MCP server. This sample has
  // no accounts, so it sends a fixed id to show where yours belongs.
  const minted = await mintAttributionToken({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    endUserId: "demo-helpdesk-user-1",
  });

  if (!minted.ok) {
    return NextResponse.json(
      { error: "mint_failed", status: minted.status, detail: minted.detail },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { clientId: credentials.clientId, attributionToken: minted.token },
    { headers: { "cache-control": "no-store" } },
  );
}
