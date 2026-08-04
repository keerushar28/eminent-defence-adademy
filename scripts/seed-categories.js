const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...')

    // Create Nepalese Army category
    const nepaleseArmy = await prisma.category.create({
      data: {
        name: 'Nepalese Army',
        description: 'Military service categories for the Nepalese Army',
      },
    })

    // Create Nepal Police category
    const nepalPolice = await prisma.category.create({
      data: {
        name: 'Nepal Police',
        description: 'Police service categories for Nepal Police',
      },
    })

    // Create Civil Service category
    const civilService = await prisma.category.create({
      data: {
        name: 'Civil Service',
        description: 'Government civil service positions',
      },
    })

    // Create subcategories for Nepalese Army
    await prisma.subCategory.createMany({
      data: [
        {
          name: 'Sainya',
          fee: 15000,
          categoryId: nepaleseArmy.id,
        },
        {
          name: 'Officer Cadet',
          fee: 25000,
          categoryId: nepaleseArmy.id,
        },
        {
          name: 'Technical Officer',
          fee: 22000,
          categoryId: nepaleseArmy.id,
        },
      ],
    })

    // Create subcategories for Nepal Police
    await prisma.subCategory.createMany({
      data: [
        {
          name: 'Jwan',
          fee: 12000,
          categoryId: nepalPolice.id,
        },
        {
          name: 'ASI',
          fee: 18000,
          categoryId: nepalPolice.id,
        },
        {
          name: 'Inspector',
          fee: 22000,
          categoryId: nepalPolice.id,
        },
        {
          name: 'DSP',
          fee: 28000,
          categoryId: nepalPolice.id,
        },
      ],
    })

    // Create subcategories for Civil Service
    await prisma.subCategory.createMany({
      data: [
        {
          name: 'Officer Level',
          fee: 20000,
          categoryId: civilService.id,
        },
        {
          name: 'Assistant Level',
          fee: 16000,
          categoryId: civilService.id,
        },
        {
          name: 'Non-Gazetted',
          fee: 14000,
          categoryId: civilService.id,
        },
      ],
    })

    console.log('✅ Categories seeded successfully!')
    console.log(`Created ${await prisma.category.count()} categories`)
    console.log(`Created ${await prisma.subCategory.count()} subcategories`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()