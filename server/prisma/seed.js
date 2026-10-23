import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters.");
  }
  const password_hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password_hash,
      email_verified: true,
      role: "admin",
      verification_status: "approved",
      full_name: "SafeEars Administrator",
    },
    update: {
      password_hash,
      email_verified: true,
      role: "admin",
      verification_status: "approved",
    },
  });
  const initialTopics = [
    {
      name: "Emotional support",
      description: "A safe space to talk about what you are feeling.",
      category: "emotional",
      icon: "Heart",
    },
    {
      name: "Relationships",
      description: "Support with family, friendships, and relationships.",
      category: "relationships",
      icon: "Users",
    },
    {
      name: "Stress and anxiety",
      description: "Talk through stress, worry, and difficult days.",
      category: "stress",
      icon: "Cloud",
    },
    {
      name: "Grief and loss",
      description: "Compassionate support while navigating loss.",
      category: "grief",
      icon: "Flower",
    },
    {
      name: "Faith and spirituality",
      description: "Discuss faith and spiritual wellbeing without judgement.",
      category: "faith",
      icon: "Sparkles",
    },
    {
      name: "Something else",
      description: "Share whatever is on your mind.",
      category: "other",
      icon: "MessageCircle",
    },
  ];
  for (const topic of initialTopics) {
    const existing = await prisma.supportTopic.findFirst({
      where: { name: topic.name },
    });
    if (existing) {
      await prisma.supportTopic.update({
        where: { id: existing.id },
        data: { ...topic, is_active: true },
      });
    } else {
      await prisma.supportTopic.create({ data: topic });
    }
  }
  const initialPlans = [
    {
      name: "Free / Trial",
      description: "Free access to core support and crisis resources.",
      price_ngn: 0,
      is_active: true,
      sort_order: 0,
      features: ["Core support", "Crisis resources"],
    },
    { name: "VIP", is_active: false, sort_order: 1 },
    { name: "Platinum", is_active: false, sort_order: 2 },
    { name: "Therapist", is_active: false, sort_order: 3 },
  ];
  for (const plan of initialPlans) {
    const existing = await prisma.plan.findFirst({
      where: { name: plan.name },
    });
    if (!existing) {
      await prisma.plan.create({ data: plan });
    }
  }
  const emergencyResource = await prisma.resourceArticle.findFirst({
    where: { title: "Urgent help in Nigeria" },
  });
  if (!emergencyResource) {
    await prisma.resourceArticle.create({
      data: {
        title: "Urgent help in Nigeria",
        category: "crisis",
        summary: "Emergency contacts if you or another person is in immediate danger.",
        body: "Call 112 or 199 for emergency assistance in Nigeria. SafeEars is not an emergency or medical service.",
        icon: "Phone",
        is_public: true,
        sort_order: 0,
      },
    });
  }
  console.log(`Administrator account provisioned for ${email}.`);
} finally {
  await prisma.$disconnect();
}
