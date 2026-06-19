import { requireUser } from '@/server/auth';
import { makePage, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { EmptyState, Pagination, SearchBox, SkillBars, StatusBadge } from '@/components/ui/primitives';
import { CancelApplication } from '@/components/features/forms';
import { formatDateOnly } from '@/lib/formatters';

type Search = { search?: string; status?: string; page?: string };

export default async function StudentApplicationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser(['student']); const query = await searchParams; const { applications } = await studentData(user.id);
  const search = query.search?.toLocaleLowerCase(); let items = applications.filter((item) => !search || `${item.activity.title} ${item.activity.category.name} ${item.activity.skills.join(' ')}`.toLocaleLowerCase().includes(search));
  if (query.status) items = items.filter((item) => item.status === query.status);
  const result = makePage(items, Number(query.page ?? 1)); const filters = Object.fromEntries(Object.entries({ search: query.search, status: query.status }).filter(([, value]) => Boolean(value)) as [string, string][]);
  return <div className="page"><div className="page-intro"><div><p className="eyebrow">Студентський маршрут</p><h1>Мої кроки</h1></div></div><div className="workspace"><WorkspaceNav role="student" active="/student/applications" /><div className="workspace-main"><section className="surface"><form className="catalog-toolbar" action="/student/applications"><SearchBox defaultValue={query.search} placeholder="Крок, трек або навичка" /><select className="field" style={{ width: 180 }} name="status" defaultValue={query.status}><option value="">Усі стани</option><option value="approved">Заплановано</option><option value="attended">Підтверджено</option><option value="cancelled">Прибрано</option><option value="rejected">Відкладено</option></select><button className="button button-secondary" type="submit">Фільтрувати</button></form>{result.items.length ? <div className="row-list route-list">{result.items.map((item, index) => <article className="data-row route-data-row" key={item.id}><div><b>{index + 1}. {item.activity.title}</b><small>{item.activity.category.name} · {formatDateOnly(item.activity.startAt)}</small><SkillBars skills={item.activity.skills} compact /></div><StatusBadge status={item.status} /><small>{item.motivation}</small><div className="data-row-actions">{['submitted','under_review','approved'].includes(item.status) && <CancelApplication applicationId={item.id} />}</div></article>)}</div> : <EmptyState title="Маршрут порожній" body="Відкрийте навігатор і додайте крок, який підсилить портфоліо." /> }<Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/student/applications" query={filters} /></section></div></div></div>;
}
