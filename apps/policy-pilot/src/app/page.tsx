"use client";

import { useCallback, useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";
import { DEMO_USERS, HARBORLINE_TERMS_URL } from "../lib/demo-users";

type Control = {
  id: string;
  framework: string;
  title: string;
  status: string;
};

type PolicyResponse = {
  upcomingAudits: number;
  unresolvedFindings: number;
  controls: Control[];
};

type AuditServer = {
  id: string;
  name: string;
  visibility: string;
  totalCalls: number;
  successRate: number | null;
  avgDuration: number | null;
};

type Audit = {
  plan: "free" | "pro" | null;
  branding: { mode: "appa" | "custom" | "none"; name: string | null } | null;
  serversPerOwner: number;
  hasApiKey: boolean;
  error?: string;
  servers: AuditServer[];
};

const BI_URL = "https://appatools.com/mcp-studio-sdk/portal/analytics";

const DISCLOSURE = {
  appa: "Embedded screens show the Appa Tools watermark, so list Appa Tools as a subprocessor in your vendor register.",
  custom: "Embedded screens show PolicyPilot's own logo. Appa Tools still processes the content; keep it in your vendor register.",
  none: "Embedded screens show no third-party branding. Appa Tools still processes the content; keep it in your vendor register.",
};

export default function HomePage() {
  const [data, setData] = useState<PolicyResponse | null>(null);
  const [ownerId, setOwnerId] = useState<string>(DEMO_USERS[0].id);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [provision, setProvision] = useState<{ kind: "ok" | "limit" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const owner = DEMO_USERS.find((u) => u.id === ownerId) ?? DEMO_USERS[0];

  useEffect(() => {
    fetch("/api/policies")
      .then((res) => res.json())
      .then((json: PolicyResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  const refreshAudit = useCallback(() => {
    fetch(`/api/audit?user=${encodeURIComponent(ownerId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: Audit | null) => setAudit(json))
      .catch(() => setAudit(null));
  }, [ownerId]);

  useEffect(() => {
    setProvision(null);
    refreshAudit();
  }, [refreshAudit]);

  const post = async (path: string, body: Record<string, string>) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    return { ok: Boolean(res?.ok), body: await res?.json().catch(() => null) };
  };

  const runProvision = async () => {
    setBusy("provision");
    const { ok, body } = await post("/api/provision", { user: ownerId });
    if (ok) {
      setProvision({ kind: "ok", text: `Created “${body.server.name}”. It is indexing now and already appears under My servers.` });
    } else if (body?.error === "limit") {
      setProvision({ kind: "limit", text: body.message });
    } else {
      setProvision({ kind: "error", text: body?.error === "no_api_key" ? "Add MCP_STUDIO_API_KEY to provision from the backend." : body?.message ?? "Provisioning failed." });
    }
    setBusy(null);
    refreshAudit();
  };

  const restrict = async (server: string) => {
    setBusy(server);
    await post("/api/restrict", { user: ownerId, server });
    setBusy(null);
    refreshAudit();
  };

  const snippet = JSON.stringify(
    {
      mcpServers: {
        "policypilot-admin": {
          url: "https://appatools.com/mcp-studio/api/headless/mcp",
          headers: {
            Authorization: "Bearer ${env:MCP_STUDIO_API_KEY}",
            "X-MCP-Studio-End-User": ownerId,
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <main className="page">
      <section className="hero">
        <h1>PolicyPilot</h1>
        <p>
          Concept demo for a compliance and legal operations platform. Each framework owner keeps a
          dedicated MCP server of approved policies, so policy assistants answer from current,
          signed-off documents. Pick an owner to act as them.
        </p>
        <div className="switcher" aria-label="Framework owner">
          {DEMO_USERS.map((u) => (
            <button key={u.id} aria-pressed={u.id === ownerId} onClick={() => setOwnerId(u.id)}>
              {u.label} · {u.framework}
            </button>
          ))}
        </div>
        <div className="demo-source">
          <strong>Demo policy document</strong>
          <p>
            The Harborline Ferries terms of carriage, a public sample policy. Provision it from the
            backend below, or paste the URL into the wizard yourself:
          </p>
          <a href={HARBORLINE_TERMS_URL}>{HARBORLINE_TERMS_URL}</a>
        </div>
      </section>

      <section className="grid">
        <div className="stack">
          <article className="card">
            <h2>Compliance Snapshot</h2>
            {data ? (
              <>
                <div className="metric">
                  <div className="metric-box">
                    <strong>{data.upcomingAudits}</strong>
                    Upcoming audits
                  </div>
                  <div className="metric-box">
                    <strong>{data.unresolvedFindings}</strong>
                    Unresolved findings
                  </div>
                </div>
                <ul className="ticket-list" style={{ marginTop: 14 }}>
                  {data.controls.map((control) => (
                    <li className="ticket" key={control.id}>
                      <div className="ticket-title">
                        {control.id} · {control.framework}
                      </div>
                      <div style={{ marginBottom: 6 }}>{control.title}</div>
                      <span className="badge">{control.status}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Loading compliance data...</p>
            )}
          </article>

          <article className="card">
            <h2>Onboard the {owner.framework} program</h2>
            <p className="muted">
              PolicyPilot creates {owner.label}&apos;s approved-policy server from its backend: one
              REST call with your integrator API key and <code>X-MCP-Studio-End-User: {ownerId}</code>.
              Each owner can hold {audit?.serversPerOwner ?? 1} server
              {(audit?.serversPerOwner ?? 1) === 1 ? "" : "s"} on PolicyPilot&apos;s SDK plan.
            </p>
            <button className="button primary" onClick={runProvision} disabled={busy === "provision"}>
              {busy === "provision" ? "Provisioning…" : `Provision for ${owner.label}`}
            </button>
            {provision && (
              <div className={`notice ${provision.kind === "ok" ? "" : provision.kind === "limit" ? "warn" : "error"}`} style={{ marginTop: 12 }}>
                {provision.kind === "limit" && <strong style={{ display: "block", marginBottom: 4 }}>Plan limit reached</strong>}
                {provision.text}
              </div>
            )}
          </article>

          <article className="card">
            <h2>Audit evidence</h2>
            <p className="muted">
              What an auditor asks for: each of {owner.label}&apos;s servers, who can read it, and how
              reliably it answered. For every owner side by side, open Business Intelligence.
            </p>
            {!audit?.hasApiKey ? (
              <ApiKeyNotice />
            ) : audit.error ? (
              <p className="notice error">{audit.error}</p>
            ) : audit.servers.length === 0 ? (
              <p className="muted">No servers yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Access</th>
                    <th>Requests</th>
                    <th>Answered</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.servers.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>
                        {s.visibility === "private" ? (
                          "Private"
                        ) : (
                          <button className="button" onClick={() => restrict(s.id)} disabled={busy === s.id}>
                            {busy === s.id ? "Restricting…" : "Public · restrict"}
                          </button>
                        )}
                      </td>
                      <td>{s.totalCalls}</td>
                      <td>{s.successRate == null || s.totalCalls === 0 ? "—" : `${Math.round(s.successRate)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="muted" style={{ marginBottom: 0 }}>
              <a href={`${BI_URL}?endUserId=${encodeURIComponent(ownerId)}`} target="_blank" rel="noreferrer">
                Open {owner.label} in Business Intelligence
              </a>
              {audit?.branding && (
                <>
                  <br />
                  <strong>Vendor disclosure:</strong> {DISCLOSURE[audit.branding.mode]}
                </>
              )}
            </p>
          </article>

          <article className="card">
            <h2>Connect your compliance agent</h2>
            <p className="muted">
              Your compliance engineers can manage {owner.label}&apos;s servers from Claude, Cursor, or
              Codex with Headless Context MCP. This is a Cursor <code>mcp.json</code> entry. Restricting access above uses its{" "}
              <code>set_server_visibility</code> tool. Keep the API key in an environment variable,
              never in a shared file.
            </p>
            <pre className="snippet">{snippet}</pre>
          </article>
        </div>

        <article className="card">
          <h2>{owner.label}&apos;s policy servers</h2>
          <p className="muted">
            {owner.label} builds and manages servers here without a Raglantern account. Their
            limits come from PolicyPilot&apos;s SDK plan.
          </p>
          <McpStudioEmbed
            containerId="policy-mcp-studio"
            endUserId={ownerId}
            onServerCreated={refreshAudit}
            onViewChange={refreshAudit}
          />
        </article>
      </section>
    </main>
  );
}

function ApiKeyNotice() {
  return (
    <div className="notice">
      Add an integrator API key as <code>MCP_STUDIO_API_KEY</code> in <code>.env.local</code> to see
      this. Create one at{" "}
      <a href="https://appatools.com/mcp-studio-sdk/portal/api-keys" target="_blank" rel="noreferrer">
        Portal → API keys
      </a>
      , then restart the dev server.
    </div>
  );
}
