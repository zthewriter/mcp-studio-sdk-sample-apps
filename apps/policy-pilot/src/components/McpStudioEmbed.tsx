"use client";

import { useEffect, useMemo } from "react";

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

export default function McpStudioEmbed({ containerId }: EmbedProps) {
  const clientId = process.env.NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID ?? "";

  const config = useMemo(
    () => ({
      clientId,
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
    }),
    [clientId, containerId],
  );

  useEffect(() => {
    if (!clientId) return;

    const init = () => window.MCPStudio?.init(config);

    if (window.MCPStudio) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.appatools.com/embed.js";
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, config]);

  if (!clientId) {
    return (
      <div className="card">
        <h3>MCP Studio SDK Placeholder</h3>
        <p>
          Add <code>NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID</code> to <code>.env.local</code> to run this
          embed.
        </p>
      </div>
    );
  }

  return <div id={containerId} />;
}
