import { requireUser } from '@/server/auth';
import { adminData, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { EmptyState, ListControls, Pagination, StatusBadge } from '@/components/ui/primitives';
import { AdminCreateDialog, AdminCrudActions, ToggleUserButton } from '@/components/features/forms';

type Search = { search?: string; page?: string; pageSize?: string };

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireUser(['admin']);
  const query = await searchParams;
  const { teachers, activities } = await adminData();
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const filtered = teachers.filter(
    (teacher) =>
      !needle || `${teacher.fullName} ${teacher.email}`.toLocaleLowerCase('uk-UA').includes(needle),
  );
  const result = makePage(filtered, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Адміністративний контур</p>
          <h1>Ментори</h1>
        </div>
        <AdminCreateDialog kind="teacher" />
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/teachers" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/admin/teachers"
              search={query.search}
              pageSize={pageSize}
              placeholder="Ім’я або пошта"
            />
            {result.items.length ? (
              <div className="row-list">
                {result.items.map((teacher) => (
                  <article className="data-row" key={teacher.id}>
                    <div>
                      <b>{teacher.fullName}</b>
                      <small>
                        {teacher.email} ·{' '}
                        {activities.filter((activity) => activity.teacherId === teacher.id).length}{' '}
                        треків
                      </small>
                    </div>
                    <StatusBadge status={teacher.status} />
                    <small>Роль: ментор</small>
                    <div className="data-row-actions">
                      <ToggleUserButton profileId={teacher.id} status={teacher.status} />
                      <AdminCrudActions
                        entity="profile"
                        id={teacher.id}
                        title={teacher.fullName}
                        fields={[
                          { name: 'fullName', label: 'Повне ім’я', value: teacher.fullName },
                          { name: 'email', label: 'Пошта', type: 'email', value: teacher.email },
                          { name: 'password', label: 'Новий пароль', type: 'password' },
                        ]}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Менторів не знайдено" body="Змініть пошуковий запит." />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/admin/teachers"
              query={listQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
