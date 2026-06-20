import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { ActivityCard } from '../src/components/ui/primitives';
import type { ActivityView } from '../src/types/entities';

Object.assign(globalThis, { React });

const activity: ActivityView = {
  id: 'activity-1',
  title: 'Тестова активність',
  slug: 'testova-aktyvnist',
  shortDescription: 'Короткий опис активності',
  description: 'Повний опис активності',
  categoryId: 'category-1',
  clubId: 'club-1',
  teacherId: 'teacher-1',
  imageKey: 1,
  format: 'offline',
  location: 'Аудиторія',
  startAt: '2026-06-20T10:00:00.000Z',
  endAt: '2026-06-20T12:00:00.000Z',
  maxParticipants: 20,
  points: 15,
  difficulty: 'beginner',
  status: 'published',
  requirements: 'Підготувати приклад',
  resultDescription: 'Доказ у портфоліо',
  skills: ['Командна робота', 'Презентація'],
  category: { id: 'category-1', name: 'Дослідження', slug: 'doslidzhennia', color: 'aqua', imageKey: 1 },
  club: { id: 'club-1', name: 'Майданчик', slug: 'maidanchyk', description: '', teacherId: 'teacher-1', imageKey: 1, status: 'active' },
  teacher: { id: 'teacher-1', fullName: 'Ментор', email: 'mentor@example.com', passwordHash: '', role: 'teacher', status: 'active', pointsTotal: 0 },
  approvedCount: 0,
  availablePlaces: 20,
  imageUrl: '/seed-images/activities/campus-pulse-atlas.png',
  imageAlt: 'Тестова активність',
};

function collectActivityLinks(node: ReactNode, links: ReactElement[] = []) {
  if (Array.isArray(node)) {
    for (const child of node) collectActivityLinks(child, links);
    return links;
  }

  if (!isValidElement(node)) return links;

  const props = node.props as { href?: string; children?: ReactNode };
  if (props.href === `/activities/${activity.slug}`) links.push(node);
  collectActivityLinks(props.children, links);
  return links;
}

test('activity cards do not prefetch every activity details page from listing screens', () => {
  const links = collectActivityLinks(ActivityCard({ activity }));

  assert.equal(links.length, 2);
  assert.ok(links.every((link) => (link.props as { prefetch?: boolean }).prefetch === false));
});
