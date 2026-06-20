import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Activity, ApplicationStatus, MediaAsset, Profile, ReportStatus } from '@/types/entities';
import { hash } from 'bcryptjs';
import { readDatabase, replaceDatabase as writeDatabase } from '@/server/supabase-store';
import { deleteImageKitFile } from '@/server/imagekit';

export class DomainError extends Error {}
const now = () => new Date().toISOString();
const ownedActivity = (teacherId: string, activity: Activity) => activity.teacherId === teacherId;

export const applicationSchema = z.object({ activityId: z.string().min(1), motivation: z.string().trim().min(10, 'Опишіть, для чого додаєте цей крок.').max(1000) });
export const reportSchema = z.object({ applicationId: z.string(), reflection: z.string().trim().min(20, 'Доказ має містити щонайменше 20 символів.'), hoursSpent: z.coerce.number().positive('Вкажіть додатну кількість годин.'), skillsGained: z.string().trim().min(3, 'Вкажіть компетентності.'), evidenceUrl: z.string().trim().optional(), removeImage: z.string().optional() });

type Database = Awaited<ReturnType<typeof readDatabase>>;
type ImageInput = { imageUrl?: string; imageFileId?: string; imageFileName?: string; imageThumbnailUrl?: string; imageAlt?: string; removeImage?: string };

function nextImageKey(database: Database) {
  return Math.max(
    8,
    ...database.mediaAssets.map((item) => item.imageKey),
    ...database.activities.map((item) => item.imageKey),
    ...database.clubs.map((item) => item.imageKey),
    ...database.categories.map((item) => item.imageKey),
    ...database.badges.map((item) => item.imageKey),
  ) + 1;
}

function isImageKeyUsed(database: Database, kind: MediaAsset['kind'], imageKey: number) {
  if (kind === 'activity') return database.activities.some((item) => item.imageKey === imageKey);
  if (kind === 'club') return database.clubs.some((item) => item.imageKey === imageKey);
  if (kind === 'badge') return database.badges.some((item) => item.imageKey === imageKey);
  return database.categories.some((item) => item.imageKey === imageKey);
}

async function deleteUnusedMedia(database: Database, kind: MediaAsset['kind'], imageKey: number) {
  if (isImageKeyUsed(database, kind, imageKey)) return;
  const assets = database.mediaAssets.filter((item) => item.kind === kind && item.imageKey === imageKey);
  for (const asset of assets) await deleteImageKitFile(asset.fileId);
  database.mediaAssets = database.mediaAssets.filter((item) => !assets.some((asset) => asset.id === item.id));
}

function attachMedia(database: Database, kind: MediaAsset['kind'], input: ImageInput, fallbackAlt: string) {
  if (!input.imageUrl?.trim()) return undefined;
  const imageKey = nextImageKey(database);
  database.mediaAssets.push({
    id: randomUUID(),
    kind,
    imageKey,
    fileName: input.imageFileName?.trim() || `${kind}-${imageKey}.png`,
    fileId: input.imageFileId?.trim() || undefined,
    url: input.imageUrl.trim(),
    thumbnailUrl: input.imageThumbnailUrl?.trim() || input.imageUrl.trim(),
    alt: input.imageAlt?.trim() || fallbackAlt,
    dominantColor: '#48c8d8',
  });
  return imageKey;
}

async function applyMediaChange(database: Database, kind: MediaAsset['kind'], currentImageKey: number, fallbackImageKey: number, input: ImageInput, fallbackAlt: string, setImageKey: (value: number) => void) {
  const oldImageKey = currentImageKey;
  if (input.removeImage === 'true') {
    setImageKey(fallbackImageKey);
    await deleteUnusedMedia(database, kind, oldImageKey);
    return;
  }
  const nextKey = attachMedia(database, kind, input, fallbackAlt);
  if (nextKey) {
    setImageKey(nextKey);
    await deleteUnusedMedia(database, kind, oldImageKey);
  }
}

