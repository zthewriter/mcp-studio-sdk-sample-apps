/**
 * HelpDesk IQ's customers. Each customer company is one Raglantern end user,
 * so its servers, dashboard, and analytics are separate from every other
 * customer's. None of them needs a Raglantern account.
 */
export const DEMO_USERS = [
  { id: "helpdesk-acme", label: "Acme Robotics", segment: "Enterprise" },
  { id: "helpdesk-globex", label: "Globex Payments", segment: "Growth" },
  { id: "helpdesk-initech", label: "Initech Cloud", segment: "Starter" },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];

export function findDemoUser(id: string | null | undefined): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}
