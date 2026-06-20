import { requireUser } from '@/server/auth';
import { getDb, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { AppSelect, EmptyState, ListControls, Pagination, StatusBadge } from '@/components/ui/primitives';
import { ReviewDialog } from '@/components/features/forms';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser(['admin']);
  const db = await getDb();
  const query = await searchParams;
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let reports = db.reports;
  if (needle) reports = reports.filter((report) => {
    const student = db.profiles.find((item) => item.id === report.studentId);
    const activity = db.activities.find((item) => item.id === report.activityId);
    return `${student?.fullName ?? ''} ${student?.email ?? ''} ${activity?.title ?? ''} ${report.reflection} ${report.skillsGained} ${report.teacherFeedback ?? ''}`.toLocaleLowerCase('uk-UA').includes(needle);
  });
  if (query.status) reports = reports.filter((report) => report.status === query.status);
  const result = makePage(reports, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: query.status, pageSize: query.pageSize };

  return <div className="page"><div className="page-intro"><div><p className="eyebrow">Адміністративний контур</p><h1>Докази</h1></div><p>Перегляд артефактів, рефлексій і менторського фідбеку.</p></div><div className="workspace"><WorkspaceNav role="admin" active="/admin/reports" /><section className="workspace-main surface"><ListControls pathname="/admin/reports" search={query.search} pageSize={pageSize} placeholder="Студент, активність або навичка"><AppSelect name="status" defaultValue={query.status ?? ''}><option value="">Усі стани</option><option value="draft">Чернетка</option><option value="submitted">На перевірці</option><option value="approved">Прийнято</option><option value="needs_changes">Потребує змін</option><option value="rejected">Відхилено</option></AppSelect></ListControls>{result.items.length ? <div className="row-list">{result.items.map((report) => { const student = db.profiles.find((x) => x.id === report.studentId); const activity = db.activities.find((x) => x.id === report.activityId); return <article className="data-row route-data-row" key={report.id}><div><b>{student?.fullName}</b><small>{activity?.title} · {report.hoursSpent} год</small><p>{report.reflection || 'Чернетка доказу'}</p>{report.evidenceUrl && <a href={report.evidenceUrl} target="_blank" rel="noreferrer">Відкрити файл доказу</a>}</div><StatusBadge status={report.status} /><small>{report.teacherFeedback || report.skillsGained}</small><ReviewDialog kind="report" id={report.id} title={`Доказ: ${student?.fullName ?? ''}`} /></article>; })}</div> : <EmptyState title="Доказів не знайдено" body="Змініть пошук або стан доказу." />}<Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/admin/reports" query={listQuery} /></section></div></div>;
}
