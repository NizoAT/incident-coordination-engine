import { execSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log("→ Seed ignoré (données déjà présentes)");
      return;
    }
    console.log("→ Base vide: exécution du seed démo…");
    execSync("npm run db:seed", { stdio: "inherit" });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
