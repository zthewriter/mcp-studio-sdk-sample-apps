import { NextResponse } from "next/server";

const controls = [
  { id: "CTRL-12", framework: "SOC 2", title: "Access reviews updated quarterly", status: "At risk" },
  { id: "CTRL-21", framework: "ISO 27001", title: "Encryption standards documented", status: "Healthy" },
  { id: "CTRL-31", framework: "HIPAA", title: "Vendor risk register complete", status: "In review" },
];

export async function GET() {
  return NextResponse.json({
    upcomingAudits: 2,
    unresolvedFindings: 5,
    controls,
  });
}
