
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const listings = await prisma.listing.findMany();
    console.log('--- DATABASE CHECK ---');
    console.log('Total Listings:', listings.length);
    listings.forEach(l => {
        console.log(`[${l.id}]`);
        console.log(`  Title: ${l.title}`);
        console.log(`  Type: ${l.type}`);
        console.log(`  Status: ${l.status}`);
        console.log(`  IsActive: ${l.is_active}`);
        console.log(`  Verified: ${l.verified}`);
        console.log(`  Category: ${l.category}`);
        console.log(`  Location: ${JSON.stringify(l.location)}`);
    });
    console.log('----------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
