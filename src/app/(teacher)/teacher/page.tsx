import Link from 'next/link';
import { requireUser } from '@/server/auth';
import { teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { DashboardMetric, StatusBadge } from '@/components/ui/primitives';
import { formatDateOnly } from '@/lib/formatters';

export default async function TeacherDashboard() {
  const user = await requireUser(['teacher']);
  const { activities, applications, reports } = await teacherQueue(user.id);
  const pendingEvidence = reports.filter((item) => item.status === 'submitted');
  const mentoredStudents = new Set(applications.map((item) => item.studentId)).size;
  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Менторська панель</p>
          <h1>Менторська робота.</h1>
        </div>
      </div>
      <div className="workspace">
        <WorkspaceNav role="teacher" active="/teacher" />
        <div className="workspace-main">
          <div className="dashboard-grid">
            <DashboardMetric label="Докази в черзі" value={pendingEvidence.length} accent="coral" />
            <DashboardMetric label="Мої можливості" value={activities.length} accent="violet" />
            <DashboardMetric label="Студенти в участі" value={mentoredStudents} accent="aqua" />
            <DashboardMetric
              label="Прийнято доказів"
              value={reports.filter((item) => item.status === 'approved').length}
              accent="lime"
            />
          </div>
          <div className="dashboard-columns">
            <section className="surface">
              <div className="surface-head">
                <h2>Докази на фідбек</h2>
                <Link href="/teacher/reviews">Відкрити</Link>
              </div>
              {pendingEvidence.length ? (
                pendingEvidence.slice(0, 4).map((item) => (
                  <div className="queue-row" key={item.id}>
                    <div>
                      <b>{item.student.fullName}</b>
                      <small>
                        {item.application.activity.title} · {item.hoursSpent} год
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              ) : (
                <p>Нових доказів немає.</p>
              )}
            </section>
            <section className="surface">
              <div className="surface-head">
                <h2>Студентські участі</h2>
                <Link href="/teacher/activities">Мої можливості</Link>
              </div>
              {applications.length ? (
                applications.slice(0, 4).map((item) => (
                  <div className="queue-row" key={item.id}>
                    <div>
                      <b>{item.student.fullName}</b>
                      <small>
                        {item.activity.title} · {formatDateOnly(item.createdAt)}
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              ) : (
                <p>Студенти ще не додалися до ваших можливостей.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
