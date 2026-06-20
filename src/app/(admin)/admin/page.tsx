import { requireUser } from '@/server/auth';
import { adminData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { DashboardMetric, StatusBadge } from '@/components/ui/primitives';
export default async function AdminDashboard() {
  await requireUser(['admin']);
  const { database, activities, students, teachers } = await adminData();
  const pendingReports = database.reports.filter((item) => item.status === 'submitted');
  const activeRoutes = database.applications.filter((item) =>
    ['approved', 'attended', 'submitted', 'under_review'].includes(item.status),
  );
  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Адміністративна панель</p>
          <h1>Керування маршрутами.</h1>
        </div>
        <p>Огляд студентів, маршрутів, доказів і менторів.</p>
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin" />
        <div className="workspace-main">
          <div className="dashboard-grid">
            <DashboardMetric label="Студенти" value={students.length} accent="aqua" />
            <DashboardMetric label="Ментори" value={teachers.length} accent="violet" />
            <DashboardMetric
              label="Можливості"
              value={activities.filter((item) => item.status === 'published').length}
              accent="lime"
            />
            <DashboardMetric label="Докази в черзі" value={pendingReports.length} accent="coral" />
          </div>
          <div className="dashboard-columns">
            <section className="surface">
              <div className="surface-head">
                <h2>Останні маршрути</h2>
                <a href="/admin/applications">Усі маршрути</a>
              </div>
              {activeRoutes
                .slice(-5)
                .reverse()
                .map((item) => {
                  const student = students.find((x) => x.id === item.studentId);
                  const activity = activities.find((x) => x.id === item.activityId);
                  return (
                    <div className="queue-row" key={item.id}>
                      <div>
                        <b>{student?.fullName}</b>
                        <small>{activity?.title}</small>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })}
            </section>
            <section className="surface">
              <div className="surface-head">
                <h2>Докази до перегляду</h2>
                <a href="/admin/reports">Усі докази</a>
              </div>
              {pendingReports.slice(0, 5).map((report) => {
                const student = students.find((x) => x.id === report.studentId);
                const activity = activities.find((x) => x.id === report.activityId);
                return (
                  <div className="queue-row" key={report.id}>
                    <div>
                      <b>{student?.fullName}</b>
                      <small>
                        {activity?.title} · {report.hoursSpent} год
                      </small>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
