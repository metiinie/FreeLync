-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "delivery_status" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "event_type" TEXT,
ADD COLUMN     "failed_at" TIMESTAMP(3),
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "max_retries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduled_for" TIMESTAMP(3),
ADD COLUMN     "template_id" TEXT,
ADD COLUMN     "thread_id" TEXT,
ADD COLUMN     "triggered_by_id" TEXT,
ADD COLUMN     "variables" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "channels" SET DEFAULT '{"in_app": true, "email": true, "sms": false, "push": false}';

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title_template" TEXT NOT NULL,
    "message_template" TEXT NOT NULL,
    "email_subject" TEXT,
    "email_body" TEXT,
    "sms_body" TEXT,
    "default_priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "default_channels" JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "sms": false}',
    "required_vars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optional_vars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "event_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "transactional" JSONB NOT NULL DEFAULT '{"email": true, "sms": true, "push": true}',
    "marketing" JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": false}',
    "system" JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": true}',
    "digest_mode" BOOLEAN NOT NULL DEFAULT false,
    "digest_frequency" TEXT NOT NULL DEFAULT 'realtime',
    "quiet_hours" JSONB NOT NULL DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00"}',
    "event_overrides" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "provider_id" TEXT,
    "provider_response" JSONB,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_logs_notification_id_channel_idx" ON "notification_logs"("notification_id", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_status_attempted_at_idx" ON "notification_logs"("status", "attempted_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_event_type_created_at_idx" ON "notifications"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications"("scheduled_for");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_triggered_by_id_fkey" FOREIGN KEY ("triggered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
