import type { Activity, ActivityView, Application, DatabaseSnapshot, Profile } from '@/types/entities';
import { readDatabase } from '@/server/supabase-store';
import { compare } from 'bcryptjs';

export type ActivityFilters = { search?: string; category?: string; club?: string; format?: string; difficulty?: string; available?: string; sort?: string; page?: number; pageSize?: number; };
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number; };

export function activityView(database: DatabaseSnapshot, activity: Activity): ActivityView {
  const category = database.categories.find((item) => item.id === activity.categoryId)!;
  const club = database.clubs.find((item) => item.id === activity.clubId)!;
  const teacher = database.profiles.find((item) => item.id === activity.teacherId)!;
  const media = database.mediaAssets.find((item) => item.kind === 'activity' && item.imageKey === activity.imageKey);
  const approvedCount = database.applications.filter((item) => item.activityId === activity.id && ['approved', 'attended'].includes(item.status)).length;
  return { ...activity, category, club, teacher, approvedCount, availablePlaces: Math.max(0, activity.maxParticipants - approvedCount), imageUrl: media?.url, imageAlt: media?.alt };
}

export function makePage<T>(items: T[], page = 1, pageSize = 6): Page<T> {
  const safePageSize = [6, 12, 24].includes(pageSize) ? pageSize : 6;
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return { items: items.slice((safePage - 1) * safePageSize, safePage * safePageSize), total: items.length, page: safePage, pageSize: safePageSize, pageCount };
}

export async function listActivities(filters: ActivityFilters = {}) {
  const database = await readDatabase();
  let items = database.activities.filter((item) => item.status === 'published').map((item) => activityView(database, item));
  const needle = filters.search?.trim().toLocaleLowerCase('uk-UA');
  if (needle) items = items.filter((item) => `${item.title} ${item.shortDescription} ${item.description}`.toLocaleLowerCase('uk-UA').includes(needle));
  if (filters.category) items = items.filter((item) => item.categoryId === filters.category);
  if (filters.club) items = items.filter((item) => item.clubId === filters.club);
  if (filters.format) items = items.filter((item) => item.format === filters.format);
  if (filters.difficulty) items = items.filter((item) => item.difficulty === filters.difficulty);
  if (filters.available === 'yes') items = items.filter((item) => item.availablePlaces > 0);
  const sort = filters.sort ?? 'closest';
  items.sort((a, b) => sort === 'points' ? b.points - a.points : sort === 'popular' ? b.approvedCount - a.approvedCount : new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return { ...makePage(items, filters.page, filters.pageSize), categories: database.categories, clubs: database.clubs };
}

export async function getActivityBySlug(slug: string) {
  const database = await readDatabase();
  const activity = database.activities.find((item) => item.slug === slug);
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
