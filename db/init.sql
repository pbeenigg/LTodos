-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建枚举类型
DO $$ BEGIN
    CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
COMMENT ON TYPE "TeamRole" IS '团队角色: OWNER(拥有者), ADMIN(管理员), MEMBER(成员)';

DO $$ BEGIN
    CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
COMMENT ON TYPE "TaskStatus" IS '任务状态: TODO(待办), IN_PROGRESS(进行中), DONE(已完成)';

DO $$ BEGIN
    CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
COMMENT ON TYPE "TaskPriority" IS '任务优先级: LOW(低), MEDIUM(中), HIGH(高)';

-- 创建用户表 (User)
CREATE TABLE IF NOT EXISTS "user" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" character varying NOT NULL,
    "password" character varying NOT NULL,
    "name" character varying NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_user_email" UNIQUE ("email")
);

COMMENT ON TABLE "user" IS '用户表';
COMMENT ON COLUMN "user"."id" IS '用户ID';
COMMENT ON COLUMN "user"."email" IS '用户邮箱';
COMMENT ON COLUMN "user"."password" IS '用户密码(加密)';
COMMENT ON COLUMN "user"."name" IS '用户名称';
COMMENT ON COLUMN "user"."createdAt" IS '创建时间';
COMMENT ON COLUMN "user"."updatedAt" IS '更新时间';

-- 创建团队表 (Team)
CREATE TABLE IF NOT EXISTS "team" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "ownerId" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_team_id" PRIMARY KEY ("id")
);

COMMENT ON TABLE "team" IS '团队表';
COMMENT ON COLUMN "team"."id" IS '团队ID';
COMMENT ON COLUMN "team"."name" IS '团队名称';
COMMENT ON COLUMN "team"."ownerId" IS '团队拥有者ID';
COMMENT ON COLUMN "team"."createdAt" IS '创建时间';
COMMENT ON COLUMN "team"."updatedAt" IS '更新时间';

-- 创建团队成员表 (TeamMember)
CREATE TABLE IF NOT EXISTS "team_member" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "teamId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_team_member_id" PRIMARY KEY ("id")
);

COMMENT ON TABLE "team_member" IS '团队成员关联表';
COMMENT ON COLUMN "team_member"."id" IS '关联ID';
COMMENT ON COLUMN "team_member"."teamId" IS '团队ID';
COMMENT ON COLUMN "team_member"."userId" IS '用户ID';
COMMENT ON COLUMN "team_member"."role" IS '成员角色';
COMMENT ON COLUMN "team_member"."joinedAt" IS '加入时间';

-- 创建任务表 (Task)
CREATE TABLE IF NOT EXISTS "task" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "title" character varying NOT NULL,
    "description" text,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "creatorId" uuid NOT NULL,
    "assigneeId" uuid,
    "teamId" uuid,
    "parentId" uuid,
    "dueDate" TIMESTAMP,
    "reminderTime" TIMESTAMP,
    "recurrenceRule" character varying,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_task_id" PRIMARY KEY ("id")
);

COMMENT ON TABLE "task" IS '任务表';
COMMENT ON COLUMN "task"."id" IS '任务ID';
COMMENT ON COLUMN "task"."title" IS '任务标题';
COMMENT ON COLUMN "task"."description" IS '任务描述';
COMMENT ON COLUMN "task"."status" IS '任务状态';
COMMENT ON COLUMN "task"."priority" IS '任务优先级';
COMMENT ON COLUMN "task"."creatorId" IS '创建者ID';
COMMENT ON COLUMN "task"."assigneeId" IS '执行人ID';
COMMENT ON COLUMN "task"."teamId" IS '所属团队ID';
COMMENT ON COLUMN "task"."parentId" IS '父任务ID';
COMMENT ON COLUMN "task"."dueDate" IS '截止时间';
COMMENT ON COLUMN "task"."reminderTime" IS '提醒时间';
COMMENT ON COLUMN "task"."recurrenceRule" IS '重复规则(RRULE)';
COMMENT ON COLUMN "task"."createdAt" IS '创建时间';
COMMENT ON COLUMN "task"."updatedAt" IS '更新时间';

-- 创建任务历史表 (TaskHistory)
CREATE TABLE IF NOT EXISTS "task_history" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "taskId" uuid NOT NULL,
    "changeType" character varying NOT NULL,
    "oldValue" text,
    "newValue" text,
    "changedById" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_task_history_id" PRIMARY KEY ("id")
);

COMMENT ON TABLE "task_history" IS '任务历史记录表';
COMMENT ON COLUMN "task_history"."id" IS '历史记录ID';
COMMENT ON COLUMN "task_history"."taskId" IS '关联任务ID';
COMMENT ON COLUMN "task_history"."changeType" IS '变更类型';
COMMENT ON COLUMN "task_history"."oldValue" IS '变更前的值';
COMMENT ON COLUMN "task_history"."newValue" IS '变更后的值';
COMMENT ON COLUMN "task_history"."changedById" IS '操作人ID';
COMMENT ON COLUMN "task_history"."createdAt" IS '记录创建时间';

-- 创建评论表 (Comment)
CREATE TABLE IF NOT EXISTS "comment" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "taskId" uuid NOT NULL,
    "content" text NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_comment_id" PRIMARY KEY ("id")
);

COMMENT ON TABLE "comment" IS '任务评论表';
COMMENT ON COLUMN "comment"."id" IS '评论ID';
COMMENT ON COLUMN "comment"."taskId" IS '关联任务ID';
COMMENT ON COLUMN "comment"."content" IS '评论内容';
COMMENT ON COLUMN "comment"."userId" IS '评论人ID';
COMMENT ON COLUMN "comment"."createdAt" IS '评论时间';

-- 添加外键约束

-- Team -> User (owner)
ALTER TABLE "team" DROP CONSTRAINT IF EXISTS "FK_team_owner";
ALTER TABLE "team" ADD CONSTRAINT "FK_team_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- TeamMember -> Team
ALTER TABLE "team_member" DROP CONSTRAINT IF EXISTS "FK_team_member_team";
ALTER TABLE "team_member" ADD CONSTRAINT "FK_team_member_team" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- TeamMember -> User
ALTER TABLE "team_member" DROP CONSTRAINT IF EXISTS "FK_team_member_user";
ALTER TABLE "team_member" ADD CONSTRAINT "FK_team_member_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Task -> User (creator)
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "FK_task_creator";
ALTER TABLE "task" ADD CONSTRAINT "FK_task_creator" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Task -> User (assignee)
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "FK_task_assignee";
ALTER TABLE "task" ADD CONSTRAINT "FK_task_assignee" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Task -> Team
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "FK_task_team";
ALTER TABLE "task" ADD CONSTRAINT "FK_task_team" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Task -> Task (parent)
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "FK_task_parent";
ALTER TABLE "task" ADD CONSTRAINT "FK_task_parent" FOREIGN KEY ("parentId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- TaskHistory -> Task
ALTER TABLE "task_history" DROP CONSTRAINT IF EXISTS "FK_task_history_task";
ALTER TABLE "task_history" ADD CONSTRAINT "FK_task_history_task" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- TaskHistory -> User
ALTER TABLE "task_history" DROP CONSTRAINT IF EXISTS "FK_task_history_user";
ALTER TABLE "task_history" ADD CONSTRAINT "FK_task_history_user" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Comment -> Task
ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "FK_comment_task";
ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_task" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Comment -> User
ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "FK_comment_user";
ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
