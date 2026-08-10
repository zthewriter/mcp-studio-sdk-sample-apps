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
      layout: "horizontal",
      domain: "appatools.com",
      tools: {
        search_docs: true,
        extract_code: true,
        find_apis: true,
      },
      sources: {
        website: true,
        github: true,
        documentation: true,
        mcp_server: false,
      },
      colors: {
        background: "#ffffff",
        primary: "#111827",
        accent: "#7c3aed",
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
          Set <code>NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID</code> in <code>.env.local</code> to load the
          real embed.
        </p>
      </div>
    );
  }

  return <div id={containerId} />;
}
