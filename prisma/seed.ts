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
  console.log("Wiping existing data...");

  // 1. Clear tables in reverse dependency order
  await prisma.$transaction([
    prisma.postVote.deleteMany(),
    prisma.post.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.subforum.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Seeding database...");

  const defaultPasswordHash = await bcrypt.hash("123swe", 10);

  // 2. Create Users
  const sysadmin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "sysadmin@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.SYSTEM_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Student One",
      email: "student1@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      name: "Student Two",
      email: "student2@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      name: "Faculty One",
      email: "faculty1@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.FACULTY,
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      name: "Staff One",
      email: "staff1@juniv.edu",
      passwordHash: defaultPasswordHash,
      role: UserRole.STAFF,
      status: AccountStatus.ACTIVE,
    },
  });

  // 3. Create a Subforum
  const subforum = await prisma.subforum.create({
    data: {
      name: "General Discussion",
      description: "A place for general university discussions.",
      isApproved: true,
      ownerId: sysadmin.id,
    },
  });

  // 4. Create Posts
  const post = await prisma.post.create({
    data: {
      title: "Welcome to the JU Forum!",
      content: "This is the first post. Feel free to start discussions here.",
      authorId: sysadmin.id,
      subforumId: subforum.id,
    },
  });

  // 5. Create an Announcement
  await prisma.announcement.create({
    data: {
      title: "Sprint 1 Launch",
      content: "Core features are now live for testing.",
      priority: PriorityLevel.HIGH,
      targetAudience: TargetAudience.ALL,
      authorId: sysadmin.id,
    },
  });

  // 6. Create a Vote
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
