
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const where = {
        is_active: true,
        status: {
            notIn: ['rejected', 'inactive', 'sold', 'rented']
        },
        type: 'sale'
    };

    const total = await prisma.listing.count({ where });
    console.log('RESULT_TOTAL:' + total);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
