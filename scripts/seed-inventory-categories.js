const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  {
    name: 'Uniforms',
    description: 'Student uniforms and clothing items',
  },
  {
    name: 'Books',
    description: 'Educational books and learning materials',
  },
  {
    name: 'Hostel Supplies',
    description: 'Hostel and accommodation supplies',
  },
  {
    name: 'Food Items',
    description: 'Food and consumable items',
  },
];

async function seedInventoryCategories() {
  console.log('🌱 Seeding inventory categories...');

  try {
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await prisma.inventoryCategory.findUnique({
        where: { name: category.name },
      });

      if (!existing) {
        await prisma.inventoryCategory.create({
          data: category,
        });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`);
      }
    }

    console.log('✨ Inventory categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding inventory categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedInventoryCategories();
