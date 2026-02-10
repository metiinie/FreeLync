"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=list-admins.js.map