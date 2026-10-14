/**
 * KnowledgeCloud's instructors. Each instructor is one MCP Studio end user,
 * so the servers behind their course are theirs alone. None of them needs an
 * MCP Studio account.
 */
export const DEMO_USERS = [
  { id: "lms-instructor-maya", label: "Maya Chen", course: "Security Awareness 101" },
  { id: "lms-instructor-dev", label: "Dev Patel", course: "Sales Onboarding" },
  { id: "lms-instructor-sofia", label: "Sofia Alvarez", course: "Customer Success Academy" },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];

export function findDemoUser(id: string | null | undefined): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}
