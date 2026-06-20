ALTER TABLE "activities"
DROP CONSTRAINT IF EXISTS "activities_teacherId_fkey";

ALTER TABLE "activities"
ALTER COLUMN "teacherId"
DROP NOT NULL;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "profiles" (id) ON DELETE SET NULL;
