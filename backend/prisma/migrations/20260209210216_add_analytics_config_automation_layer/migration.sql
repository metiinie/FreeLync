-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('REVENUE', 'TRANSACTION_COUNT', 'USER_GROWTH', 'LISTING_GROWTH', 'PAYOUT_VOLUME', 'COMMISSION_EARNED', 'DISPUTE_RATE', 'VERIFICATION_RATE', 'CONVERSION_RATE');

-- CreateEnum
CREATE TYPE "MetricPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ConfigCategory" AS ENUM ('COMMISSION', 'PAYMENT_GATEWAY', 'FEATURE_FLAG', 'SYSTEM_SETTING', 'INTEGRATION', 'SECURITY');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeatureFlagStatus" AS ENUM ('DISABLED', 'ENABLED_FOR_TESTING', 'ENABLED_FOR_PERCENTAGE', 'ENABLED_FOR_USERS', 'ENABLED_GLOBALLY');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('FULL', 'READ_ONLY', 'FEATURE_SPECIFIC');

-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('SCHEDULED', 'EVENT', 'STATE_CHANGE', 'MANUAL');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REQUIRES_APPROVAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "period" "MetricPeriod" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "count" INTEGER,
    "percentage" DECIMAL(5,2),
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_users" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "verified_users" INTEGER NOT NULL,
    "total_listings" INTEGER NOT NULL,
    "active_listings" INTEGER NOT NULL,
    "sold_listings" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "completed_transactions" INTEGER NOT NULL,
    "disputed_transactions" INTEGER NOT NULL,
    "total_revenue" DECIMAL(15,2) NOT NULL,
    "total_payouts" DECIMAL(15,2) NOT NULL,
    "pending_escrow" DECIMAL(15,2) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "ConfigCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" JSONB NOT NULL,
    "value_type" TEXT NOT NULL,
    "validation_rules" JSONB NOT NULL DEFAULT '{}',
    "status" "ConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "scheduled_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_change_history" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB NOT NULL,
    "change_reason" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "changed_by_id" TEXT NOT NULL,
    "affected_users" INTEGER,
    "affected_transactions" INTEGER,
    "risk_level" TEXT NOT NULL,
    "can_rollback" BOOLEAN NOT NULL DEFAULT true,
    "rolled_back" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FeatureFlagStatus" NOT NULL DEFAULT 'DISABLED',
    "enabled_percentage" DECIMAL(5,2),
    "enabled_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "owner_id" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_modes" (
    "id" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "affected_features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "estimated_end" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "activated_by_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_type" "WorkflowTriggerType" NOT NULL,
    "trigger_config" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 300,
    "dry_run_mode" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_executions" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggered_by" TEXT NOT NULL,
    "trigger_data" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "actions_executed" JSONB NOT NULL DEFAULT '[]',
    "success" BOOLEAN,
    "error_message" TEXT,
    "error_stack" TEXT,
    "output_data" JSONB NOT NULL DEFAULT '{}',
    "affected_entities" JSONB NOT NULL DEFAULT '{}',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "recurrence" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "TaskStatus" NOT NULL DEFAULT 'SCHEDULED',
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "result" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_metrics_type_period_start_idx" ON "platform_metrics"("type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "platform_metrics_type_period_period_start_key" ON "platform_metrics"("type", "period", "period_start");

-- CreateIndex
CREATE INDEX "analytics_snapshots_snapshot_date_idx" ON "analytics_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_configs_key_key" ON "platform_configs"("key");

-- CreateIndex
CREATE INDEX "platform_configs_category_status_idx" ON "platform_configs"("category", "status");

-- CreateIndex
CREATE INDEX "platform_configs_key_version_idx" ON "platform_configs"("key", "version");

-- CreateIndex
CREATE INDEX "config_change_history_config_id_version_idx" ON "config_change_history"("config_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_status_idx" ON "feature_flags"("status");

-- CreateIndex
CREATE INDEX "maintenance_modes_is_active_idx" ON "maintenance_modes"("is_active");

-- CreateIndex
CREATE INDEX "automation_workflows_status_trigger_type_idx" ON "automation_workflows"("status", "trigger_type");

-- CreateIndex
CREATE INDEX "workflow_executions_workflow_id_created_at_idx" ON "workflow_executions"("workflow_id", "created_at");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "scheduled_tasks_status_scheduled_for_idx" ON "scheduled_tasks"("status", "scheduled_for");

-- AddForeignKey
ALTER TABLE "platform_configs" ADD CONSTRAINT "platform_configs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_configs" ADD CONSTRAINT "platform_configs_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_change_history" ADD CONSTRAINT "config_change_history_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "platform_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_change_history" ADD CONSTRAINT "config_change_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_modes" ADD CONSTRAINT "maintenance_modes_activated_by_id_fkey" FOREIGN KEY ("activated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_tasks" ADD CONSTRAINT "scheduled_tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
