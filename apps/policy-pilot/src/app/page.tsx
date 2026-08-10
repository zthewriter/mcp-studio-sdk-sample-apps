"use client";

import { useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";

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

export default function HomePage() {
  const [data, setData] = useState<PolicyResponse | null>(null);

  useEffect(() => {
    fetch("/api/policies")
      .then((res) => res.json())
      .then((json: PolicyResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1>PolicyPilot</h1>
        <p>
          Concept demo for a compliance and legal operations platform where each customer builds an
          MCP server from internal policies, controls, and audit evidence.
        </p>
      </section>

      <section className="grid">
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
          <h2>Embedded MCP Studio SDK</h2>
          <p>
            Compliance managers create a dedicated MCP server for each framework domain (SOC 2, ISO,
            HIPAA), so policy assistants answer using approved and current source documents.
          </p>
          <McpStudioEmbed containerId="policy-mcp-studio" />
        </article>
      </section>
    </main>
  );
}