export async function submitApplication(actor: Profile, input: unknown) {
  if (actor.role !== 'student') throw new DomainError('Маршрут формує студент.');
  const values = applicationSchema.parse(input);
  const database = await readDatabase();
  const activity = database.activities.find((item) => item.id === values.activityId);
  if (!activity || activity.status !== 'published') throw new DomainError('Цей крок зараз недоступний.');
  if (database.applications.some((item) => item.studentId === actor.id && item.activityId === activity.id && !['cancelled', 'rejected', 'missed'].includes(item.status))) throw new DomainError('Цей крок уже є у вашому маршруті.');
  database.applications.push({ id: randomUUID(), activityId: activity.id, studentId: actor.id, status: 'approved', motivation: values.motivation, createdAt: now(), updatedAt: now() });
  await writeDatabase(database);
}

export async function cancelApplication(actor: Profile, applicationId: string, reason: string) {
  const database = await readDatabase();
  const application = database.applications.find((item) => item.id === applicationId);
  if (!application || application.studentId !== actor.id) throw new DomainError('Крок маршруту не знайдено.');
  if (!['submitted', 'under_review', 'approved'].includes(application.status)) throw new DomainError('Цей крок уже завершено або прибрано.');
  if (application.status === 'approved' && reason.trim().length < 5) throw new DomainError('Коротко вкажіть причину.');
  application.status = 'cancelled'; application.cancellationReason = reason.trim(); application.updatedAt = now();
  await writeDatabase(database);
}

export async function submitReport(actor: Profile, input: unknown) {
  if (actor.role !== 'student') throw new DomainError('Доказ додає студент.');
  const values = reportSchema.parse(input);
  const database = await readDatabase();
  const application = database.applications.find((item) => item.id === values.applicationId && item.studentId === actor.id);
  if (!application || !['approved', 'attended'].includes(application.status)) throw new DomainError('Доказ можна додати лише до кроку у маршруті.');
  const activity = database.activities.find((item) => item.id === application.activityId)!;
  const existing = database.reports.find((item) => item.applicationId === application.id);
  if (existing && ['approved', 'rejected'].includes(existing.status)) throw new DomainError('Цей доказ уже розглянуто.');
  const report = existing ?? { id: randomUUID(), applicationId: application.id, activityId: application.activityId, studentId: actor.id, status: 'draft' as ReportStatus, reflection: '', hoursSpent: 0, skillsGained: '', createdAt: now(), updatedAt: now() };
  report.reflection = values.reflection; report.hoursSpent = values.hoursSpent; report.skillsGained = values.skillsGained; report.status = 'submitted'; report.updatedAt = now();
  if (values.removeImage === 'true') report.evidenceUrl = undefined;
  else if (values.evidenceUrl?.trim()) report.evidenceUrl = values.evidenceUrl.trim();
  if (!existing) database.reports.push(report);
  await writeDatabase(database);
}

export async function reviewApplication(actor: Profile, applicationId: string, status: Extract<ApplicationStatus, 'approved' | 'rejected'>, comment: string) {
  const database = await readDatabase(); const application = database.applications.find((item) => item.id === applicationId);
  if (!application) throw new DomainError('Крок маршруту не знайдено.');
  const activity = database.activities.find((item) => item.id === application.activityId)!;
  if (actor.role !== 'admin' && !(actor.role === 'teacher' && ownedActivity(actor.id, activity))) throw new DomainError('Немає доступу до цього маршруту.');
  if (status === 'rejected' && comment.trim().length < 5) throw new DomainError('Для відкладення вкажіть причину.');
  if (status === 'approved') {
    const approved = database.applications.filter((item) => item.activityId === activity.id && ['approved', 'attended'].includes(item.status)).length;
    if (approved >= activity.maxParticipants) throw new DomainError('Немає вільних місць.');
  }
  application.status = status; application.teacherComment = comment.trim(); application.rejectionReason = status === 'rejected' ? comment.trim() : undefined; application.updatedAt = now();
  await writeDatabase(database);
}

