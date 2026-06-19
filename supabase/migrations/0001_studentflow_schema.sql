create table if not exists "specialities" (
  id text primary key,
  code text not null unique,
  name text not null,
  description text not null default ''
);

create table if not exists "groups" (
  id text primary key,
  name text not null,
  "specialityId" text not null references "specialities"(id) on delete cascade,
  "startYear" integer not null,
  "endYear" integer not null,
  "isActive" boolean not null default true
);

create table if not exists "profiles" (
  id text primary key,
  "fullName" text not null,
  email text not null unique,
  "passwordHash" text not null,
  role text not null check (role in ('student','teacher','admin')),
  status text not null check (status in ('active','inactive')),
  "groupId" text references "groups"(id) on delete set null,
  "specialityId" text references "specialities"(id) on delete set null,
  phone text,
  bio text,
  "pointsTotal" integer not null default 0
);

create table if not exists "mediaAssets" (
  id text primary key,
  kind text not null check (kind in ('activity','club','badge','visual')),
  "imageKey" integer not null,
  "fileName" text not null,
  "fileId" text,
  url text not null,
  "thumbnailUrl" text,
  alt text not null,
  width integer,
  height integer,
  "dominantColor" text
);

create table if not exists "clubs" (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  "teacherId" text not null references "profiles"(id) on delete cascade,
  "imageKey" integer not null default 1,
  status text not null check (status in ('active','inactive'))
);

create table if not exists "categories" (
  id text primary key,
  name text not null,
  slug text not null unique,
  color text not null default 'aqua',
  "imageKey" integer not null default 1
);

create table if not exists "activities" (
  id text primary key,
  title text not null,
  slug text not null unique,
  "shortDescription" text not null,
  description text not null,
  "categoryId" text not null references "categories"(id) on delete cascade,
  "clubId" text not null references "clubs"(id) on delete cascade,
  "teacherId" text not null references "profiles"(id) on delete cascade,
  "imageKey" integer not null default 1,
  format text not null check (format in ('offline','online','hybrid')),
  location text not null,
  "startAt" timestamptz not null,
  "endAt" timestamptz not null,
  "maxParticipants" integer not null,
  points integer not null default 0,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  status text not null check (status in ('published','draft','paused','completed','cancelled','archived')),
  requirements text not null,
  "resultDescription" text not null,
  skills text[] not null default '{}'
);

create table if not exists "applications" (
  id text primary key,
  "activityId" text not null references "activities"(id) on delete cascade,
  "studentId" text not null references "profiles"(id) on delete cascade,
  status text not null check (status in ('submitted','under_review','approved','rejected','cancelled','attended','missed')),
  motivation text not null,
  "teacherComment" text,
  "rejectionReason" text,
  "cancellationReason" text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists "reports" (
  id text primary key,
  "applicationId" text not null references "applications"(id) on delete cascade,
  "activityId" text not null references "activities"(id) on delete cascade,
  "studentId" text not null references "profiles"(id) on delete cascade,
  status text not null check (status in ('draft','submitted','approved','rejected','needs_changes')),
  reflection text not null default '',
  "hoursSpent" integer not null default 0,
  "skillsGained" text not null default '',
  "evidenceUrl" text,
  "teacherFeedback" text,
  "reviewedBy" text references "profiles"(id) on delete set null,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists "badges" (
  id text primary key,
  title text not null,
  description text not null,
  "imageKey" integer not null default 1,
  color text not null default 'aqua',
  "conditionType" text not null check ("conditionType" in ('points','category','activities')),
  "conditionValue" integer not null,
  "categoryId" text references "categories"(id) on delete cascade,
  "isActive" boolean not null default true
);

create table if not exists "studentBadges" (
  id text primary key,
  "studentId" text not null references "profiles"(id) on delete cascade,
  "badgeId" text not null references "badges"(id) on delete cascade,
  "unlockedAt" timestamptz not null
);

create index if not exists idx_profiles_role on "profiles"(role);
create index if not exists idx_activities_category on "activities"("categoryId");
create index if not exists idx_activities_teacher on "activities"("teacherId");
create index if not exists idx_applications_student on "applications"("studentId");
create index if not exists idx_reports_status on "reports"(status);
