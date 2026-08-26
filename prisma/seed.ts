import bcrypt from "bcryptjs";
import {
  AccountStatus,
  PriorityLevel,
  TargetAudience,
  UserRole,
  VoteType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding database...");

  // Hash the default password
  const defaultPasswordHash = await bcrypt.hash("123swe", 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@juniv.edu" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.SYSTEM_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  // 2. Create Students
  const student1 = await prisma.user.upsert({
    where: { email: "student1@juniv.edu" },
    update: {},
    create: {
      name: "Alice Student",
      email: "student1@juniv.edu",
      passwordHash: defaultPasswordHash,
      batch: "50",
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: "student2@juniv.edu" },
    update: {},
    create: {
      name: "Bob Student",
      email: "student2@juniv.edu",
      passwordHash: defaultPasswordHash,
      batch: "51",
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
    },
  });

  // 3. Create a Subforum
  const subforum = await prisma.subforum.upsert({
    where: { name: "General Discussion" },
    update: {},
    create: {
      name: "General Discussion",
      description: "A place for general university discussions.",
      isApproved: true,
      ownerId: admin.id,
    },
  });

  // 4. Create Posts (Clear existing dummy posts first to prevent endless duplicates on re-runs)
  await prisma.post.deleteMany();

  const post = await prisma.post.create({
    data: {
      title: "Welcome to the JU Forum!",
      content: "This is the first post. Feel free to start discussions here.",
      authorId: admin.id,
      subforumId: subforum.id,
    },
  });

  // 5. Create an Announcement
  await prisma.announcement.deleteMany();

  await prisma.announcement.create({
    data: {
      title: "Sprint 1 Launch",
      content: "Core features are now live for testing.",
      priority: PriorityLevel.HIGH,
      targetAudience: TargetAudience.ALL,
      authorId: admin.id,
    },
  });

  // 6. Create a Vote
  await prisma.postVote.deleteMany();

  await prisma.postVote.create({
    data: {
      userId: student1.id,
      postId: post.id,
      type: VoteType.UPVOTE,
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
