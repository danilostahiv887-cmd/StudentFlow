import { notFound } from 'next/navigation';
import { requireUser } from '@/server/auth';
import { studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { StudentBadgeToggle } from '@/components/features/forms';
import { BadgeCard, DashboardMetric, StatusBadge } from '@/components/ui/primitives';
import { formatDateOnly } from '@/lib/formatters';

export default async function AdminStudentRoutePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(['admin']);
  const { id } = await params;
  const data = await studentData(id);
  if (!data.profile || data.profile.role !== 'student') notFound();
  const group = data.database.groups.find((item) => item.id === data.profile.groupId);
  const speciality = data.database.specialities.find((item) => item.id === data.profile.specialityId);
  const badgeImage = (imageKey: number) => data.database.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === imageKey)?.url;

  return (
    <div className="page">
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/students" />
        <div className="workspace-main">
          <div className="page-intro">
            <div><p className="eyebrow">Маршрут студента</p><h1>{data.profile.fullName}</h1></div>
            <p>{data.profile.email} · {group?.name ?? 'Групу не вибрано'} · {speciality?.name ?? 'Спеціальність не вибрано'}</p>
          </div>
          <div className="dashboard-grid">
            <DashboardMetric label="Бали" value={data.profile.pointsTotal} accent="aqua" />
            <DashboardMetric label="Кроки маршруту" value={data.applications.length} accent="violet" />
            <DashboardMetric label="Докази" value={data.reports.length} accent="lime" />
            <DashboardMetric label="Відзнаки" value={data.unlocked.length} accent="coral" />
          </div>
          <div className="dashboard-columns">
            <section className="surface">
              <h2>Маршрут</h2>
              <div className="row-list">{data.applications.map((item) => <article className="queue-row" key={item.id}><div><b>{item.activity.title}</b><small>{formatDateOnly(item.activity.startAt)} · {item.activity.category.name}</small><p>{item.motivation}</p></div><StatusBadge status={item.status} /></article>)}</div>
            </section>
            <section className="surface">
              <h2>Докази</h2>
              <div className="row-list">{data.reports.map((report) => { const activity = data.database.activities.find((item) => item.id === report.activityId); return <article className="queue-row" key={report.id}><div><b>{activity?.title}</b><small>{report.hoursSpent} год · {report.skillsGained}</small><p>{report.reflection || 'Чернетка доказу'}</p>{report.evidenceUrl && <a href={report.evidenceUrl} target="_blank" rel="noreferrer">Відкрити файл доказу</a>}</div><StatusBadge status={report.status} /></article>; })}</div>
            </section>
          </div>
          <section className="surface student-badge-admin">
            <div className="surface-head"><h2>Відзнаки студента</h2><span>{data.unlocked.length} видано</span></div>
            <div className="badge-admin-grid">
              {data.database.badges.map((badge) => {
                const unlocked = data.unlocked.find((item) => item.badgeId === badge.id);
                return (
                  <div className="badge-admin-row" key={badge.id}>
                    <BadgeCard badge={badge} unlockedAt={unlocked?.unlockedAt} progress={unlocked ? 100 : 0} imageUrl={badgeImage(badge.imageKey)} />
                    <StudentBadgeToggle studentId={data.profile.id} badgeId={badge.id} studentBadgeId={unlocked?.id} />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
