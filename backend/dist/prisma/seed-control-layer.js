"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Phase 0: Control Layer...\n');
    console.log('📝 Creating permissions...');
    const permissions = [
        { name: 'listings.view', resource: 'listings', action: 'view', description: 'View all listings', category: 'listing_management', riskLevel: 'low' },
        { name: 'listings.create', resource: 'listings', action: 'create', description: 'Create new listings', category: 'listing_management', riskLevel: 'low' },
        { name: 'listings.update', resource: 'listings', action: 'update', description: 'Update listing details', category: 'listing_management', riskLevel: 'medium' },
        { name: 'listings.delete', resource: 'listings', action: 'delete', description: 'Delete listings', category: 'listing_management', riskLevel: 'high' },
        { name: 'listings.approve', resource: 'listings', action: 'approve', description: 'Approve pending listings', category: 'listing_management', riskLevel: 'medium' },
        { name: 'listings.reject', resource: 'listings', action: 'reject', description: 'Reject pending listings', category: 'listing_management', riskLevel: 'medium' },
        { name: 'listings.feature', resource: 'listings', action: 'feature', description: 'Feature listings', category: 'listing_management', riskLevel: 'low' },
        { name: 'users.view', resource: 'users', action: 'view', description: 'View all users', category: 'user_management', riskLevel: 'low' },
        { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users', category: 'user_management', riskLevel: 'medium' },
        { name: 'users.update', resource: 'users', action: 'update', description: 'Update user details', category: 'user_management', riskLevel: 'medium' },
        { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users', category: 'user_management', riskLevel: 'critical' },
        { name: 'users.verify', resource: 'users', action: 'verify', description: 'Verify user accounts', category: 'user_management', riskLevel: 'medium' },
        { name: 'users.suspend', resource: 'users', action: 'suspend', description: 'Suspend user accounts', category: 'user_management', riskLevel: 'high' },
        { name: 'users.export', resource: 'users', action: 'export', description: 'Export user data', category: 'user_management', riskLevel: 'medium' },
        { name: 'transactions.view', resource: 'transactions', action: 'view', description: 'View all transactions', category: 'transaction_management', riskLevel: 'low' },
        { name: 'transactions.create', resource: 'transactions', action: 'create', description: 'Create transactions', category: 'transaction_management', riskLevel: 'high' },
        { name: 'transactions.update', resource: 'transactions', action: 'update', description: 'Update transaction details', category: 'transaction_management', riskLevel: 'high' },
        { name: 'transactions.escrow.release', resource: 'transactions', action: 'escrow.release', description: 'Release escrow funds', category: 'transaction_management', riskLevel: 'critical' },
        { name: 'transactions.refund', resource: 'transactions', action: 'refund', description: 'Process refunds', category: 'transaction_management', riskLevel: 'critical' },
        { name: 'transactions.export', resource: 'transactions', action: 'export', description: 'Export transaction data', category: 'transaction_management', riskLevel: 'medium' },
        { name: 'commissions.view', resource: 'commissions', action: 'view', description: 'View commission data', category: 'financial_management', riskLevel: 'low' },
        { name: 'commissions.export', resource: 'commissions', action: 'export', description: 'Export commission reports', category: 'financial_management', riskLevel: 'medium' },
        { name: 'commissions.configure', resource: 'commissions', action: 'configure', description: 'Configure commission rates', category: 'financial_management', riskLevel: 'high' },
        { name: 'inquiries.view', resource: 'inquiries', action: 'view', description: 'View user inquiries', category: 'support_management', riskLevel: 'low' },
        { name: 'inquiries.respond', resource: 'inquiries', action: 'respond', description: 'Respond to inquiries', category: 'support_management', riskLevel: 'low' },
        { name: 'notifications.view', resource: 'notifications', action: 'view', description: 'View notifications', category: 'notification_management', riskLevel: 'low' },
        { name: 'notifications.send', resource: 'notifications', action: 'send', description: 'Send notifications', category: 'notification_management', riskLevel: 'medium' },
        { name: 'notifications.broadcast', resource: 'notifications', action: 'broadcast', description: 'Broadcast system announcements', category: 'notification_management', riskLevel: 'medium' },
        { name: 'audit.view', resource: 'audit', action: 'view', description: 'View audit logs', category: 'compliance', riskLevel: 'low' },
        { name: 'audit.export', resource: 'audit', action: 'export', description: 'Export audit logs', category: 'compliance', riskLevel: 'medium' },
        { name: 'reports.generate', resource: 'reports', action: 'generate', description: 'Generate reports', category: 'reporting', riskLevel: 'low' },
        { name: 'reports.export', resource: 'reports', action: 'export', description: 'Export reports', category: 'reporting', riskLevel: 'low' },
        { name: 'settings.view', resource: 'settings', action: 'view', description: 'View system settings', category: 'system_management', riskLevel: 'low' },
        { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update system settings', category: 'system_management', riskLevel: 'critical' },
        { name: 'disputes.view', resource: 'disputes', action: 'view', description: 'View disputes', category: 'dispute_management', riskLevel: 'low' },
        { name: 'disputes.create', resource: 'disputes', action: 'create', description: 'Create disputes', category: 'dispute_management', riskLevel: 'low' },
        { name: 'disputes.manage', resource: 'disputes', action: 'manage', description: 'Manage disputes', category: 'dispute_management', riskLevel: 'high' },
        { name: 'disputes.resolve', resource: 'disputes', action: 'resolve', description: 'Resolve disputes', category: 'dispute_management', riskLevel: 'critical' },
        { name: 'disputes.evidence.upload', resource: 'disputes', action: 'evidence.upload', description: 'Upload evidence', category: 'dispute_management', riskLevel: 'medium' },
    ];
    for (const permission of permissions) {
        const data = {
            name: permission.name,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
            category: permission.category,
            risk_level: permission.riskLevel,
        };
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: data,
            create: data,
        });
    }
    console.log(`✅ Created ${permissions.length} permissions\n`);
    console.log('👥 Creating permission groups...');
    const groups = [
        {
            name: 'listing_manager',
            description: 'Manage property and vehicle listings',
            permissions: [
                'listings.view',
                'listings.approve',
                'listings.reject',
                'listings.update',
                'listings.delete',
                'listings.feature',
            ],
        },
        {
            name: 'user_manager',
            description: 'Manage user accounts and verification',
            permissions: [
                'users.view',
                'users.verify',
                'users.suspend',
                'users.update',
                'users.export',
            ],
        },
        {
            name: 'finance_team',
            description: 'Manage financial operations and transactions',
            permissions: [
                'transactions.view',
                'transactions.escrow.release',
                'transactions.refund',
                'transactions.export',
                'commissions.view',
                'commissions.export',
            ],
        },
        {
            name: 'support_team',
            description: 'Handle user support and inquiries',
            permissions: [
                'users.view',
                'listings.view',
                'inquiries.view',
                'inquiries.respond',
                'notifications.send',
            ],
        },
        {
            name: 'compliance_team',
            description: 'Audit and compliance monitoring',
            permissions: [
                'audit.view',
                'audit.export',
                'users.view',
                'transactions.view',
                'reports.generate',
                'reports.export',
            ],
        },
        {
            name: 'dispute_manager',
            description: 'Manage disputes and resolutions',
            permissions: [
                'disputes.view',
                'disputes.manage',
                'disputes.resolve',
                'disputes.evidence.upload',
                'transactions.view',
                'transactions.refund',
                'transactions.escrow.release',
                'users.view',
                'notifications.send',
            ],
        },
    ];
    for (const group of groups) {
        const permissionRecords = await prisma.permission.findMany({
            where: {
                name: {
                    in: group.permissions,
                },
            },
        });
        await prisma.permissionGroup.upsert({
            where: { name: group.name },
            update: {
                description: group.description,
                permissions: {
                    set: permissionRecords.map((p) => ({ id: p.id })),
                },
            },
            create: {
                name: group.name,
                description: group.description,
                permissions: {
                    connect: permissionRecords.map((p) => ({ id: p.id })),
                },
            },
        });
    }
    console.log(`✅ Created ${groups.length} permission groups\n`);
    console.log('📊 Seed Summary:');
    console.log(`   Permissions: ${permissions.length}`);
    console.log(`   Permission Groups: ${groups.length}`);
    console.log('\n✨ Phase 0: Control Layer seeded successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Assign permission groups to admin users');
    console.log('   2. Run database migration: npx prisma migrate dev');
    console.log('   3. Update admin endpoints to use @RequirePermissions and @Audited decorators');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-control-layer.js.map