# MCP Studio SDK Sample Apps

Public demo apps showing different ways companies can embed **MCP Studio SDK** in a Next.js fullstack product.

These are intentionally simple, concept-first examples for inspiration. They do **not** include any confidential MCP Studio internals or private credentials.

## Apps in this repo

- `apps/helpdesk-iq`  
  Customer support platform concept where teams create MCP servers from product docs and knowledge bases.

- `apps/policy-pilot`  
  Compliance/legal operations concept where companies build MCP servers from policy and regulatory content.

- `apps/knowledgecloud-lms`  
  Learning enablement concept where training teams create course-specific MCP servers for onboarding and internal education.

## What each sample includes

- Next.js App Router fullstack setup
- One API route with mock business data
- An `McpStudioEmbed` component that loads `https://sdk.appatools.com/embed.js`
- Safe placeholder SDK config (`NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID`)
- A README explaining:
  - the company concept
  - where and why MCP Studio SDK is embedded
  - example customization choices (tools, sources, layout, colors)

## Quick start

From this repo root:

```bash
npm install
npm run dev:helpdesk
```

Or run any app directly:

```bash
cd apps/policy-pilot
npm install
npm run dev
```

## Environment

Each app contains `.env.example`. Copy to `.env.local` and update:

```bash
NEXT_PUBLIC_MCP_STUDIO_CLIENT_ID=demo_client_id_replace_me
```

## Notes

- These demos are intentionally lightweight and UI-first.
- Replace mock API data and branding with your own to create tailored demos.
- If you are pitching enterprise use cases, focus on how MCP servers improve grounding, accuracy, and trust in AI responses.
