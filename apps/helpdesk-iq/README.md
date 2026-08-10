# HelpDesk IQ (Sample App)

A simple Next.js fullstack demo for a **customer support platform** that embeds MCP Studio SDK.

## Concept

A support software company lets each customer create their own MCP server from:

- Product docs
- API references
- Changelogs
- Known issue pages

Agents then query grounded context instead of relying on memory or scattered tabs.

## Why this company benefits

- Faster support responses
- Fewer incorrect answers and less hallucination in AI-assisted replies
- Customer-specific context without custom engineering per account
- Better onboarding for support reps and technical writers

## Where MCP Studio is embedded

See `src/app/page.tsx`:

- Right-side card: `"Embedded MCP Studio SDK"`
- Rendered by `src/components/McpStudioEmbed.tsx`

## Example SDK customizations in this demo

- Horizontal layout for a compact support-portal feel
- Tools enabled for doc and API retrieval
- Source types focused on websites/docs/GitHub
- Neutral color palette to match B2B support UI

## Fullstack pieces

- `src/app/api/tickets/route.ts` provides mock support queue metrics
- The page fetches this data client-side and displays operational context next to the MCP builder

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
