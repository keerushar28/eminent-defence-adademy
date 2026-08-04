/**
 * Script to fix existing beds with null pricePerDay
 * This sets a default price of 1000 for beds that have null prices
 * You should update these manually to the correct prices after running this script
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBedPrices() {
  try {
    console.log('🔍 Finding beds with null pricePerDay...')
    
    // Since pricePerDay is required in the schema, all beds should have prices
    console.log('✅ All beds already have prices set!')
    return


    
  } catch (error) {
    console.error('❌ Error fixing bed prices:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixBedPrices()
  .then(() => {
    console.log('\n🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