export async function reviewReport(actor: Profile, reportId: string, status: Extract<ReportStatus, 'approved' | 'rejected' | 'needs_changes'>, feedback: string) {
  const database = await readDatabase(); const report = database.reports.find((item) => item.id === reportId);
  if (!report) throw new DomainError('Доказ не знайдено.');
  const activity = database.activities.find((item) => item.id === report.activityId)!;
  if (actor.role !== 'admin' && !(actor.role === 'teacher' && ownedActivity(actor.id, activity))) throw new DomainError('Немає доступу до цього доказу.');
  if ((status === 'rejected' || status === 'needs_changes') && feedback.trim().length < 5) throw new DomainError('Додайте зрозумілий коментар для студента.');
  const previousStatus = report.status;
  report.status = status; report.teacherFeedback = feedback.trim(); report.reviewedBy = actor.id; report.updatedAt = now();
  const student = database.profiles.find((item) => item.id === report.studentId)!;
  if (status === 'approved') {
    const application = database.applications.find((item) => item.id === report.applicationId)!; application.status = 'attended';
    if (previousStatus !== 'approved') {
      student.pointsTotal += activity.points;
      unlockBadges(database, student);
    }
  }
  await writeDatabase(database);
}

function unlockBadges(database: Awaited<ReturnType<typeof readDatabase>>, student: Profile) {
  const attended = database.applications.filter((item) => item.studentId === student.id && item.status === 'attended');
  for (const badge of database.badges.filter((item) => item.isActive)) {
    const condition = badge.conditionType === 'points' ? student.pointsTotal >= badge.conditionValue : badge.conditionType === 'activities' ? attended.length >= badge.conditionValue : attended.some((application) => database.activities.find((activity) => activity.id === application.activityId)?.categoryId === badge.categoryId);
    if (condition && !database.studentBadges.some((item) => item.studentId === student.id && item.badgeId === badge.id)) database.studentBadges.push({ id: randomUUID(), studentId: student.id, badgeId: badge.id, unlockedAt: now() });
  }
}

export async function updateProfile(actor: Profile, input: { fullName: string; phone?: string; bio?: string; groupId?: string; specialityId?: string }) {
  const database = await readDatabase(); const profile = database.profiles.find((item) => item.id === actor.id)!;
  if (!input.fullName.trim()) throw new DomainError('Вкажіть повне ім’я.');
  profile.fullName = input.fullName.trim(); profile.phone = input.phone?.trim(); profile.bio = input.bio?.trim();
  if (actor.role === 'student') { if (!input.groupId || !input.specialityId) throw new DomainError('Оберіть групу та спеціальність.'); profile.groupId = input.groupId; profile.specialityId = input.specialityId; }
  await writeDatabase(database);
}

export async function toggleUser(actor: Profile, profileId: string) {
  if (actor.role !== 'admin') throw new DomainError('Лише адміністратор може змінювати статус користувачів.');
  const database = await readDatabase(); const profile = database.profiles.find((item) => item.id === profileId);
  if (!profile || profile.role === 'admin') throw new DomainError('Обліковий запис адміністратора не можна деактивувати.');
  profile.status = profile.status === 'active' ? 'inactive' : 'active'; await writeDatabase(database);
}

