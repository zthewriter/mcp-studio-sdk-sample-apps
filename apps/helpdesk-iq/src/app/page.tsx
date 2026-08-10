"use client";

import { useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";

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

export default function HomePage() {
  const [data, setData] = useState<TicketResponse | null>(null);

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((json: TicketResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1>HelpDesk IQ</h1>
        <p>
          Concept demo for a customer support SaaS where each customer can build their own MCP server
          from docs, API references, and release notes directly inside the support portal.
        </p>
      </section>

      <section className="grid">
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
          <h2>Embedded MCP Studio SDK</h2>
          <p>
            Customers launch this wizard to create a product-specific MCP server for support agents.
            In production, this reduces repetitive context gathering and improves answer quality.
          </p>
          <McpStudioEmbed containerId="helpdesk-mcp-studio" />
        </article>
      </section>
    </main>
  );
}
