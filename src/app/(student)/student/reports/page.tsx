import { requireUser } from '@/server/auth';
import { studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { EmptyState, StatusBadge } from '@/components/ui/primitives';
import { ReportDialog } from '@/components/features/forms';

export default async function StudentReportsPage() {
  const user = await requireUser(['student']); const { applications, reports } = await studentData(user.id); const available = applications.filter((item) => ['approved','attended'].includes(item.status));
  return <div className="page"><div className="page-intro"><div><p className="eyebrow">Портфоліо</p><h1>Докази результату</h1></div></div><div className="workspace"><WorkspaceNav role="student" active="/student/reports" /><div className="workspace-main"><section className="surface"><div className="surface-head"><h2>Кроки, які можна підтвердити</h2></div>{available.length ? <div className="row-list">{available.map((application) => { const report = reports.find((item) => item.applicationId === application.id); return <article className="data-row" key={application.id}><div><b>{application.activity.title}</b><small>{report?.teacherFeedback || application.activity.resultDescription}</small></div>{report ? <StatusBadge status={report.status} /> : <StatusBadge status="draft" />}<small>{report ? `${report.hoursSpent} год · ${report.skillsGained || 'чернетка'}` : 'доказ ще не додано'}</small><div className="data-row-actions">{(!report || ['draft','needs_changes'].includes(report.status)) && <ReportDialog applicationId={application.id} title={application.activity.title} initialEvidenceUrl={report?.evidenceUrl} />}</div></article>; })}</div> : <EmptyState title="Немає кроків для доказів" body="Додайте можливість до маршруту, а потім зафіксуйте результат." />}</section></div></div></div>;
}
