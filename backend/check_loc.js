
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const listing = await prisma.listing.findFirst();
    if (listing) {
        console.log('LOCATION_KEYS:' + Object.keys(listing.location).join(','));
        console.log('LOCATION_JSON:' + JSON.stringify(listing.location));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
