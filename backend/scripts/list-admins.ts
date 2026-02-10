import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            role: {
                in: ['admin', 'super_admin'],
            },
        },
        select: {
            email: true,
            role: true,
            full_name: true,
        },
    });

    console.log('Found Admins:', users);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
