"use client";

import { useCallback, useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";
import { DEMO_USERS, type DemoUser } from "../lib/demo-users";

type Ticket = {
  id: string;
  title: string;
  priority: string;
  status: string;
};

type TicketResponse = {
  queueSize: number;
  avgFirstResponseMins: number;
  tickets: Ticket[];
};

type Workspace = DemoUser & { servers: number | null; calls: number | null; error: string | null };

type WorkspacesResponse = {
  plan: "free" | "pro" | null;
  branding: { mode: "appa" | "custom" | "none"; name: string | null } | null;
  serversPerCustomer: number;
  monthlyRequests: number;
  hasApiKey: boolean;
  workspaces: Workspace[];
};

type Escalation = {
  customer: string;
  servers: { id: string; name: string; status: string; visibility: string; totalCalls: number }[];
};

const BI_URL = "https://appatools.com/mcp-studio-sdk/portal/analytics";

const BRANDING_COPY = {
  appa: "Embedded screens carry the Appa Tools watermark.",
  custom: "Embedded screens carry your own logo.",
  none: "Embedded screens carry no watermark.",
};

export default function HomePage() {
  const [data, setData] = useState<TicketResponse | null>(null);
  const [customerId, setCustomerId] = useState<string>(DEMO_USERS[0].id);
  const [usage, setUsage] = useState<WorkspacesResponse | null>(null);
  const [escalation, setEscalation] = useState<Escalation | { error: string } | null>(null);
  const [escalating, setEscalating] = useState(false);

  const customer = DEMO_USERS.find((u) => u.id === customerId) ?? DEMO_USERS[0];

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((json: TicketResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  const refreshUsage = useCallback(() => {
    fetch("/api/workspaces", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: WorkspacesResponse | null) => setUsage(json))
      .catch(() => setUsage(null));
  }, []);

  useEffect(refreshUsage, [refreshUsage]);

  useEffect(() => setEscalation(null), [customerId]);

  const runEscalation = async () => {
    setEscalating(true);
    const res = await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: customerId }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setEscalation(
      res?.ok
        ? body
        : { error: body?.error === "no_api_key" ? "Add MCP_STUDIO_API_KEY to run this lookup." : body?.message ?? "Lookup failed." },
    );
    setEscalating(false);
  };

  const workspace = usage?.workspaces.find((w) => w.id === customerId);
  const limit = usage?.serversPerCustomer ?? 1;
  const atLimit = workspace?.servers != null && workspace.servers >= limit;
  const ranked = [...(usage?.workspaces ?? [])].sort((a, b) => (b.calls ?? -1) - (a.calls ?? -1));

  return (
    <main className="page">
      <section className="hero">
        <h1>HelpDesk IQ</h1>
        <p>
          Concept demo for a customer support SaaS. Each customer company gets its own workspace, and
          inside it builds MCP servers from its product docs, API references, and release notes. Pick
          a customer to act as their support admin.
        </p>
        <div className="switcher" aria-label="Customer workspace">
          {DEMO_USERS.map((u) => (
            <button key={u.id} aria-pressed={u.id === customerId} onClick={() => setCustomerId(u.id)}>
              {u.label} · {u.segment}
            </button>
          ))}
        </div>
        {usage?.plan && (
          <p className="muted" style={{ marginTop: 10 }}>
            HelpDesk IQ is on the SDK {usage.plan === "pro" ? "Pro" : "Free"} plan.{" "}
            {usage.branding ? BRANDING_COPY[usage.branding.mode] : null}
          </p>
        )}
      </section>

      <section className="grid">
        <div className="stack">
          <article className="card">
            <h2>Support Queue Snapshot</h2>
            {data ? (
              <>
                <div className="metric">
                  <div className="metric-box">
                    <strong>{data.queueSize}</strong>
                    Open tickets
                  </div>
                  <div className="metric-box">
                    <strong>{data.avgFirstResponseMins}m</strong>
                    Avg first response
                  </div>
                </div>
                <ul className="ticket-list" style={{ marginTop: 14 }}>
                  {data.tickets.map((ticket) => (
                    <li className="ticket" key={ticket.id}>
                      <div className="ticket-title">
                        {ticket.id} · {ticket.title}
                      </div>
                      <span className="badge">
                        {ticket.priority} · {ticket.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Loading support queue...</p>
            )}
          </article>

          <article className="card">
            <h2>Which customers lean on AI context</h2>
            <p className="muted">
              For the support manager: customers ranked by MCP requests served, from the REST API
              with your integrator API key. The full per-customer breakdown is in Business
              Intelligence.
            </p>
            {!usage?.hasApiKey ? (
              <ApiKeyNotice />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Servers</th>
                    <th>MCP requests</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((w) => (
                    <tr key={w.id}>
                      <td>{w.label}</td>
                      <td>{w.error ? "—" : `${w.servers} of ${limit}`}</td>
                      <td>{w.error ? <span className="muted">{w.error}</span> : w.calls}</td>
                      <td>
                        <a href={`${BI_URL}?endUserId=${encodeURIComponent(w.id)}`} target="_blank" rel="noreferrer">
                          Drill down
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="card">
            <h2>Escalation lookup</h2>
            <p className="muted">
              Before replying to {customer.label}, see what they have connected. This calls the{" "}
              <code>list_servers</code> tool on Headless Context MCP from the backend, acting as{" "}
              {customer.label} through the <code>X-MCP-Studio-End-User</code> header.
            </p>
            <button className="button primary" onClick={runEscalation} disabled={escalating}>
              {escalating ? "Looking up…" : `Look up ${customer.label}`}
            </button>
            {escalation && "error" in escalation && (
              <p className="notice error" style={{ marginTop: 12 }}>{escalation.error}</p>
            )}
            {escalation && "servers" in escalation && (
              <ul className="ticket-list" style={{ marginTop: 12 }}>
                {escalation.servers.length === 0 && <li className="muted">No servers yet.</li>}
                {escalation.servers.map((s) => (
                  <li className="ticket" key={s.id}>
                    <div className="ticket-title">{s.name}</div>
                    <span className="badge">
                      {s.status} · {s.visibility} · {s.totalCalls} requests
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <article className="card">
          <h2>{customer.label}&apos;s MCP servers</h2>
          <p className="muted">
            {customer.label}&apos;s admins build and manage servers here without an MCP Studio account.
            Their limits come from HelpDesk IQ&apos;s SDK plan, not from MCP Studio&apos;s free tier.
          </p>
          {workspace?.servers != null && (
            <div style={{ margin: "10px 0 14px" }}>
              <div className="muted">
                {workspace.servers} of {limit} server{limit === 1 ? "" : "s"} used
              </div>
              <div className="meter">
                <span style={{ width: `${Math.min(100, (workspace.servers / limit) * 100)}%` }} />
              </div>
            </div>
          )}
          <McpStudioEmbed
            containerId="helpdesk-mcp-studio"
            endUserId={customerId}
            onServerCreated={refreshUsage}
            onViewChange={refreshUsage}
            createBlocked={
              atLimit ? (
                <div className="notice warn">
                  <strong>{customer.label} is using all {limit} of its MCP servers.</strong>
                  <p style={{ margin: "6px 0 0" }}>
                    Remove one under <em>My servers</em> to build another, or ask your HelpDesk IQ
                    account manager about the Scale plan for up to 10 per workspace.
                  </p>
                </div>
              ) : undefined
            }
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
