import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient();

async function main() {
    // Clean up all tables in the correct order to avoid constraint violations
    await prisma.user.deleteMany();
    await prisma.userPreference.deleteMany();
    //why do i need to delete userPreference? // because userPreference has a foreign key constraint to user, so it must be deleted first.
    //Although we have await prisma.user.deleteMany(); at the beginning of your script, which should delete all users, there might be related records in the UserPreference table that are causing constraints to be violated.
    const user = await prisma.user.create({
        data: {
            name: "John Doe",
            email: "meow@gmail.com",
            age: 30,
            userPreference: {
                create: {
                    emailNotifications: true,
                },
            },
        },
        select: {
            name: true,
            userPreference: {
                select: { id: true},
            },
        },
    });

    console.log("User created:", user);
}

main()
  .catch(e => {
    console.error(e.message);
    console.error("Full error:", e); // Log the full error object for more details
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  //14:40
