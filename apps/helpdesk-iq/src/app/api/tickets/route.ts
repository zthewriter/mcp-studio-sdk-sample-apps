import { NextResponse } from "next/server";

const tickets = [
  { id: "T-4001", title: "Webhook auth error for Acme workspace", priority: "High", status: "Open" },
  { id: "T-4002", title: "Need endpoint examples for SDK v2 migration", priority: "Medium", status: "Open" },
  { id: "T-3998", title: "Troubleshoot ingestion timeout from docs portal", priority: "Low", status: "Pending" },
];

export async function GET() {
  return NextResponse.json({
    queueSize: tickets.length,
    avgFirstResponseMins: 14,
    tickets,
  });
}
