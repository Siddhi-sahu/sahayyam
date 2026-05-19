import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { EvidenceQuality, TipCategory, Urgency } from "../src/modules/types";

const prisma = new PrismaClient();

const passwordHashPromise = bcrypt.hash("password123", 12);

const tips: Array<{
  title: string;
  body: string;
  summary: string;
  actionSteps: string[];
  category: TipCategory;
  urgency: Urgency;
  evidenceQuality: EvidenceQuality;
  sourceConfidence: number;
  deadlineOffsetDays: number;
  branchCode?: string;
}> = [
  {
    title: "Merit-cum-means scholarship closes before the public portal date",
    body: "The finance office internally validates income certificates two days before the portal deadline. Students who wait until the final day often miss the college approval step.",
    summary: "Upload scholarship documents early because internal finance approval closes before the public portal.",
    actionSteps: ["Upload income certificate this week", "Visit finance office before noon", "Keep acknowledgement receipt"],
    category: "SCHOLARSHIP",
    urgency: "CRITICAL",
    evidenceQuality: "DOCUMENTED",
    sourceConfidence: 94,
    deadlineOffsetDays: 3,
  },
  {
    title: "Prof. Raman writes stronger recommendations for students who attend office hours",
    body: "He asks for a short project note and remembers students who have discussed their work before asking for recommendation letters.",
    summary: "Start office-hour conversations before requesting faculty recommendation letters.",
    actionSteps: ["Prepare one-page project note", "Attend office hours twice", "Ask at least 14 days before deadline"],
    category: "FACULTY",
    urgency: "HIGH",
    evidenceQuality: "REPEATED_PATTERN",
    sourceConfidence: 86,
    deadlineOffsetDays: 7,
    branchCode: "CSE",
  },
  {
    title: "Cloud placement prep group recruits through lab assistant referrals",
    body: "The cloud prep group shares company sheets and mock interview slots before official placement training. Lab assistants nominate reliable second-year students.",
    summary: "Ask systems lab assistants about hidden cloud placement prep referrals.",
    actionSteps: ["Speak after Tuesday systems lab", "Show your GitHub project", "Ask for the next mock interview sheet"],
    category: "PLACEMENT",
    urgency: "CRITICAL",
    evidenceQuality: "DIRECT_EXPERIENCE",
    sourceConfidence: 90,
    deadlineOffsetDays: 5,
    branchCode: "CSE",
  },
  {
    title: "Robotics club design track has easier entry than core interviews",
    body: "The CAD/design task route gets fewer applicants and later allows students to move into the core build team.",
    summary: "Apply to robotics through the design track with one CAD file.",
    actionSteps: ["Prepare one annotated CAD file", "Message the design lead", "Attend the pre-tryout session"],
    category: "CLUB",
    urgency: "HIGH",
    evidenceQuality: "DIRECT_EXPERIENCE",
    sourceConfidence: 82,
    deadlineOffsetDays: 10,
    branchCode: "ME",
  },
  {
    title: "Mini-project marks depend on weekly demo logs, not only attendance",
    body: "Department mentors check weekly demo logs and Git timestamps when shortlisting students for funded project kits.",
    summary: "Keep weekly demo evidence for mini-project evaluation and kit shortlisting.",
    actionSteps: ["Maintain Git commits", "Take mentor initials weekly", "Record demo screenshots"],
    category: "DEPARTMENT_NORM",
    urgency: "MEDIUM",
    evidenceQuality: "REPEATED_PATTERN",
    sourceConfidence: 78,
    deadlineOffsetDays: 18,
    branchCode: "ECE",
  },
];

function futureDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}

async function main() {
  const passwordHash = await passwordHashPromise;

  const college = await prisma.college.upsert({
    where: { name: "Sahayyam Institute of Technology" },
    update: {},
    create: { name: "Sahayyam Institute of Technology", domain: "sahayyam.edu" },
  });

  const branches = await Promise.all(
    [
      ["Computer Science", "CSE"],
      ["Electronics and Communication", "ECE"],
      ["Mechanical Engineering", "ME"],
    ].map(([name, code]) =>
      prisma.branch.upsert({
        where: { collegeId_code: { collegeId: college.id, code } },
        update: { name },
        create: { name, code, collegeId: college.id },
      }),
    ),
  );

  const branchByCode = new Map(branches.map((branch) => [branch.code, branch]));
  const cse = branchByCode.get("CSE")!;

  const fresher = await prisma.user.upsert({
    where: { email: "fresher@sahayyam.edu" },
    update: {},
    create: {
      name: "Ananya Fresher",
      email: "fresher@sahayyam.edu",
      passwordHash,
      role: "FRESHER",
      collegeId: college.id,
      branchId: cse.id,
      semester: 2,
      isFirstGen: true,
      emailVerified: true,
    },
  });

  const senior = await prisma.user.upsert({
    where: { email: "senior@sahayyam.edu" },
    update: {},
    create: {
      name: "Aditi Senior",
      email: "senior@sahayyam.edu",
      passwordHash,
      role: "SENIOR",
      collegeId: college.id,
      branchId: cse.id,
      semester: 6,
      graduationYear: new Date().getFullYear() + 1,
      credibilityScore: 82,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sahayyam.edu" },
    update: {},
    create: {
      name: "Sahayyam Admin",
      email: "admin@sahayyam.edu",
      passwordHash,
      role: "ADMIN",
      collegeId: college.id,
      branchId: cse.id,
      credibilityScore: 90,
      emailVerified: true,
    },
  });

  for (const item of tips) {
    const branch = item.branchCode ? branchByCode.get(item.branchCode) : null;
    const tip = await prisma.tip.upsert({
      where: { id: `seed-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}` },
      update: {},
      create: {
        id: `seed-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`,
        title: item.title,
        body: item.body,
        summary: item.summary,
        actionSteps: item.actionSteps,
        category: item.category,
        urgency: item.urgency,
        evidenceQuality: item.evidenceQuality,
        sourceConfidence: item.sourceConfidence,
        deadline: futureDate(item.deadlineOffsetDays),
        status: "VERIFIED",
        authorId: senior.id,
        collegeId: college.id,
        branchId: branch?.id,
        signalRank: 80,
      },
    });

    await prisma.tipVerification.upsert({
      where: { tipId_userId: { tipId: tip.id, userId: fresher.id } },
      update: {},
      create: { tipId: tip.id, userId: fresher.id, type: "VERIFY", note: "Seed verification for demo." },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
