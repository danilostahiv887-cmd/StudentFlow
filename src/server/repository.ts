import type { Activity, ActivityView, Application, DatabaseSnapshot, Profile } from '@/types/entities';
import { readDatabase } from '@/server/supabase-store';
import { compare } from 'bcryptjs';

export type ActivityFilters = { search?: string; category?: string; club?: string; format?: string; difficulty?: string; available?: string; sort?: string; page?: number; pageSize?: number; };
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number; };

function approvedCounts(database: DatabaseSnapshot) {
  const counts = new Map<string, number>();
  for (const application of database.applications) {
    if (!['approved', 'attended'].includes(application.status)) continue;
    counts.set(application.activityId, (counts.get(application.activityId) ?? 0) + 1);
  }
  return counts;
}

export function activityView(database: DatabaseSnapshot, activity: Activity, counts = approvedCounts(database)): ActivityView {
  const category = database.categories.find((item) => item.id === activity.categoryId)!;
  const club = database.clubs.find((item) => item.id === activity.clubId)!;
  const teacher = database.profiles.find((item) => item.id === activity.teacherId)!;
  const media = database.mediaAssets.find((item) => item.kind === 'activity' && item.imageKey === activity.imageKey);
  const approvedCount = counts.get(activity.id) ?? 0;
  return { ...activity, category, club, teacher, approvedCount, availablePlaces: Math.max(0, activity.maxParticipants - approvedCount), imageUrl: media?.url, imageAlt: media?.alt };
}

export function makePage<T>(items: T[], page = 1, pageSize = 6): Page<T> {
  const safePageSize = [6, 12, 24].includes(pageSize) ? pageSize : 6;
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return { items: items.slice((safePage - 1) * safePageSize, safePage * safePageSize), total: items.length, page: safePage, pageSize: safePageSize, pageCount };
}

export function buildActivityPage(database: DatabaseSnapshot, filters: ActivityFilters = {}) {
  const counts = approvedCounts(database);
  let items = database.activities.filter((item) => item.status === 'published');
  const needle = filters.search?.trim().toLocaleLowerCase('uk-UA');
  if (needle) items = items.filter((item) => `${item.title} ${item.shortDescription} ${item.description}`.toLocaleLowerCase('uk-UA').includes(needle));
  if (filters.category) items = items.filter((item) => item.categoryId === filters.category);
  if (filters.club) items = items.filter((item) => item.clubId === filters.club);
  if (filters.format) items = items.filter((item) => item.format === filters.format);
  if (filters.difficulty) items = items.filter((item) => item.difficulty === filters.difficulty);
  if (filters.available === 'yes') items = items.filter((item) => item.maxParticipants - (counts.get(item.id) ?? 0) > 0);

  const sort = filters.sort ?? 'closest';
  items.sort((a, b) => sort === 'points' ? b.points - a.points : sort === 'popular' ? (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) : new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const page = makePage(items, filters.page, filters.pageSize);
  return { ...page, items: page.items.map((item) => activityView(database, item, counts)), categories: database.categories, clubs: database.clubs };
}

export async function listActivities(filters: ActivityFilters = {}) {
  const database = await readDatabase();
  return buildActivityPage(database, filters);
}

export async function getActivityBySlug(slug: string) {
  const database = await readDatabase();
  const normalize = (value: string) => {
    try {
      return decodeURIComponent(value).normalize('NFC');
    } catch {
      return value.normalize('NFC');
    }
  };
  const requested = normalize(slug);
  const activity = database.activities.find((item) => normalize(item.slug) === requested);
  return activity ? activityView(database, activity) : undefined;
}

export async function getProfile(id: string) {
  return (await readDatabase()).profiles.find((item) => item.id === id);
}

export async function getDb() { return readDatabase(); }

export function enrichApplication(database: DatabaseSnapshot, application: Application) {
  const activity = activityView(database, database.activities.find((item) => item.id === application.activityId)!);
  const student = database.profiles.find((item) => item.id === application.studentId)!;
  return { ...application, activity, student };
}

export async function studentData(studentId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((item) => item.id === studentId)!;
  const applications = database.applications.filter((item) => item.studentId === studentId).map((item) => enrichApplication(database, item));
  const reports = database.reports.filter((item) => item.studentId === studentId);
  const unlocked = database.studentBadges.filter((item) => item.studentId === studentId).map((item) => ({ ...item, badge: database.badges.find((badge) => badge.id === item.badgeId)! }));
  return { database, profile, applications, reports, unlocked };
}

export async function teacherQueue(teacherId: string) {
  const database = await readDatabase();
  const activityIds = database.activities.filter((item) => item.teacherId === teacherId).map((item) => item.id);
  const applications = database.applications.filter((item) => activityIds.includes(item.activityId)).map((item) => enrichApplication(database, item));
  const reports = database.reports.filter((item) => activityIds.includes(item.activityId)).map((item) => ({ ...item, application: enrichApplication(database, database.applications.find((app) => app.id === item.applicationId)!), student: database.profiles.find((profile) => profile.id === item.studentId)! }));
  return { database, activities: database.activities.filter((item) => activityIds.includes(item.id)).map((item) => activityView(database, item)), applications, reports };
}

export async function adminData() {
  const database = await readDatabase();
  return { database, activities: database.activities.map((item) => activityView(database, item)), students: database.profiles.filter((item) => item.role === 'student'), teachers: database.profiles.filter((item) => item.role === 'teacher') };
}

export async function authenticate(email: string, password: string): Promise<Profile | undefined> {
  const profile = (await readDatabase()).profiles.find((item) => item.email.toLocaleLowerCase() === email.toLocaleLowerCase() && item.status === 'active');
  return profile && await compare(password, profile.passwordHash) ? profile : undefined;
}
