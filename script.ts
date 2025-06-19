import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient(); //{log: ['query']}

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
        //createMany: { for bulk insertions, not used here, we cannot use it with nested writes like userPreference.create }
        //findUnique: { for finding a unique record, not used here } age_name means age and name are unique together
        //findFirst: { for finding the first record that matches the criteria, not used here
        //findMany: { for finding multiple records, not used here }
            //distinct: { for finding distinct records, not used here }
            //take: 10, // for limiting the number of records returned, not used here
            //skip: 0, // for skipping a number of records, not used here

        // where: { // for filtering records, not used here
            // all where findMany queries are:
            // where: { age: { gt: 18 } }, // for filtering records where age is greater than 18
            // where: { name: { contains: "John" } }, // for filtering records
            // where: { email: { startsWith: "meow" } }, // for filtering records where email starts with "meow"
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
