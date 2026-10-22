import { NextResponse } from "next/server";
import { mintAttributionToken, readCredentials } from "../../../../lib/mcp-studio";
import { findDemoUser } from "../../../../lib/demo-users";

/**
 * Starts one embed session.
 *
 * This route is the part of the integration you cannot skip. Your client secret
 * stays in this process, and the browser receives only the public client id and
 * a token that expires in 15 minutes and works once.
 *
 * Raglantern refuses this exchange if it arrives with an `Origin` header,
 * precisely so that calling it from the browser is not an option.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Your app would read this from its own signed-in session, never from the
  // query string: whoever controls endUserId acts as that user. The samples have
  // no accounts, so the page picks a demo user and this route checks it against
  // a fixed list.
  const user = findDemoUser(new URL(request.url).searchParams.get("user"));
  if (!user) {
    return NextResponse.json({ error: "unknown_user" }, { status: 400 });
  }

  const credentials = readCredentials();

  if (!credentials.ok) {
    return NextResponse.json(
      { error: "not_configured", missing: credentials.missing },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const minted = await mintAttributionToken({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    endUserId: user.id,
  });

  if (!minted.ok) {
    return NextResponse.json(
      { error: "mint_failed", status: minted.status, detail: minted.detail },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      clientId: credentials.clientId,
      attributionToken: minted.token,
      sessionToken: minted.sessionToken,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
