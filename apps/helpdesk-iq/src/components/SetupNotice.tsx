"use client";

/**
 * Shown instead of the wizard until real credentials are present.
 *
 * This sample deliberately refuses to render a half-working embed. An embed
 * that silently degrades teaches the wrong integration, and the missing piece
 * would only surface later as a billing or attribution question.
 */

type SetupNoticeProps = {
  missing: string[];
};

const LABELS: Record<string, string> = {
  MCP_STUDIO_CLIENT_ID: "Client ID",
  MCP_STUDIO_CLIENT_SECRET: "Client Secret",
};

export default function SetupNotice({ missing }: SetupNoticeProps) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        borderRadius: 10,
        padding: 18,
      }}
    >
      <strong style={{ display: "block", marginBottom: 8, color: "#111827" }}>
        Add your MCP Studio credentials to run this demo
      </strong>

      <p style={{ marginTop: 0, fontSize: 14, color: "#4b5563" }}>
        {missing.length === 2
          ? "This app has no credentials yet."
          : `Still missing: ${missing.map((key) => LABELS[key] ?? key).join(", ")}.`}{" "}
        Both come from the{" "}
        <a
          href="https://appatools.com/mcp-studio-sdk/portal"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#7c3aed" }}
        >
          MCP Studio SDK portal
        </a>
        .
      </p>

      <ol style={{ fontSize: 14, color: "#4b5563", paddingLeft: 18, marginBottom: 12 }}>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code>
        </li>
        <li>Paste your Client ID and Client Secret into it</li>
        <li>Restart the dev server so Next.js picks up the new values</li>
      </ol>

      <pre
        style={{
          background: "#111827",
          color: "#e5e7eb",
          borderRadius: 8,
          padding: 12,
          fontSize: 12.5,
          overflowX: "auto",
          margin: 0,
        }}
      >
{`cp .env.example .env.local
# then edit .env.local:
MCP_STUDIO_CLIENT_ID=your_client_id_here
MCP_STUDIO_CLIENT_SECRET=your_client_secret_here`}
      </pre>

      <p style={{ marginBottom: 0, marginTop: 12, fontSize: 13, color: "#6b7280" }}>
        The secret is read only by this app&apos;s <code>/api/mcp-studio/session</code> route and is
        never sent to the browser. Do not rename it to <code>NEXT_PUBLIC_*</code>, which would
        publish it in the JavaScript bundle.
      </p>
    </div>
  );
}
