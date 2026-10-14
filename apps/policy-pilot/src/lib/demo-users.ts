/**
 * PolicyPilot's users are compliance framework owners. Each owner is one MCP
 * Studio end user, so the SOC 2 owner's servers and analytics are separate
 * from the HIPAA owner's. None of them needs an MCP Studio account.
 */
export const DEMO_USERS = [
  { id: "policy-soc2-owner", label: "Priya Raman", framework: "SOC 2" },
  { id: "policy-hipaa-owner", label: "Marcus Lee", framework: "HIPAA" },
  { id: "policy-iso-owner", label: "Elena Sorensen", framework: "ISO 27001" },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];

export function findDemoUser(id: string | null | undefined): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}

/** The ready-made policy document this sample provisions from. */
export const HARBORLINE_TERMS_URL = "https://zthewriter.github.io/harborline-brand/terms-of-carriage.pdf";
