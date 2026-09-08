"use client";

import { useEffect, useMemo, useState } from "react";
import SetupNotice from "./SetupNotice";

declare global {
  interface Window {
    MCPStudio?: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

type EmbedProps = {
  containerId: string;
};

type SessionState =
  | { status: "loading" }
  | { status: "ready"; clientId: string; attributionToken: string }
  | { status: "not_configured"; missing: string[] }
  | { status: "error"; title: string; detail: string };

export default function McpStudioEmbed({ containerId }: EmbedProps) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  const embedScriptUrl =
    process.env.NEXT_PUBLIC_MCP_STUDIO_EMBED_URL ??
    "https://appatools.com/mcp-studio-sdk/embed.js";

  // Step 1: ask our own backend for a session. The client secret is read there,
  // never here, so nothing in this file can leak it into the bundle.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/mcp-studio/session", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && body?.clientId && body?.attributionToken) {
          setSession({
            status: "ready",
            clientId: body.clientId,
            attributionToken: body.attributionToken,
          });
          return;
        }

        if (body?.error === "not_configured") {
          setSession({
            status: "not_configured",
            missing: Array.isArray(body.missing) ? body.missing : [],
          });
          return;
        }

        setSession({
          status: "error",
          title:
            body?.status === 401
              ? "MCP Studio rejected these credentials"
              : "Could not start an MCP Studio session",
          detail:
            body?.status === 401
              ? "The client id and client secret did not match a developer account. Copy both again from the portal — the secret is shown in full only when you generate it."
              : String(body?.detail || "The session endpoint returned an unexpected response."),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSession({
            status: "error",
            title: "Could not reach this app's session endpoint",
            detail: "Check that the dev server is still running.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    if (session.status !== "ready") return null;

    return {
      clientId: session.clientId,
      // Proves this session belongs to your integration. Without it the wizard
      // still loads, but the session is unverified and cannot bill overage.
      attributionToken: session.attributionToken,
      container: `#${containerId}`,
      layout: "vertical",
      domain: "appatools.com",
      tools: {
        search_docs: true,
        extract_code: false,
        find_apis: true,
        summarize: true,
      },
      sources: {
        website: true,
        documentation: true,
        github: false,
        mcp_server: true,
      },
      colors: {
        background: "#ffffff",
        primary: "#0f172a",
        accent: "#0ea5e9",
      },
    };
  }, [session, containerId]);

  // Step 2: load the embed script and initialise it with the session.
  useEffect(() => {
    if (!config) return;

    const init = () => window.MCPStudio?.init(config);

    if (window.MCPStudio) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = embedScriptUrl;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [config, embedScriptUrl]);

  if (session.status === "loading") {
    return <p style={{ color: "#6b7280", fontSize: 14 }}>Starting MCP Studio session…</p>;
  }

  if (session.status === "not_configured") {
    return <SetupNotice missing={session.missing} />;
  }

  if (session.status === "error") {
    return (
      <div
        style={{
          border: "1px solid #fecaca",
          background: "#fef2f2",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <strong style={{ display: "block", marginBottom: 6, color: "#991b1b" }}>
          {session.title}
        </strong>
        <p style={{ margin: 0, fontSize: 14, color: "#7f1d1d" }}>{session.detail}</p>
      </div>
    );
  }

  return <div id={containerId} />;
}
