# PolicyPilot (Sample App)

A simple Next.js fullstack demo for a **compliance + legal operations platform** that embeds MCP Studio SDK.

## Concept

Enterprises use PolicyPilot to keep policy and audit workflows organized.  
With embedded MCP Studio SDK, each team can create an MCP server from:

- Internal policies
- Security controls documentation
- Regulatory frameworks and checklists
- Evidence repositories

## Why this company benefits

- Better grounded answers for policy and control questions
- Less risk from hallucinated compliance guidance
- Faster audit prep with easier retrieval of approved source content
- Self-serve setup for compliance teams without custom engineering

## Where MCP Studio is embedded

See `src/app/page.tsx`:

- Right-side card: `"Embedded MCP Studio SDK"`
- Rendered by `src/components/McpStudioEmbed.tsx`

## Example SDK customizations in this demo

- Vertical layout for a policy workflow dashboard
- Tool set tuned toward documentation retrieval and summarization
- Source selection that emphasizes policy documentation and existing MCP sources
- Enterprise-style color palette

## Fullstack pieces

- `src/app/api/policies/route.ts` provides mock control status and audit metrics
- The page fetches this data and shows business context alongside the SDK embed

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