export async function registerStudent(input: { fullName: string; email: string; password: string; groupId?: string; specialityId?: string }) {
  const database = await readDatabase();
  if (!input.fullName.trim()) throw new DomainError('Вкажіть повне ім’я.');
  if (!z.string().email().safeParse(input.email).success) throw new DomainError('Вкажіть коректну електронну пошту.');
  if (input.password.length < 6) throw new DomainError('Пароль має містити щонайменше 6 символів.');
  if (database.profiles.some((item) => item.email.toLocaleLowerCase() === input.email.trim().toLocaleLowerCase())) throw new DomainError('Користувач із такою поштою вже існує.');
  const profile: Profile = { id: randomUUID(), fullName: input.fullName.trim(), email: input.email.trim().toLocaleLowerCase(), passwordHash: await hash(input.password, 10), role: 'student', status: 'active', groupId: input.groupId, specialityId: input.specialityId, pointsTotal: 0 };
  database.profiles.push(profile);
  await writeDatabase(database); return profile;
}

function adminOnly(actor: Profile) { if (actor.role !== 'admin') throw new DomainError('Ця дія доступна лише адміністратору.'); }
export async function createTeacher(actor: Profile, input: { fullName: string; email: string; password: string }) {
  adminOnly(actor); const database = await readDatabase();
  if (!input.fullName.trim() || !z.string().email().safeParse(input.email).success || input.password.length < 6) throw new DomainError('Заповніть ім’я, коректну пошту та пароль від 6 символів.');
  if (database.profiles.some((item) => item.email.toLocaleLowerCase() === input.email.toLocaleLowerCase())) throw new DomainError('Користувач із такою поштою вже існує.');
  const teacher: Profile = { id: randomUUID(), fullName: input.fullName.trim(), email: input.email.trim().toLocaleLowerCase(), passwordHash: await hash(input.password, 10), role: 'teacher', status: 'active', pointsTotal: 0 };
  database.profiles.push(teacher); await writeDatabase(database);
}
export async function createActivity(actor: Profile, input: { title: string; shortDescription: string; categoryId: string; clubId: string; teacherId: string; format: string; location: string; startAt: string; endAt: string; maxParticipants: string; points: string } & ImageInput) {
  adminOnly(actor); const database = await readDatabase(); const start = new Date(input.startAt); const end = new Date(input.endAt); const maxParticipants = Number(input.maxParticipants); const points = Number(input.points);
  if (!input.title.trim() || !input.shortDescription.trim() || !database.categories.some((item) => item.id === input.categoryId) || !database.clubs.some((item) => item.id === input.clubId) || !database.profiles.some((item) => item.id === input.teacherId && item.role === 'teacher') || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start || maxParticipants <= 0 || points < 0) throw new DomainError('Перевірте назву, довідники, дати, місткість і кількість балів.');
  const slugBase = input.title.trim().toLocaleLowerCase('uk-UA').replace(/[^a-zа-яіїєґ0-9]+/gi, '-').replace(/^-|-$/g, '') || 'activity';
  const fallbackImageKey = (database.activities.length % 8) + 1;
  const imageKey = attachMedia(database, 'activity', input, input.title.trim()) ?? fallbackImageKey;
  database.activities.push({ id: randomUUID(), title: input.title.trim(), slug: `${slugBase}-${Date.now().toString().slice(-5)}`, shortDescription: input.shortDescription.trim(), description: input.shortDescription.trim(), categoryId: input.categoryId, clubId: input.clubId, teacherId: input.teacherId, imageKey, format: input.format as Activity['format'], location: input.location.trim() || 'Уточнюється', startAt: start.toISOString(), endAt: end.toISOString(), maxParticipants, points, difficulty: 'beginner', status: 'published', requirements: 'Оберіть очікуваний доказ перед стартом.', resultDescription: 'Доказ у портфоліо та оновлена карта компетентностей.', skills: ['Самоменеджмент', 'Командна робота'] });
  await writeDatabase(database);
}
export async function createReference(actor: Profile, kind: 'groups' | 'specialities' | 'clubs' | 'categories' | 'badges', input: { name: string; code?: string; teacherId?: string; description?: string; color?: string } & ImageInput) {
  adminOnly(actor); const database = await readDatabase(); if (!input.name.trim()) throw new DomainError('Вкажіть назву.'); const id = randomUUID(); const slug = input.name.trim().toLocaleLowerCase('uk-UA').replace(/[^a-zа-яіїєґ0-9]+/gi, '-');
  if (kind === 'specialities') database.specialities.push({ id, code: input.code?.trim().toUpperCase() || `SP-${database.specialities.length + 1}`, name: input.name.trim(), description: input.description?.trim() || '' });
  if (kind === 'groups') { const specialityId = database.specialities[0]?.id; if (!specialityId) throw new DomainError('Спершу створіть спеціальність.'); const startYear = new Date().getFullYear(); database.groups.push({ id, name: `${input.name.trim()} (${startYear}-${startYear + 4})`, specialityId, startYear, endYear: startYear + 4, isActive: true }); }
  if (kind === 'clubs') { const teacherId = input.teacherId || database.profiles.find((item) => item.role === 'teacher')?.id; if (!teacherId) throw new DomainError('Спершу створіть викладача.'); const fallbackImageKey = (database.clubs.length % 8) + 1; database.clubs.push({ id, name: input.name.trim(), slug, description: input.description?.trim() || '', teacherId, imageKey: attachMedia(database, 'club', input, input.name.trim()) ?? fallbackImageKey, status: 'active' }); }
  if (kind === 'categories') { const fallbackImageKey = (database.categories.length % 8) + 1; database.categories.push({ id, name: input.name.trim(), slug, color: input.color || input.code || 'aqua', imageKey: attachMedia(database, 'visual', input, input.name.trim()) ?? fallbackImageKey }); }
  if (kind === 'badges') { const fallbackImageKey = (database.badges.length % 8) + 1; database.badges.push({ id, title: input.name.trim(), description: input.description?.trim() || 'Нова відзнака StudentFlow.', imageKey: attachMedia(database, 'badge', input, input.name.trim()) ?? fallbackImageKey, color: input.color || input.code || 'aqua', conditionType: 'points', conditionValue: 10, isActive: true }); }
  await writeDatabase(database);
}

