
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const all = await prisma.listing.findMany();
    const sale = await prisma.listing.count({ where: { type: 'sale' } });
    const rent = await prisma.listing.count({ where: { type: 'rent' } });
    const active = await prisma.listing.count({ where: { is_active: true } });
    const approved = await prisma.listing.count({ where: { status: 'approved' } });
    const pending = await prisma.listing.count({ where: { status: 'pending' } });

    console.log('Total:', all.length);
    console.log('Sale:', sale);
    console.log('Rent:', rent);
    console.log('Active:', active);
    console.log('Approved:', approved);
    console.log('Pending:', pending);

    if (all.length > 0) {
        console.log('Sample Type:', all[0].type);
        console.log('Sample Status:', all[0].status);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
