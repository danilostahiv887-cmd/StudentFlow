CREATE TABLE IF NOT EXISTS "specialities" (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "groups" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "specialityId" TEXT NOT NULL REFERENCES "specialities" (id) ON DELETE CASCADE,
  "startYear" INTEGER NOT NULL,
  "endYear" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "profiles" (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  "groupId" TEXT REFERENCES "groups" (id) ON DELETE SET NULL,
  "specialityId" TEXT REFERENCES "specialities" (id) ON DELETE SET NULL,
  phone TEXT,
  bio TEXT,
  "pointsTotal" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "mediaAssets" (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('activity', 'club', 'badge', 'visual')),
  "imageKey" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileId" TEXT,
  url TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  alt TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  "dominantColor" TEXT
);

CREATE TABLE IF NOT EXISTS "clubs" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  "teacherId" TEXT NOT NULL REFERENCES "profiles" (id) ON DELETE CASCADE,
  "imageKey" INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS "categories" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'aqua',
  "imageKey" INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "activities" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "shortDescription" TEXT NOT NULL,
  description TEXT NOT NULL,
  "categoryId" TEXT NOT NULL REFERENCES "categories" (id) ON DELETE CASCADE,
  "clubId" TEXT NOT NULL REFERENCES "clubs" (id) ON DELETE CASCADE,
  "teacherId" TEXT NOT NULL REFERENCES "profiles" (id) ON DELETE CASCADE,
  "imageKey" INTEGER NOT NULL DEFAULT 1,
  format TEXT NOT NULL CHECK (format IN ('offline', 'online', 'hybrid')),
  location TEXT NOT NULL,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "maxParticipants" INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL CHECK (
    difficulty IN ('beginner', 'intermediate', 'advanced')
  ),
  status TEXT NOT NULL CHECK (
    status IN (
      'published',
      'draft',
      'paused',
      'completed',
      'cancelled',
      'archived'
    )
  ),
  requirements TEXT NOT NULL,
  "resultDescription" TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "applications" (
  id TEXT PRIMARY KEY,
  "activityId" TEXT NOT NULL REFERENCES "activities" (id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "profiles" (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (
    status IN (
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'cancelled',
      'attended',
      'missed'
    )
  ),
  motivation TEXT NOT NULL,
  "teacherComment" TEXT,
  "rejectionReason" TEXT,
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "reports" (
  id TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "applications" (id) ON DELETE CASCADE,
  "activityId" TEXT NOT NULL REFERENCES "activities" (id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "profiles" (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (
    status IN (
      'draft',
      'submitted',
      'approved',
      'rejected',
      'needs_changes'
    )
  ),
  reflection TEXT NOT NULL DEFAULT '',
  "hoursSpent" INTEGER NOT NULL DEFAULT 0,
  "skillsGained" TEXT NOT NULL DEFAULT '',
  "evidenceUrl" TEXT,
  "teacherFeedback" TEXT,
  "reviewedBy" TEXT REFERENCES "profiles" (id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "badges" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "imageKey" INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT 'aqua',
  "conditionType" TEXT NOT NULL CHECK (
    "conditionType" IN ('points', 'category', 'activities')
  ),
  "conditionValue" INTEGER NOT NULL,
  "categoryId" TEXT REFERENCES "categories" (id) ON DELETE CASCADE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "studentBadges" (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "profiles" (id) ON DELETE CASCADE,
  "badgeId" TEXT NOT NULL REFERENCES "badges" (id) ON DELETE CASCADE,
  "unlockedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX if NOT EXISTS idx_profiles_role ON "profiles" (role);

CREATE INDEX if NOT EXISTS idx_activities_category ON "activities" ("categoryId");

CREATE INDEX if NOT EXISTS idx_activities_teacher ON "activities" ("teacherId");

CREATE INDEX if NOT EXISTS idx_applications_student ON "applications" ("studentId");

CREATE INDEX if NOT EXISTS idx_reports_status ON "reports" (status);
