import Link from 'next/link';
import { requireUser } from '@/server/auth';
import { listActivities, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  ActivityCard,
  BadgeCard,
  DashboardMetric,
  SkillBars,
  StatusBadge,
} from '@/components/ui/primitives';
import { formatDateOnly } from '@/lib/formatters';

export default async function StudentDashboard() {
  const user = await requireUser(['student']);
  const [{ database, profile, applications, reports, unlocked }, recommended] = await Promise.all([
    studentData(user.id),
    listActivities({ pageSize: 3, sort: 'points' }),
  ]);
  const route = applications.filter((item) =>
    ['submitted', 'under_review', 'approved', 'attended'].includes(item.status),
  );
  const evidenceQueue = reports.filter((item) =>
    ['draft', 'needs_changes', 'submitted'].includes(item.status),
  );
  const skills = Array.from(
    new Set([
      ...route.flatMap((item) => item.activity.skills),
      ...reports.flatMap((item) =>
        item.skillsGained
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    ]),
  ).slice(0, 6);
  const badgeImage = (imageKey: number) =>
    database.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === imageKey)?.url;

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Студентська панель</p>
          <h1>{profile.fullName.split(' ')[0]}, ваш маршрут оновлено.</h1>
        </div>
        <Link className="button button-primary" href="/activities">
          Додати крок
        </Link>
      </div>
      <div className="workspace">
        <WorkspaceNav role="student" active="/student" />
        <div className="workspace-main">
          <div className="dashboard-grid">
            <DashboardMetric
              label="Бали портфоліо"
              value={profile.pointsTotal}
              accent="aqua"
              hint="прийняті докази"
            />
            <DashboardMetric
              label="Кроків у маршруті"
              value={route.length}
              accent="violet"
              hint="активний план"
            />
            <DashboardMetric
              label="Докази в роботі"
              value={evidenceQueue.length}
              accent="coral"
              hint="потрібна дія"
            />
            <DashboardMetric
              label="Відзнаки"
              value={unlocked.length}
              accent="lime"
              hint="розблоковано"
            />
          </div>
          <section className="route-board">
            <div className="route-board-head">
              <div>
                <p className="eyebrow">Мій маршрут</p>
                <h2>Наступні кроки</h2>
              </div>
              <Link href="/student/applications">Увесь маршрут</Link>
            </div>
            {route.length ? (
              <div className="route-lanes">
                {route.slice(0, 4).map((item, index) => (
                  <article className="route-step-card" key={item.id}>
                    <span>0{index + 1}</span>
                    <div>
                      <b>{item.activity.title}</b>
                      <small>
                        {formatDateOnly(item.activity.startAt)} · {item.activity.category.name}
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-route">
                <b>Маршрут ще порожній</b>
                <Link className="button button-secondary" href="/activities">
                  Вибрати перший крок
                </Link>
              </div>
            )}
          </section>
          <div className="dashboard-columns">
            <section className="surface">
              <div className="surface-head">
                <h2>Компетентності</h2>
                <Link href="/student/portfolio">Портфоліо</Link>
              </div>
              {skills.length ? (
                <SkillBars skills={skills} />
              ) : (
                <p className="muted">Додайте кроки, щоб побачити карту компетентностей.</p>
              )}
            </section>
            <section className="surface">
              <div className="surface-head">
                <h2>Відзнаки</h2>
                <Link href="/student/badges">Колекція</Link>
              </div>
              {unlocked.length ? (
                unlocked
                  .slice(0, 2)
                  .map((item) => (
                    <BadgeCard
                      badge={item.badge}
                      unlockedAt={item.unlockedAt}
                      imageUrl={badgeImage(item.badge.imageKey)}
                      key={item.id}
                    />
                  ))
              ) : (
                <p className="muted">Перша відзнака з’явиться після прийнятого доказу.</p>
              )}
            </section>
          </div>
          <section className="surface" style={{ marginTop: 18 }}>
            <div className="surface-head">
              <h2>Рекомендовано</h2>
              <Link href="/activities">Навігатор</Link>
            </div>
            <div className="activity-grid">
              {recommended.items.map((activity) => (
                <ActivityCard activity={activity} key={activity.id} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
