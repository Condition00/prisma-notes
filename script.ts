import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({data: {name: "meow"}})
    console.log(user);
}

main()
  .catch(e => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
