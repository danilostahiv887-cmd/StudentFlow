import assert from 'node:assert/strict';
import test from 'node:test';
import { buildActivityPage } from '../src/server/repository';
import type { Activity, DatabaseSnapshot, MediaAsset } from '../src/types/entities';

const category = { id: 'category-1', name: 'Дослідження', slug: 'doslidzhennia', color: 'aqua', imageKey: 1 };
const club = { id: 'club-1', name: 'Майданчик', slug: 'maidanchyk', description: '', teacherId: 'teacher-1', imageKey: 1, status: 'active' as const };
const teacher = { id: 'teacher-1', fullName: 'Ментор', email: 'mentor@example.com', passwordHash: '', role: 'teacher' as const, status: 'active' as const, pointsTotal: 0 };

function activity(index: number): Activity {
  return {
    id: `activity-${index}`,
    title: `Активність ${index}`,
    slug: `aktyvnist-${index}`,
    shortDescription: `Короткий опис ${index}`,
    description: `Повний опис ${index}`,
    categoryId: category.id,
    clubId: club.id,
    teacherId: teacher.id,
    imageKey: index,
    format: 'offline',
    location: 'Аудиторія',
    startAt: `2026-06-${20 + index}T10:00:00.000Z`,
    endAt: `2026-06-${20 + index}T12:00:00.000Z`,
    maxParticipants: 20,
    points: index,
    difficulty: 'beginner',
    status: 'published',
    requirements: 'Підготувати приклад',
    resultDescription: 'Доказ у портфоліо',
    skills: ['Командна робота'],
  };
}

function media(index: number, readable: boolean): MediaAsset {
  const row = {
    id: `media-${index}`,
    kind: 'activity' as const,
    imageKey: index,
    fileName: `activity-${index}.png`,
    thumbnailUrl: `/media/activity-${index}.png`,
    dominantColor: '#48c8d8',
  } as MediaAsset;

  Object.defineProperty(row, 'url', {
    enumerable: true,
    get() {
      if (!readable) throw new Error(`Media for activity-${index} should not be read before pagination.`);
      return `/media/activity-${index}.png`;
    },
  });

  Object.defineProperty(row, 'alt', {
    enumerable: true,
    get() {
      if (!readable) throw new Error(`Alt for activity-${index} should not be read before pagination.`);
      return `Активність ${index}`;
    },
  });

  return row;
}

test('activity list hydrates media only for activities on the selected page', () => {
  const database: DatabaseSnapshot = {
    profiles: [teacher],
    groups: [],
    specialities: [],
    mediaAssets: [media(1, false), media(2, false), media(3, true), media(4, true), media(5, true), media(6, true), media(7, true), media(8, true)],
    clubs: [club],
    categories: [category],
    activities: [1, 2, 3, 4, 5, 6, 7, 8].map(activity),
    applications: [],
    reports: [],
    badges: [],
    studentBadges: [],
  };

  const result = buildActivityPage(database, { sort: 'points', pageSize: 6 });

  assert.equal(result.total, 8);
  assert.deepEqual(result.items.map((item) => item.id), ['activity-8', 'activity-7', 'activity-6', 'activity-5', 'activity-4', 'activity-3']);
  assert.deepEqual(result.items.map((item) => item.imageUrl), [
    '/media/activity-8.png',
    '/media/activity-7.png',
    '/media/activity-6.png',
    '/media/activity-5.png',
    '/media/activity-4.png',
    '/media/activity-3.png',
  ]);
});
