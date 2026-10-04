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
      layout: "horizontal",
      domain: "appatools.com",
      font: "Inter",
      // Every key is listed so each one can be edited in place: an omitted tool
      // or source type is enabled by default.
      tools: {
        search_docs: true,
        query_source: true,
        search_issues: true,
        get_code_examples: true,
        extract_schema: true,
        summarize_content: true,
        ask_question: true,
        find_api_reference: true,
        get_changelog: true,
        get_quickstart: true,
      },
      sources: {
        website: true,
        github: true,
        docs: true,
        api: true,
        mcp: false,
      },
      colors: {
        background: "#ffffff",
        foreground: "#111827",
        primary: "#111827",
        primaryForeground: "#ffffff",
        secondary: "#f3f4f6",
        card: "#ffffff",
        cardBorder: "#e5e7eb",
        stepperActive: "#2563eb",
        stepperComplete: "#111827",
        accent: "#7c3aed",
      },
      analytics: {
        enabled: false,
        tier: "core",
        metrics: ["total_calls", "success_rate", "avg_duration", "tool_usage", "source_usage"],
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

    // Reuse a script that is still loading: editing the config re-runs this
    // effect, and a second copy would initialize the wizard twice.
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${embedScriptUrl}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = embedScriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }
    const loading = script;
    loading.addEventListener("load", init);

    return () => {
      loading.removeEventListener("load", init);
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
