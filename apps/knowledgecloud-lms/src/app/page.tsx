"use client";

import { useCallback, useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";
import { DEMO_USERS, type DemoUser } from "../lib/demo-users";

type Course = {
  code: string;
  title: string;
  completion: number;
  learners: number;
};

type CourseResponse = {
  activePrograms: number;
  avgCompletionRate: number;
  courses: Course[];
};

type Instructor = DemoUser & {
  servers: { id: string; name: string; totalCalls: number }[] | null;
  error: string | null;
};

type Roster = {
  clientId: string;
  plan: "free" | "pro" | null;
  serversPerInstructor: number;
  monthlyRequests: number;
  hasApiKey: boolean;
  instructors: Instructor[];
};

type Branding = { appName: string; plan: string; branding: { mode: "appa" | "custom" | "none"; logoUrl: string | null; name: string | null } };

const ADMIN = "admin";
const BI_URL = "https://appatools.com/mcp-studio-sdk/portal/analytics";
// Public endpoint, so the browser calls it directly with the public client id.
const EMBED_CONFIG_URL = "https://appatools.com/mcp-studio/api/sdk/embed-config";

export default function HomePage() {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [role, setRole] = useState<string>(DEMO_USERS[0].id);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [retiring, setRetiring] = useState<string | null>(null);
  const [retireError, setRetireError] = useState<string | null>(null);

  const instructor = DEMO_USERS.find((u) => u.id === role);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((json: CourseResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  const refreshRoster = useCallback(() => {
    fetch("/api/roster", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: Roster | null) => setRoster(json))
      .catch(() => setRoster(null));
  }, []);

  useEffect(refreshRoster, [refreshRoster]);

  useEffect(() => {
    if (!roster?.clientId) return;
    fetch(`${EMBED_CONFIG_URL}?clientId=${encodeURIComponent(roster.clientId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: Branding | null) => setBranding(json))
      .catch(() => setBranding(null));
  }, [roster?.clientId]);

  const retire = async (user: Instructor, server: { id: string; name: string }) => {
    if (!window.confirm(`Retire “${server.name}” for ${user.label}? ${user.label} can restore it from My servers for 7 days.`)) return;
    setRetiring(server.id);
    setRetireError(null);
    const res = await fetch("/api/retire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: user.id, server: server.id, confirmed: true }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setRetireError(body?.message ?? "Could not retire that course server.");
    }
    setRetiring(null);
    refreshRoster();
  };

  const seats = roster?.serversPerInstructor ?? 1;
  const mine = roster?.instructors.find((i) => i.id === role);
  const seatTaken = mine?.servers != null && mine.servers.length >= seats;

  return (
    <main className="page">
      <section className="hero">
        <h1>KnowledgeCloud LMS</h1>
        <p>
          Concept demo for an enterprise training platform. Every instructor builds an MCP server for
          their course, so AI tutors answer from approved learning content. Sign in as an instructor,
          or as the learning admin who oversees them.
        </p>
        <div className="switcher" aria-label="Signed in as">
          {DEMO_USERS.map((u) => (
            <button key={u.id} aria-pressed={u.id === role} onClick={() => setRole(u.id)}>
              {u.label} · {u.course}
            </button>
          ))}
          <button aria-pressed={role === ADMIN} onClick={() => setRole(ADMIN)}>
            Learning admin
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="stack">
          <article className="card">
            <h2>Learning Operations Snapshot</h2>
            {data ? (
              <>
                <div className="metric">
                  <div className="metric-box">
                    <strong>{data.activePrograms}</strong>
                    Active programs
                  </div>
                  <div className="metric-box">
                    <strong>{data.avgCompletionRate}%</strong>
                    Avg completion
                  </div>
                </div>
                <ul className="ticket-list" style={{ marginTop: 14 }}>
                  {data.courses.map((course) => (
                    <li className="ticket" key={course.code}>
                      <div className="ticket-title">
                        {course.code} · {course.title}
                      </div>
                      <span className="badge">
                        {course.completion}% complete · {course.learners} learners
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Loading course analytics...</p>
            )}
          </article>

          <article className="card">
            <h2>What instructors see</h2>
            <p className="muted">
              Branding on the embedded screens is set by KnowledgeCloud&apos;s SDK plan, read here from
              the public embed config. Free always shows the Appa Tools watermark; Pro can show your
              own logo or none.
            </p>
            {branding ? (
              <div className="notice" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {branding.branding.mode === "custom" && branding.branding.logoUrl ? (
                  <img src={branding.branding.logoUrl} alt="" width={32} height={32} style={{ borderRadius: 6 }} />
                ) : null}
                <div>
                  <strong>
                    {branding.branding.mode === "appa"
                      ? "Powered by Appa Tools"
                      : branding.branding.mode === "custom"
                        ? branding.branding.name ?? branding.appName
                        : "No watermark"}
                  </strong>
                  <div className="muted">SDK {branding.plan === "pro" ? "Pro" : "Free"} plan</div>
                </div>
              </div>
            ) : (
              <p className="muted">Loading branding…</p>
            )}
          </article>
        </div>

        {instructor ? (
          <article className="card">
            <h2>{instructor.course}</h2>
            <p className="muted">
              {instructor.label} builds the course server here without an MCP Studio account. The
              Analytics tab shows how learners&apos; tutors are using it.
            </p>
            <McpStudioEmbed
              containerId="lms-mcp-studio"
              endUserId={instructor.id}
              onServerCreated={refreshRoster}
              onViewChange={refreshRoster}
              createBlocked={
                seatTaken ? (
                  <div className="notice warn">
                    <strong>Your course server seat is in use.</strong>
                    <p style={{ margin: "6px 0 0" }}>
                      Each instructor has {seats} on KnowledgeCloud&apos;s plan. Ask your learning
                      admin to retire a finished course, or update the existing server under{" "}
                      <em>My servers</em>.
                    </p>
                  </div>
                ) : undefined
              }
            />
          </article>
        ) : (
          <article className="card">
            <h2>Instructor roster</h2>
            <p className="muted">
              Each instructor has {seats} course server seat{seats === 1 ? "" : "s"}, and all of them
              share KnowledgeCloud&apos;s {roster?.monthlyRequests.toLocaleString() ?? "1,000"} MCP
              requests a month. Instructors never see MCP Studio&apos;s own free-tier limits.
            </p>
            {!roster?.hasApiKey ? (
              <div className="notice">
                Add an integrator API key as <code>MCP_STUDIO_API_KEY</code> in <code>.env.local</code>{" "}
                to see the roster. Create one at{" "}
                <a href="https://appatools.com/mcp-studio-sdk/portal/api-keys" target="_blank" rel="noreferrer">
                  Portal → API keys
                </a>
                , then restart the dev server.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Seats</th>
                    <th>Course servers</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {roster.instructors.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.label}
                        <div className="muted">{i.course}</div>
                      </td>
                      <td>{i.servers ? `${i.servers.length} of ${seats}` : "—"}</td>
                      <td>
                        {i.error && <span className="muted">{i.error}</span>}
                        {i.servers?.length === 0 && <span className="muted">None yet</span>}
                        {i.servers?.map((s) => (
                          <div key={s.id} style={{ marginBottom: 4 }}>
                            {s.name} · {s.totalCalls} requests{" "}
                            <button className="button" onClick={() => retire(i, s)} disabled={retiring === s.id}>
                              {retiring === s.id ? "Retiring…" : "Retire"}
                            </button>
                          </div>
                        ))}
                      </td>
                      <td>
                        <a href={`${BI_URL}?endUserId=${encodeURIComponent(i.id)}`} target="_blank" rel="noreferrer">
                          Insights
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {retireError && <p className="notice error" style={{ marginTop: 12 }}>{retireError}</p>}
            <p className="muted" style={{ marginBottom: 0 }}>
              Retire runs <code>delete_server</code> on Headless Context MCP as that instructor, through
              the <code>X-MCP-Studio-End-User</code> header. Insights opens that instructor in Business
              Intelligence.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
