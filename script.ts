import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient();

async function main() {
    await prisma.user.deleteMany({});
    const user  = await prisma.user.create({
        data: {
            name: "John Doe",
            email: "john@gmail.com",
            age: 30,
            userPreference: {
                create: {
                    emailNotifications: true,
                },
            },
        },
        include: {
            userPreference: true,
        },
    });

    console.log("User created:", user);
}

main()
  .catch(e => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  //14:40
