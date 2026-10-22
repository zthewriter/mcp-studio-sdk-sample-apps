/**
 * Server-side helpers for talking to Raglantern SDK.
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

/** Raglantern itself: the REST API, Headless Context MCP, and embed config. */
export const MCP_STUDIO_API_URL =
  process.env.MCP_STUDIO_API_URL?.replace(/\/$/, "") ??
  "https://appatools.com/mcp-studio";

export type MissingCredential =
  | "MCP_STUDIO_CLIENT_ID"
  | "MCP_STUDIO_CLIENT_SECRET";

type CredentialsResult =
  | { ok: true; clientId: string; clientSecret: string }
  | { ok: false; missing: MissingCredential[] };

/**
 * Reads the credentials this sample needs, treating the placeholder values from
 * `.env.example` as missing. Copying the file without editing it is the most
 * likely way to get here, and a placeholder that reached Raglantern would fail
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
  | { ok: true; token: string; sessionToken: string | null }
  | { ok: false; status: number; detail: string };

/**
 * Exchanges the client secret for a short-lived attribution token.
 *
 * The token proves to Raglantern that this embed session came from you. It is
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
      // A cached token would be handed to a second visitor, and Raglantern
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

  const data = (await res.json().catch(() => null)) as
    | { token?: string; sessionToken?: string }
    | null;
  if (!data?.token) {
    return { ok: false, status: res.status, detail: "Response contained no token." };
  }

  // Returned because endUserId was sent. It lasts 60 minutes, is reusable, and
  // lets that one user deploy in place and manage their servers.
  return { ok: true, token: data.token, sessionToken: data.sessionToken ?? null };
}

/**
 * Optional. An integrator API key (`msk_live_...`) from
 * https://appatools.com/mcp-studio-sdk/portal/api-keys. Your backend uses it to
 * act for one of your end users by naming them in `X-MCP-Studio-End-User`.
 * It manages every server your integration owns, so it never leaves the server.
 */
export function readApiKey(): string | null {
  const key = process.env.MCP_STUDIO_API_KEY?.trim() ?? "";
  return key.startsWith("msk_live_") ? key : null;
}

export type StudioResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as { message?: unknown; error?: unknown };
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
  }
  return fallback;
}

/** Calls the Raglantern REST API as one of your end users, with the integrator API key. */
export async function studioApi<T = unknown>(
  path: string,
  args: { apiKey: string; endUserId: string; method?: string; body?: unknown },
): Promise<StudioResult<T>> {
  try {
    const res = await fetch(`${MCP_STUDIO_API_URL}${path}`, {
      method: args.method ?? "GET",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "X-MCP-Studio-End-User": args.endUserId,
        ...(args.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: args.body === undefined ? undefined : JSON.stringify(args.body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, message: errorMessage(data, `HTTP ${res.status}`) };
    return { ok: true, status: res.status, data: data as T };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Network request failed." };
  }
}

/**
 * Calls one Headless Context MCP tool as one of your end users. This is the
 * same endpoint you would put in Claude, Cursor, or Codex; the tool result text
 * is the REST API's JSON body, so it is parsed back into an object here.
 */
export async function headlessTool<T = unknown>(
  tool: string,
  toolArgs: Record<string, unknown>,
  args: { apiKey: string; endUserId: string },
): Promise<StudioResult<T>> {
  try {
    const res = await fetch(`${MCP_STUDIO_API_URL}/api/headless/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "X-MCP-Studio-End-User": args.endUserId,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: toolArgs } }),
      cache: "no-store",
    });
    const rpc = (await res.json().catch(() => null)) as {
      result?: { isError?: boolean; content?: { type: string; text?: string }[] };
      error?: { message?: string };
    } | null;
    if (!res.ok || !rpc) return { ok: false, status: res.status, message: errorMessage(rpc, `HTTP ${res.status}`) };
    if (rpc.error) return { ok: false, status: res.status, message: rpc.error.message ?? "JSON-RPC error" };
    const text = rpc.result?.content?.find((c) => c.type === "text")?.text ?? "";
    if (rpc.result?.isError) return { ok: false, status: res.status, message: text };
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // Some tools answer in prose; return it as is.
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Network request failed." };
  }
}

export type EmbedConfig = {
  appName: string;
  plan: "free" | "pro";
  branding: { mode: "appa" | "custom" | "none"; logoUrl: string | null; name: string | null };
};

/**
 * The plan and branding Raglantern enforces for your client id. Public, so the
 * browser can call it too. Free always shows the Appa Tools watermark; only Pro
 * may use a custom logo or none.
 */
export async function getEmbedConfig(clientId: string): Promise<EmbedConfig | null> {
  try {
    const res = await fetch(
      `${MCP_STUDIO_API_URL}/api/sdk/embed-config?clientId=${encodeURIComponent(clientId)}`,
      { cache: "no-store" },
    );
    return res.ok ? ((await res.json()) as EmbedConfig) : null;
  } catch {
    return null;
  }
}

/** Servers each of your end users may hold on your SDK plan. */
export function serversPerEndUser(plan: EmbedConfig["plan"] | undefined): number {
  return plan === "pro" ? 10 : 1;
}

/** Requests per month across every end user of your integration. */
export function monthlyRequests(plan: EmbedConfig["plan"] | undefined): number {
  return plan === "pro" ? 5000 : 1000;
}

export type StudioServer = {
  id: string;
  name: string;
  status: string;
  visibility: string;
  totalCalls: number;
  createdAt: string;
};

/** Live servers only: deleted ones stay listed for 7 days but no longer count. */
export function liveServers(list: unknown): StudioServer[] {
  const rows = Array.isArray(list) ? list : (list as { servers?: unknown })?.servers;
  return Array.isArray(rows) ? (rows as StudioServer[]).filter((s) => s.status !== "deleted") : [];
}
