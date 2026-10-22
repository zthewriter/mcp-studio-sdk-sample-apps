# PolicyPilot (Sample App)

A simple Next.js fullstack demo for a **compliance + legal operations platform** that embeds Raglantern SDK.

## Concept

Enterprises use PolicyPilot to keep policy and audit workflows organized.  
With embedded Raglantern SDK, each team can create an MCP server from:

- Internal policies
- Security controls documentation
- Regulatory frameworks and checklists
- Evidence repositories

## Why this company benefits

- Better grounded answers for policy and control questions
- Less risk from hallucinated compliance guidance
- Faster audit prep with easier retrieval of approved source content
- Self-serve setup for compliance teams without custom engineering

## Demo policy document

The wizard has nothing indexed until you give it a source. This app includes a public sample policy, the Harborline Ferries terms of carriage:

https://zthewriter.github.io/harborline-brand/terms-of-carriage.pdf

Press **Provision** to create a server from it through the REST API, or paste the URL into the wizard. File uploads need a Raglantern sign-in, so embedded end users add documents by URL. Harborline Ferries is a fictional operator. The document is a demo asset, not a real contract.

## Where Raglantern is embedded

See `src/app/page.tsx`:

- Right-side card: `"Embedded Raglantern SDK"`
- Rendered by `src/components/McpStudioEmbed.tsx`

## Example SDK customizations in this demo

- Vertical layout for a policy workflow dashboard
- Tool set tuned toward documentation retrieval and summarization
- Source selection that emphasizes policy documentation and existing MCP sources
- Enterprise-style color palette

## SDK features in this app

Each framework owner (SOC 2, HIPAA, ISO 27001) is one Raglantern end user, so you switch owners at the top of the page.

| Feature | How PolicyPilot uses it | Where |
|---|---|---|
| End-user accounts | Each owner gets their own policy servers, dashboard, and analytics | `src/lib/demo-users.ts`, `src/app/api/mcp-studio/session/route.ts` |
| Portal API key + REST | **Provision** creates the owner's approved-policy server from the backend, with no wizard | `src/app/api/provision/route.ts` |
| Limits | A second provision is refused, and the refusal is shown as Raglantern wrote it for end users | `src/app/api/provision/route.ts` |
| Business Intelligence | Audit evidence lists each server's access, requests, and answer rate, with a deep link to the owner in the portal | `src/app/api/audit/route.ts` |
| Branding | The audit card carries a vendor disclosure line based on the plan's branding | `src/app/api/audit/route.ts` |
| Headless MCP | **Restrict** runs `set_server_visibility` as the owner; a Cursor `mcp.json` snippet shows the same connection | `src/app/api/restrict/route.ts` |

The API-key panels need `MCP_STUDIO_API_KEY`; without it they say how to add one.

## Fullstack pieces

- `src/app/api/policies/route.ts` provides mock control status and audit metrics
- The page fetches this data and shows business context alongside the SDK embed

## Run locally

This demo needs your own Raglantern SDK credentials. It will not render the wizard without them, by design: a half-configured embed teaches the wrong integration, and the missing piece would only surface later as an attribution or billing question.

### 1. Get your credentials

Sign in to the [Raglantern SDK portal](https://appatools.com/mcp-studio-sdk/portal) and copy your **Client ID** and **Client Secret**. The secret is shown in full only when you generate it.

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

Open [http://localhost:3001](http://localhost:3001). The wizard renders in the right-hand card.

If a credential is missing or wrong, that card tells you which one and what to do about it rather than failing silently. Restart the dev server after editing `.env.local`, since Next.js reads it at startup.

## How credentials flow through this app

Your Client ID is public and reaches the browser. Your Client Secret must not, so it never leaves the server:

| File | Runs on | Sees the secret |
|------|---------|-----------------|
| `src/lib/mcp-studio.ts` | Server | Yes, reads it from the environment |
| `src/app/api/mcp-studio/session/route.ts` | Server | Yes, exchanges it for a short-lived token |
| `src/components/McpStudioEmbed.tsx` | Browser | No, receives only the client ID and the token |

The token proves the session belongs to your integration. It expires in 15 minutes and can be spent once, so this app mints a fresh one per page load instead of caching it.

Neither variable is prefixed `NEXT_PUBLIC_`. Next.js inlines any `NEXT_PUBLIC_*` value into the JavaScript bundle, so naming the secret that way would publish it to every visitor. Raglantern also refuses the token exchange when it arrives from a browser, which turns that mistake into a loud failure rather than a quiet leak.

Full explanation: [Verify embed sessions](https://docs.appatools.com/sdk/guides/attribution-tokens).
