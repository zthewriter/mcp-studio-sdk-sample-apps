/**
 * Server-side helpers for talking to MCP Studio SDK.
 *
 * Everything here runs on the server. `MCP_STUDIO_CLIENT_SECRET` is
 * deliberately *not* prefixed with `NEXT_PUBLIC_`, because Next.js inlines
 * anything with that prefix into the JavaScript bundle, which would ship your
 * secret to every visitor. The client id is public and does reach the browser;
 * the secret must not.
 */

export const MCP_STUDIO_BASE_URL =
  process.env.MCP_STUDIO_BASE_URL?.replace(/\/$/, "") ??
  "https://appatools.com/mcp-studio-sdk";

export type MissingCredential =
  | "MCP_STUDIO_CLIENT_ID"
  | "MCP_STUDIO_CLIENT_SECRET";

type CredentialsResult =
  | { ok: true; clientId: string; clientSecret: string }
  | { ok: false; missing: MissingCredential[] };

/**
 * Reads the credentials this sample needs, treating the placeholder values from
 * `.env.example` as missing. Copying the file without editing it is the most
 * likely way to get here, and a placeholder that reached MCP Studio would fail
 * as "invalid credentials" — an error that sends you looking at the wrong thing.
 */
export function readCredentials(): CredentialsResult {
  const clientId = process.env.MCP_STUDIO_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.MCP_STUDIO_CLIENT_SECRET?.trim() ?? "";

  const isPlaceholder = (value: string) =>
    !value || value.startsWith("your_") || value.startsWith("demo_");

  const missing: MissingCredential[] = [];
  if (isPlaceholder(clientId)) missing.push("MCP_STUDIO_CLIENT_ID");
  if (isPlaceholder(clientSecret)) missing.push("MCP_STUDIO_CLIENT_SECRET");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, clientId, clientSecret };
}

type MintResult =
  | { ok: true; token: string }
  | { ok: false; status: number; detail: string };

/**
 * Exchanges the client secret for a short-lived attribution token.
 *
 * The token proves to MCP Studio that this embed session came from you. It is
 * valid for 15 minutes and can be spent once, so it is minted per session
 * rather than reused.
 */
export async function mintAttributionToken(args: {
  clientId: string;
  clientSecret: string;
  endUserId: string;
}): Promise<MintResult> {
  let res: Response;

  try {
    res = await fetch(`${MCP_STUDIO_BASE_URL}/api/attribution/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.clientSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: args.clientId,
        endUserId: args.endUserId,
      }),
      // A cached token would be handed to a second visitor, and MCP Studio
      // refuses a token that has already been spent. That failure looks like a
      // bug in the SDK rather than a caching mistake, so it is worth being
      // explicit here.
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : "Network request failed.",
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail: detail.slice(0, 300) };
  }

  const data = (await res.json().catch(() => null)) as { token?: string } | null;
  if (!data?.token) {
    return { ok: false, status: res.status, detail: "Response contained no token." };
  }

  return { ok: true, token: data.token };
}
