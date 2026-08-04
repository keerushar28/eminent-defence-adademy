import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking CategorySelection table...\n");

  // Count total selections
  const count = await prisma.subCategorySelection.count();
  console.log(`Total category selections: ${count}`);

  if (count > 0) {
    // Show some examples
    const selections = await prisma.subCategorySelection.findMany({
      take: 5,
      include: {
        student: {
          select: {
            fullname: true,
          },
        },
        subCategory: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("\nExample selections:");
    selections.forEach((sel: any) => {
      console.log(
        `- ${sel.student.fullname} → ${sel.subCategory.name}`
      );
    });
  } else {
    console.log("\nNo category selections found. This is expected if you haven't selected any students yet.");
  }

  // Check if there are any students
  const studentCount = await prisma.student.count();
  console.log(`\nTotal students: ${studentCount}`);

  // Check categories
  const categoryCount = await prisma.category.count();
  console.log(`Total categories: ${categoryCount}`);

  if (categoryCount > 0) {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    console.log("\nAvailable categories:");
    categories.forEach((cat) => {
      console.log(`- ${cat.name} (${cat.id})`);
    });
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
