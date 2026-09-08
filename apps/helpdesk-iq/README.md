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

This demo needs your own MCP Studio SDK credentials. It will not render the wizard without them, by design: a half-configured embed teaches the wrong integration, and the missing piece would only surface later as an attribution or billing question.

### 1. Get your credentials

Sign in to the [MCP Studio SDK portal](https://appatools.com/mcp-studio-sdk/portal) and copy your **Client ID** and **Client Secret**. The secret is shown in full only when you generate it.

### 2. Configure the app

```bash
npm install
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
MCP_STUDIO_CLIENT_ID=your_client_id_here
MCP_STUDIO_CLIENT_SECRET=your_client_secret_here
```

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The wizard renders in the right-hand card.

If a credential is missing or wrong, that card tells you which one and what to do about it rather than failing silently. Restart the dev server after editing `.env.local`, since Next.js reads it at startup.

## How credentials flow through this app

Your Client ID is public and reaches the browser. Your Client Secret must not, so it never leaves the server:

| File | Runs on | Sees the secret |
|------|---------|-----------------|
| `src/lib/mcp-studio.ts` | Server | Yes, reads it from the environment |
| `src/app/api/mcp-studio/session/route.ts` | Server | Yes, exchanges it for a short-lived token |
| `src/components/McpStudioEmbed.tsx` | Browser | No, receives only the client ID and the token |

The token proves the session belongs to your integration. It expires in 15 minutes and can be spent once, so this app mints a fresh one per page load instead of caching it.

Neither variable is prefixed `NEXT_PUBLIC_`. Next.js inlines any `NEXT_PUBLIC_*` value into the JavaScript bundle, so naming the secret that way would publish it to every visitor. MCP Studio also refuses the token exchange when it arrives from a browser, which turns that mistake into a loud failure rather than a quiet leak.

Full explanation: [Verify embed sessions](https://docs.appatools.com/sdk/guides/attribution-tokens).
