import { NextResponse } from "next/server";

const courses = [
  { code: "ENG-101", title: "New Hire Engineering Onboarding", completion: 82, learners: 141 },
  { code: "SEC-220", title: "Security Foundations", completion: 74, learners: 97 },
  { code: "DOC-310", title: "Internal Documentation Standards", completion: 89, learners: 53 },
];

export async function GET() {
  return NextResponse.json({
    activePrograms: courses.length,
    avgCompletionRate: 81,
    courses,
  });
}
