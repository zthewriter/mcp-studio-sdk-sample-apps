# KnowledgeCloud LMS (Sample App)

A simple Next.js fullstack demo for an **enterprise training/LMS platform** embedding MCP Studio SDK.

## Concept

An LMS provider lets each enterprise customer create MCP servers from:

- Onboarding handbooks
- SOPs
- Internal technical guides
- Course documentation

This powers context-grounded AI tutors and assistants for learners and managers.

## Why this company benefits

- More accurate training assistants using approved course content
- Less confusion from inconsistent or outdated answers
- Faster onboarding for new hires
- Lower dependence on custom AI integrations for each customer

## Where MCP Studio is embedded

See `src/app/page.tsx`:

- Right-side card: `"Embedded MCP Studio SDK"`
- Rendered by `src/components/McpStudioEmbed.tsx`

## Example SDK customizations in this demo

- Horizontal wizard to fit an LMS admin workflow
- Tool mix focused on search/summarization use cases for learning content
- Source mix including docs and GitHub for technical training
- Teal accent palette to mimic learning platform styling

## Fullstack pieces

- `src/app/api/courses/route.ts` provides mock program and course metrics
- The page fetches those metrics client-side and shows business context next to the embed

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set your client ID:

```bash
NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID=your_client_id_here
```
