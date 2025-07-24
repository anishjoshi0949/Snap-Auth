import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: "Akshay Pawar",
        email: "akshaypawar@codewandlers.com",
        phoneNumber: "+918412856175",
      },
      {
        name: "Anish Nitin Joshi",
        email: "anishjoshi@mail.com",
        phoneNumber: "+918637753720",
      }
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => {
    console.log('Seeding finished.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
