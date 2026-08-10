"use client";

import { useEffect, useState } from "react";
import McpStudioEmbed from "../components/McpStudioEmbed";

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

export default function HomePage() {
  const [data, setData] = useState<CourseResponse | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((json: CourseResponse) => setData(json))
      .catch(() => setData(null));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1>KnowledgeCloud LMS</h1>
        <p>
          Concept demo for an enterprise training platform where each team can create a course-specific
          MCP server from onboarding docs, SOPs, and learning content.
        </p>
      </section>

      <section className="grid">
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
          <h2>Embedded MCP Studio SDK</h2>
          <p>
            L&D teams create MCP servers for each course track so AI tutors answer with approved
            learning content. This keeps internal training accurate and easier to maintain.
          </p>
          <McpStudioEmbed containerId="lms-mcp-studio" />
        </article>
      </section>
    </main>
  );
}
