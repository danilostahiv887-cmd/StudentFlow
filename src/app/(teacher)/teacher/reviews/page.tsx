import Link from 'next/link';
import { requireUser } from '@/server/auth';
import { teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { EmptyState, StatusBadge } from '@/components/ui/primitives';
import { ReviewDialog } from '@/components/features/forms';

export default async function TeacherReviewsPage() {
  const user = await requireUser(['teacher']); const { reports } = await teacherQueue(user.id); const queueReports = reports.filter((item) => item.status === 'submitted');
  return <div className="page"><div className="page-intro"><div><p className="eyebrow">Менторський фідбек</p><h1>Докази на перевірці</h1></div></div><div className="workspace"><WorkspaceNav role="teacher" active="/teacher/reviews" /><div className="workspace-main"><section className="surface"><div className="surface-head"><h2>Очікують фідбек</h2><span>{queueReports.length}</span></div>{queueReports.length ? <div className="row-list">{queueReports.map((item) => <article className="data-row" key={item.id}><div><b>{item.student.fullName}</b><small>{item.application.activity.title} · {item.reflection}</small></div><StatusBadge status={item.status} /><small>{item.hoursSpent} год · {item.skillsGained}</small><div className="data-row-actions"><Link href={`/teacher/students/${item.studentId}`} className="button button-ghost">Профіль</Link><ReviewDialog kind="report" id={item.id} title={`Доказ: ${item.student.fullName}`} /></div></article>)}</div> : <EmptyState title="Черга доказів порожня" body="Нові докази студентів будуть показані тут." />}</section></div></div></div>;
}
