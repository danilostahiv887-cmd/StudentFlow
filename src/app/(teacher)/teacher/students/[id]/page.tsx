import { notFound } from 'next/navigation';
import { requireUser } from '@/server/auth';
import { makePage, studentData, teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  BadgeCard,
  DashboardMetric,
  ListControls,
  Pagination,
  StatusBadge,
} from '@/components/ui/primitives';

type Search = { search?: string; pageSize?: string; routePage?: string; badgePage?: string };

export default async function TeacherStudentProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['teacher']);
  const { id } = await params;
  const query = await searchParams;
  const [student, queue] = await Promise.all([studentData(id), teacherQueue(user.id)]);
  const canSee = queue.applications.some((item) => item.studentId === id);
  if (!canSee) notFound();

  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const routeItems = student.applications.filter(
    (item) =>
      !needle ||
      `${item.activity.title} ${item.activity.category.name} ${item.motivation}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
  );
  const badgeItems = student.unlocked.filter(
    (item) =>
      !needle ||
      `${item.badge.title} ${item.badge.description}`.toLocaleLowerCase('uk-UA').includes(needle),
  );
  const routes = makePage(routeItems, Number(query.routePage ?? 1), pageSize);
  const badges = makePage(badgeItems, Number(query.badgePage ?? 1), pageSize);
  const baseQuery = { search: query.search, pageSize: query.pageSize };
  const badgeImage = (imageKey: number) =>
    student.database.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === imageKey)
      ?.url;

  return (
    <div className="page">
      <div className="workspace">
        <WorkspaceNav role="teacher" active="/teacher/reviews" />
        <div className="workspace-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Профіль студента</p>
              <h1>{student.profile.fullName}</h1>
            </div>
            <p>{student.profile.bio || 'Профіль студента ще не містить опису.'}</p>
          </div>
          <div className="dashboard-grid">
            <DashboardMetric label="Бали" value={student.profile.pointsTotal} accent="aqua" />
            <DashboardMetric
              label="Кроки маршруту"
              value={student.applications.length}
              accent="violet"
            />
            <DashboardMetric label="Докази" value={student.reports.length} accent="lime" />
            <DashboardMetric label="Відзнаки" value={student.unlocked.length} accent="coral" />
          </div>
          <section className="surface reference-toolbar">
            <ListControls
              pathname={`/teacher/students/${student.profile.id}`}
              search={query.search}
              pageSize={pageSize}
              placeholder="Крок або відзнака"
            />
          </section>
          <div className="dashboard-columns">
            <section className="surface">
              <h2>Маршрут</h2>
              {routes.items.map((item) => (
                <div className="queue-row" key={item.id}>
                  <div>
                    <b>{item.activity.title}</b>
                    <small>{item.activity.category.name}</small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
              <Pagination
                page={routes.page}
                pageCount={routes.pageCount}
                total={routes.total}
                pathname={`/teacher/students/${student.profile.id}`}
                query={baseQuery}
                pageParam="routePage"
              />
            </section>
            <section className="surface">
              <h2>Відзнаки</h2>
              {badges.items.map((item) => (
                <BadgeCard
                  key={item.id}
                  badge={item.badge}
                  unlockedAt={item.unlockedAt}
                  imageUrl={badgeImage(item.badge.imageKey)}
                />
              ))}
              <Pagination
                page={badges.page}
                pageCount={badges.pageCount}
                total={badges.total}
                pathname={`/teacher/students/${student.profile.id}`}
                query={baseQuery}
                pageParam="badgePage"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
