
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const listing = await prisma.listing.findFirst();
    if (listing) {
        console.log(JSON.stringify(listing, null, 2));
    } else {
        console.log('No listings found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
