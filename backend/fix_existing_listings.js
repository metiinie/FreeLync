
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.listing.updateMany({
        where: { status: 'pending' },
        data: {
            status: 'approved',
            verified: true,
            is_active: true
        }
    });
    console.log(`Updated ${result.count} listings to approved.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
