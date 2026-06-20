import { notFound } from 'next/navigation';
import { requireUser } from '@/server/auth';
import { makePage, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { StudentBadgeToggle } from '@/components/features/forms';
import {
  BadgeCard,
  DashboardMetric,
  ListControls,
  Pagination,
  StatusBadge,
} from '@/components/ui/primitives';
import { formatDateOnly } from '@/lib/formatters';

type Search = {
  search?: string;
  pageSize?: string;
  routePage?: string;
  reportPage?: string;
  badgePage?: string;
};

export default async function AdminStudentRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  await requireUser(['admin']);
  const { id } = await params;
  const query = await searchParams;
  const data = await studentData(id);
  if (!data.profile || data.profile.role !== 'student') notFound();
  const group = data.database.groups.find((item) => item.id === data.profile.groupId);
  const speciality = data.database.specialities.find(
    (item) => item.id === data.profile.specialityId,
  );
  const badgeImage = (imageKey: number) =>
    data.database.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === imageKey)
      ?.url;
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const applications = data.applications.filter(
    (item) =>
      !needle ||
      `${item.activity.title} ${item.activity.category.name} ${item.motivation}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
  );
  const reports = data.reports.filter((report) => {
    const activity = data.database.activities.find((item) => item.id === report.activityId);
    return (
      !needle ||
      `${activity?.title ?? ''} ${report.reflection} ${report.skillsGained} ${report.teacherFeedback ?? ''}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle)
    );
  });
  const badges = data.database.badges.filter(
    (badge) =>
      !needle || `${badge.title} ${badge.description}`.toLocaleLowerCase('uk-UA').includes(needle),
  );
  const routePage = makePage(applications, Number(query.routePage ?? 1), pageSize);
  const reportPage = makePage(reports, Number(query.reportPage ?? 1), pageSize);
  const badgePage = makePage(badges, Number(query.badgePage ?? 1), pageSize);
  const baseQuery = { search: query.search, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/students" />
        <div className="workspace-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Маршрут студента</p>
              <h1>{data.profile.fullName}</h1>
            </div>
            <p>
              {data.profile.email} · {group?.name ?? 'Групу не вибрано'} ·{' '}
              {speciality?.name ?? 'Спеціальність не вибрано'}
            </p>
          </div>
          <div className="dashboard-grid">
            <DashboardMetric label="Бали" value={data.profile.pointsTotal} accent="aqua" />
            <DashboardMetric
              label="Кроки маршруту"
              value={data.applications.length}
              accent="violet"
            />
            <DashboardMetric label="Докази" value={data.reports.length} accent="lime" />
            <DashboardMetric label="Відзнаки" value={data.unlocked.length} accent="coral" />
          </div>
          <section className="surface reference-toolbar">
            <ListControls
              pathname={`/admin/students/${data.profile.id}`}
              search={query.search}
              pageSize={pageSize}
              placeholder="Активність, доказ або відзнака"
            />
          </section>
          <div className="dashboard-columns">
            <section className="surface">
              <h2>Маршрут</h2>
              <div className="row-list">
                {routePage.items.map((item) => (
                  <article className="queue-row" key={item.id}>
                    <div>
                      <b>{item.activity.title}</b>
                      <small>
                        {formatDateOnly(item.activity.startAt)} · {item.activity.category.name}
                      </small>
                      <p>{item.motivation}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </article>
                ))}
              </div>
              <Pagination
                page={routePage.page}
                pageCount={routePage.pageCount}
                total={routePage.total}
                pathname={`/admin/students/${data.profile.id}`}
                query={baseQuery}
                pageParam="routePage"
              />
            </section>
            <section className="surface">
              <h2>Докази</h2>
              <div className="row-list">
                {reportPage.items.map((report) => {
                  const activity = data.database.activities.find(
                    (item) => item.id === report.activityId,
                  );
                  return (
                    <article className="queue-row" key={report.id}>
                      <div>
                        <b>{activity?.title}</b>
                        <small>
                          {report.hoursSpent} год · {report.skillsGained}
                        </small>
                        <p>{report.reflection || 'Чернетка доказу'}</p>
                        {report.evidenceUrl && (
                          <a href={report.evidenceUrl} target="_blank" rel="noreferrer">
                            Відкрити файл доказу
                          </a>
                        )}
                      </div>
                      <StatusBadge status={report.status} />
                    </article>
                  );
                })}
              </div>
              <Pagination
                page={reportPage.page}
                pageCount={reportPage.pageCount}
                total={reportPage.total}
                pathname={`/admin/students/${data.profile.id}`}
                query={baseQuery}
                pageParam="reportPage"
              />
            </section>
          </div>
          <section className="surface student-badge-admin">
            <div className="surface-head">
              <h2>Відзнаки студента</h2>
              <span>{data.unlocked.length} видано</span>
            </div>
            <div className="badge-admin-grid">
              {badgePage.items.map((badge) => {
                const unlocked = data.unlocked.find((item) => item.badgeId === badge.id);
                return (
                  <div className="badge-admin-row" key={badge.id}>
                    <BadgeCard
                      badge={badge}
                      unlockedAt={unlocked?.unlockedAt}
                      progress={unlocked ? 100 : 0}
                      imageUrl={badgeImage(badge.imageKey)}
                    />
                    <StudentBadgeToggle
                      studentId={data.profile.id}
                      badgeId={badge.id}
                      studentBadgeId={unlocked?.id}
                    />
                  </div>
                );
              })}
            </div>
            <Pagination
              page={badgePage.page}
              pageCount={badgePage.pageCount}
              total={badgePage.total}
              pathname={`/admin/students/${data.profile.id}`}
              query={baseQuery}
              pageParam="badgePage"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