export async function grantStudentBadge(actor: Profile, input: { studentId: string; badgeId: string }) {
  adminOnly(actor);
  const database = await readDatabase();
  const student = database.profiles.find((item) => item.id === input.studentId && item.role === 'student');
  const badge = database.badges.find((item) => item.id === input.badgeId && item.isActive);
  if (!student || !badge) throw new DomainError('Студента або відзнаку не знайдено.');
  if (!database.studentBadges.some((item) => item.studentId === student.id && item.badgeId === badge.id)) {
    database.studentBadges.push({ id: randomUUID(), studentId: student.id, badgeId: badge.id, unlockedAt: now() });
  }
  await writeDatabase(database);
}

export async function updateAdminEntity(actor: Profile, input: { entity: string; id: string; values: Record<string, string> }) {
  adminOnly(actor);
  const database = await readDatabase();
  const values = input.values ?? {};
  if (input.entity === 'profile') {
    const profile = database.profiles.find((item) => item.id === input.id);
    if (!profile || profile.role === 'admin') throw new DomainError('Профіль не знайдено або недоступний для редагування.');
    if (values.fullName?.trim()) profile.fullName = values.fullName.trim();
    if (values.email?.trim() && z.string().email().safeParse(values.email).success) profile.email = values.email.trim().toLocaleLowerCase();
    if (values.phone !== undefined) profile.phone = values.phone.trim();
    if (values.bio !== undefined) profile.bio = values.bio.trim();
    if (values.password?.trim()) profile.passwordHash = await hash(values.password.trim(), 10);
  }
  if (input.entity === 'activity') {
    const activity = database.activities.find((item) => item.id === input.id);
    if (!activity) throw new DomainError('Можливість не знайдено.');
    if (values.title?.trim()) activity.title = values.title.trim();
    if (values.shortDescription?.trim()) activity.shortDescription = values.shortDescription.trim();
    if (values.description?.trim()) activity.description = values.description.trim();
    if (values.requirements?.trim()) activity.requirements = values.requirements.trim();
    if (values.resultDescription?.trim()) activity.resultDescription = values.resultDescription.trim();
    if (values.categoryId && database.categories.some((item) => item.id === values.categoryId)) activity.categoryId = values.categoryId;
    if (values.clubId && database.clubs.some((item) => item.id === values.clubId)) activity.clubId = values.clubId;
    if (values.teacherId && database.profiles.some((item) => item.id === values.teacherId && item.role === 'teacher')) activity.teacherId = values.teacherId;
    if (values.status) activity.status = values.status as Activity['status'];
    if (values.format) activity.format = values.format as Activity['format'];
    if (values.location !== undefined) activity.location = values.location.trim();
    if (values.points) activity.points = Number(values.points);
    if (values.maxParticipants) activity.maxParticipants = Number(values.maxParticipants);
    await applyMediaChange(database, 'activity', activity.imageKey, 1, values, activity.title, (value) => { activity.imageKey = value; });
  }
  if (input.entity === 'group') {
    const group = database.groups.find((item) => item.id === input.id);
    if (!group) throw new DomainError('Групу не знайдено.');
    if (values.startYear) group.startYear = Number(values.startYear);
    if (values.endYear) group.endYear = Number(values.endYear);
    const baseName = (values.name?.trim() || group.name).replace(/\s*\(\d{4}\s*-\s*\d{4}\)\s*$/, '').trim();
    group.name = `${baseName} (${group.startYear}-${group.endYear})`;
  }
  if (input.entity === 'speciality') {
    const item = database.specialities.find((x) => x.id === input.id);
    if (!item) throw new DomainError('Спеціальність не знайдено.');
    if (values.code?.trim()) item.code = values.code.trim().toUpperCase();
    if (values.name?.trim()) item.name = values.name.trim();
    if (values.description !== undefined) item.description = values.description.trim();
  }
  if (input.entity === 'club') {
    const item = database.clubs.find((x) => x.id === input.id);
    if (!item) throw new DomainError('Майданчик не знайдено.');
    if (values.name?.trim()) item.name = values.name.trim();
    if (values.description !== undefined) item.description = values.description.trim();
    if (values.teacherId && database.profiles.some((profile) => profile.id === values.teacherId && profile.role === 'teacher')) item.teacherId = values.teacherId;
    await applyMediaChange(database, 'club', item.imageKey, 1, values, item.name, (value) => { item.imageKey = value; });
  }
  if (input.entity === 'category') {
    const item = database.categories.find((x) => x.id === input.id);
    if (!item) throw new DomainError('Трек не знайдено.');
    if (values.name?.trim()) item.name = values.name.trim();
    if (values.color?.trim()) item.color = values.color.trim();
    await applyMediaChange(database, 'visual', item.imageKey, 1, values, item.name, (value) => { item.imageKey = value; });
  }
  if (input.entity === 'badge') {
    const item = database.badges.find((x) => x.id === input.id);
    if (!item) throw new DomainError('Відзнаку не знайдено.');
    if (values.title?.trim()) item.title = values.title.trim();
    if (values.description !== undefined) item.description = values.description.trim();
    if (values.conditionValue) item.conditionValue = Number(values.conditionValue);
    if (values.isActive) item.isActive = values.isActive === 'true';
    await applyMediaChange(database, 'badge', item.imageKey, 1, values, item.title, (value) => { item.imageKey = value; });
  }
  await writeDatabase(database);
}

