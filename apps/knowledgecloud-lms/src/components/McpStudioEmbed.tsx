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
        summarize: true,
        extract_code: false,
      },
      sources: {
        website: true,
        documentation: true,
        github: true,
      },
      colors: {
        background: "#ffffff",
        primary: "#0f172a",
        accent: "#14b8a6",
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
          Configure <code>NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID</code> in <code>.env.local</code>.
        </p>
      </div>
    );
  }

  return <div id={containerId} />;
}
