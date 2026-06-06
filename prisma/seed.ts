import { PrismaClient, JobStatus, MembershipRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ORG_ID = "00000000-1111-1111-1111-000000000001";
const USER_ID = "00000000-1111-1111-1111-000000000002";

const CUSTOMER_1 = "00000000-0000-0000-0000-000000000001";
const CUSTOMER_2 = "00000000-0000-0000-0000-000000000002";
const LOC_1 = "10000000-0000-0000-0000-000000000001";
const LOC_2 = "10000000-0000-0000-0000-000000000002";
const MAT_1 = "30000000-0000-0000-0000-000000000001";
const MAT_2 = "30000000-0000-0000-0000-000000000002";
const MAT_3 = "30000000-0000-0000-0000-000000000003";
const MAT_4 = "30000000-0000-0000-0000-000000000004";
const EMP_1 = "20000000-0000-0000-0000-000000000001";
const EMP_2 = "20000000-0000-0000-0000-000000000002";

const JOB_1 = "a1b2c3d4-e5f6-4789-a012-000000000001";
const JOB_2 = "a1b2c3d4-e5f6-4789-a012-000000000002";

async function main() {
  const passwordHash = bcrypt.hashSync("demo123", 10);

  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      name: "JRC Shop (Demo)",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@jrc.local" },
    update: { passwordHash },
    create: {
      id: USER_ID,
      email: "demo@jrc.local",
      name: "Demo User",
      passwordHash,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: { userId: USER_ID, organizationId: ORG_ID },
    },
    update: { role: MembershipRole.owner },
    create: {
      userId: USER_ID,
      organizationId: ORG_ID,
      role: MembershipRole.owner,
    },
  });

  const now = new Date();
  const calendarDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const todayStart = calendarDay(now);
  const scheduled1 = new Date(todayStart);
  scheduled1.setDate(scheduled1.getDate() + 3);
  const scheduled2 = new Date(todayStart);
  scheduled2.setDate(scheduled2.getDate() + 7);

  const created1 = new Date(now);
  created1.setDate(created1.getDate() - 10);
  const created2 = new Date(now);
  created2.setDate(created2.getDate() - 5);

  await prisma.customer.upsert({
    where: { id: CUSTOMER_1 },
    update: {},
    create: {
      id: CUSTOMER_1,
      organizationId: ORG_ID,
      name: "John Smith",
      primaryContactName: "John Smith",
      phoneNumber: "555-0101",
      email: "john.smith@example.com",
      address: "123 Main Street, Springfield, IL 62701",
    },
  });

  await prisma.customer.upsert({
    where: { id: CUSTOMER_2 },
    update: {},
    create: {
      id: CUSTOMER_2,
      organizationId: ORG_ID,
      name: "Sarah Johnson",
      primaryContactName: "Sarah Johnson",
      phoneNumber: "555-0102",
      email: "sarah.j@example.com",
      address: "456 Oak Avenue, Springfield, IL 62702",
    },
  });

  await prisma.location.upsert({
    where: { id: LOC_1 },
    update: {},
    create: {
      id: LOC_1,
      organizationId: ORG_ID,
      customerId: CUSTOMER_1,
      name: "Main Residence",
      formattedAddress: "123 Main Street, Springfield, IL 62701",
      notes: "Primary residence, two-story home",
    },
  });

  await prisma.location.upsert({
    where: { id: LOC_2 },
    update: {},
    create: {
      id: LOC_2,
      organizationId: ORG_ID,
      customerId: CUSTOMER_2,
      name: "Oak Avenue Property",
      formattedAddress: "456 Oak Avenue, Springfield, IL 62702",
      notes: "Single-story home, south-facing roof",
    },
  });

  for (const m of [
    {
      id: MAT_1,
      name: "Architectural Shingles - Black",
      sku: "SH-BLK-ARCH",
      unit: "square",
    },
    {
      id: MAT_2,
      name: "Roofing Felt",
      sku: "FELT-15",
      unit: "square",
    },
    {
      id: MAT_3,
      name: "Drip Edge",
      sku: "DE-AL-6",
      unit: "linear feet",
    },
    {
      id: MAT_4,
      name: "Roofing Cement",
      sku: "CEM-PL-1",
      unit: "tube",
    },
  ]) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        organizationId: ORG_ID,
        name: m.name,
        sku: m.sku,
        unit: m.unit,
      },
    });
  }

  for (const e of [
    {
      id: EMP_1,
      name: "John Doe",
      phone: "555-0201",
      em: "john.doe@example.com",
      role: "Foreman",
    },
    {
      id: EMP_2,
      name: "Jane Smith",
      phone: "555-0202",
      em: "jane.smith@example.com",
      role: "Laborer",
    },
  ]) {
    await prisma.employee.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        organizationId: ORG_ID,
        name: e.name,
        phoneNumber: e.phone,
        email: e.em,
        role: e.role,
      },
    });
  }

  await prisma.job.upsert({
    where: { id: JOB_1 },
    update: {},
    create: {
      id: JOB_1,
      organizationId: ORG_ID,
      jobNumber: `${now.getFullYear()}-00001`,
      title: "Full Roof Replacement - Main Residence",
      customerId: CUSTOMER_1,
      locationId: LOC_1,
      createdAt: created1,
      scheduledDate: scheduled1,
      lastActivityAt: created1,
      priorityOffset: 0,
      status: JobStatus.scheduled,
      description:
        "Complete tear-off and replacement of existing asphalt shingle roof. Customer prefers morning start time.",
      internalNotes:
        "Customer mentioned potential water damage in attic. Inspect before starting work. Order extra shingles for gable ends.",
    },
  });

  await prisma.jobEmployeeHours.deleteMany({ where: { jobId: JOB_1 } });
  await prisma.jobEmployee.deleteMany({ where: { jobId: JOB_1 } });
  await prisma.jobMaterial.deleteMany({ where: { jobId: JOB_1 } });

  await prisma.jobMaterial.createMany({
    data: [
      {
        jobId: JOB_1,
        materialId: MAT_1,
        quantity: 35,
        unitOverride: "squares",
      },
      {
        jobId: JOB_1,
        materialId: MAT_2,
        quantity: 35,
        unitOverride: "squares",
      },
      {
        jobId: JOB_1,
        materialId: MAT_3,
        quantity: 120,
        unitOverride: "linear feet",
      },
    ],
  });

  await prisma.jobEmployeeHours.createMany({
    data: [
      {
        jobId: JOB_1,
        employeeId: EMP_1,
        employeeName: "John Doe",
        hours: 8,
      },
      {
        jobId: JOB_1,
        employeeId: EMP_2,
        employeeName: "Jane Smith",
        hours: 6.5,
      },
    ],
  });

  await prisma.jobEmployee.createMany({
    data: [
      { jobId: JOB_1, employeeId: EMP_1, sortOrder: 0 },
      { jobId: JOB_1, employeeId: EMP_2, sortOrder: 1 },
    ],
  });

  await prisma.job.upsert({
    where: { id: JOB_2 },
    update: {},
    create: {
      id: JOB_2,
      organizationId: ORG_ID,
      jobNumber: `${now.getFullYear()}-00002`,
      title: "Shingle Repair - Oak Avenue",
      customerId: CUSTOMER_2,
      locationId: LOC_2,
      createdAt: created2,
      scheduledDate: scheduled2,
      lastActivityAt: created2,
      priorityOffset: 0,
      status: JobStatus.approved,
      description:
        "Repair damaged shingles on south-facing side of roof. Check for underlying water damage.",
      internalNotes:
        "Customer reported missing shingles after recent storm. Insurance claim pending.",
    },
  });

  await prisma.jobEmployeeHours.deleteMany({ where: { jobId: JOB_2 } });
  await prisma.jobEmployee.deleteMany({ where: { jobId: JOB_2 } });
  await prisma.jobMaterial.deleteMany({ where: { jobId: JOB_2 } });

  await prisma.jobMaterial.createMany({
    data: [
      {
        jobId: JOB_2,
        materialId: MAT_1,
        quantity: 2,
        unitOverride: "bundles",
        note: "Replacement shingles",
      },
      {
        jobId: JOB_2,
        materialId: MAT_4,
        quantity: 1,
        unitOverride: "tube",
      },
    ],
  });

  console.log("Seed complete: demo@jrc.local / demo123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