export async function deleteAdminEntity(actor: Profile, input: { entity: string; id: string }) {
  adminOnly(actor);
  const database = await readDatabase();
  const deleteActivity = async (activityId: string) => {
    const activity = database.activities.find((item) => item.id === activityId);
    const imageKey = activity?.imageKey;
    database.reports = database.reports.filter((item) => item.activityId !== activityId);
    database.applications = database.applications.filter((item) => item.activityId !== activityId);
    database.activities = database.activities.filter((item) => item.id !== activityId);
    if (imageKey) await deleteUnusedMedia(database, 'activity', imageKey);
  };
  const deleteBadge = async (badgeId: string) => {
    const badge = database.badges.find((item) => item.id === badgeId);
    const imageKey = badge?.imageKey;
    database.studentBadges = database.studentBadges.filter((item) => item.badgeId !== badgeId);
    database.badges = database.badges.filter((item) => item.id !== badgeId);
    if (imageKey) await deleteUnusedMedia(database, 'badge', imageKey);
  };
  const deleteGroup = (groupId: string) => {
    database.profiles.filter((item) => item.groupId === groupId).forEach((item) => { item.groupId = undefined; });
    database.groups = database.groups.filter((item) => item.id !== groupId);
  };
  const deleteClub = async (clubId: string) => {
    const club = database.clubs.find((item) => item.id === clubId);
    const imageKey = club?.imageKey;
    const activities = database.activities.filter((item) => item.clubId === clubId);
    for (const activity of activities) {
      await deleteActivity(activity.id);
    }
    database.clubs = database.clubs.filter((item) => item.id !== clubId);
    if (imageKey) await deleteUnusedMedia(database, 'club', imageKey);
  };

  if (input.entity === 'profile') {
    const profile = database.profiles.find((item) => item.id === input.id);
    if (!profile || profile.role === 'admin') throw new DomainError('Профіль не знайдено або недоступний для видалення.');
    if (profile.role === 'teacher') {
      const activities = database.activities.filter((item) => item.teacherId === profile.id);
      for (const activity of activities) {
        await deleteActivity(activity.id);
      }
      const clubs = database.clubs.filter((item) => item.teacherId === profile.id);
      for (const club of clubs) {
        await deleteClub(club.id);
      }
    }
    if (profile.role === 'student') {
      database.reports = database.reports.filter((item) => item.studentId !== profile.id);
      database.applications = database.applications.filter((item) => item.studentId !== profile.id);
      database.studentBadges = database.studentBadges.filter((item) => item.studentId !== profile.id);
    }
    database.profiles = database.profiles.filter((item) => item.id !== profile.id);
  }
  if (input.entity === 'activity') await deleteActivity(input.id);
  if (input.entity === 'group') {
    deleteGroup(input.id);
  }
  if (input.entity === 'speciality') {
    database.profiles.filter((item) => item.specialityId === input.id).forEach((item) => { item.specialityId = undefined; });
    database.groups.filter((item) => item.specialityId === input.id).forEach((item) => deleteGroup(item.id));
    database.specialities = database.specialities.filter((item) => item.id !== input.id);
  }
  if (input.entity === 'club') {
    await deleteClub(input.id);
  }
  if (input.entity === 'category') {
    const category = database.categories.find((item) => item.id === input.id);
    const imageKey = category?.imageKey;
    const activities = database.activities.filter((item) => item.categoryId === input.id);
    for (const activity of activities) {
      await deleteActivity(activity.id);
    }
    const badges = database.badges.filter((item) => item.categoryId === input.id);
    for (const badge of badges) {
      await deleteBadge(badge.id);
    }
    database.categories = database.categories.filter((item) => item.id !== input.id);
    if (imageKey) await deleteUnusedMedia(database, 'visual', imageKey);
  }
  if (input.entity === 'badge') {
    await deleteBadge(input.id);
  }
  if (input.entity === 'studentBadge') {
    database.studentBadges = database.studentBadges.filter((item) => item.id !== input.id);
  }
  if (input.entity === 'mediaAsset') {
    const asset = database.mediaAssets.find((item) => item.id === input.id);
    await deleteImageKitFile(asset?.fileId);
    database.mediaAssets = database.mediaAssets.filter((item) => item.id !== input.id);
  }
  await writeDatabase(database);
}
