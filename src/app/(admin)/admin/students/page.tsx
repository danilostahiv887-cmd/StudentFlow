import Link from 'next/link';
import { requireUser } from '@/server/auth';
import { adminData, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { EmptyState, ListControls, Pagination, StatusBadge } from '@/components/ui/primitives';
import { AdminCrudActions, ToggleUserButton } from '@/components/features/forms';

type Search = { search?: string; page?: string; pageSize?: string };

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser(['admin']);
  const query = await searchParams;
  const { students, database } = await adminData();
  const pageSize = Number(query.pageSize ?? 6);
  const search = query.search?.trim().toLocaleLowerCase('uk-UA');
  const filtered = students.filter((student) => !search || `${student.fullName} ${student.email}`.toLocaleLowerCase('uk-UA').includes(search));
  const result = makePage(filtered, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, pageSize: query.pageSize };

  return <div className="page"><div className="page-intro"><div><p className="eyebrow">Адміністративний контур</p><h1>Студенти</h1></div><p>Керування студентськими профілями та перегляд маршрутів.</p></div><div className="workspace"><WorkspaceNav role="admin" active="/admin/students" /><div className="workspace-main"><section className="surface"><ListControls pathname="/admin/students" search={query.search} pageSize={pageSize} placeholder="Ім’я або пошта" />{result.items.length ? <div className="row-list">{result.items.map((student) => { const group = database.groups.find((item) => item.id === student.groupId)?.name || 'Не вибрано'; return <article className="data-row" key={student.id}><div><b>{student.fullName}</b><small>{student.email} · {group}</small></div><StatusBadge status={student.status} /><small>{student.pointsTotal} балів</small><div className="data-row-actions"><Link className="button button-secondary" href={`/admin/students/${student.id}`}>Маршрут</Link><ToggleUserButton profileId={student.id} status={student.status} /><AdminCrudActions entity="profile" id={student.id} title={student.fullName} fields={[{ name: 'fullName', label: 'Повне ім’я', value: student.fullName }, { name: 'email', label: 'Пошта', type: 'email', value: student.email }, { name: 'password', label: 'Новий пароль', type: 'password' }]} /></div></article>; })}</div> : <EmptyState title="Нічого не знайдено" body="Змініть пошуковий запит." />}<Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/admin/students" query={listQuery} /></section></div></div></div>;
}
