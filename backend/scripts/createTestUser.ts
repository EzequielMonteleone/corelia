import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../prismaClient.js";

async function main() {
  const email = "admin@example.com";
  const password = "password123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("Test user ready:", { email, password, id: user.id });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

