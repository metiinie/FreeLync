import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@freelync.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'super_admin',
            verified: true,
            is_active: true,
            permission_groups: [
                'listing_manager',
                'user_manager',
                'finance_team',
                'support_team',
                'compliance_team',
            ],
        },
        create: {
            email,
            password: hashedPassword,
            full_name: 'Super Admin',
            role: 'super_admin',
            verified: true,
            is_active: true,
            permission_groups: [
                'listing_manager',
                'user_manager',
                'finance_team',
                'support_team',
                'compliance_team',
            ],
        },
    });

    console.log(`✅ Admin user setup complete: ${email}`);
    console.log(`   Password: ${password}`); // Only if created/updated (for demo purposes)
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
