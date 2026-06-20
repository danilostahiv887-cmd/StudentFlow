import { requireUser } from '@/server/auth';
import { adminData, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { ActivityCard, EmptyState, ListControls, Pagination, AppSelect } from '@/components/ui/primitives';
import { AdminCreateDialog, AdminCrudActions } from '@/components/features/forms';

type Search = { search?: string; category?: string; status?: string; page?: string; pageSize?: string };

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser(['admin']);
  const query = await searchParams;
  const { database, activities, teachers } = await adminData();
  const categoryOptions = database.categories.map((item) => ({ value: item.id, label: item.name }));
  const clubOptions = database.clubs.map((item) => ({ value: item.id, label: item.name }));
  const teacherOptions = teachers.map((item) => ({ value: item.id, label: item.fullName }));
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let filtered = activities.filter((activity) => !needle || `${activity.title} ${activity.shortDescription} ${activity.category.name} ${activity.club.name} ${activity.teacher.fullName}`.toLocaleLowerCase('uk-UA').includes(needle));
  if (query.category) filtered = filtered.filter((activity) => activity.categoryId === query.category);
  if (query.status) filtered = filtered.filter((activity) => activity.status === query.status);
  const result = makePage(filtered, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, category: query.category, status: query.status, pageSize: query.pageSize };
  return (
    <div className="page">
      <div className="page-intro">
        <div><p className="eyebrow">Адміністративний контур</p><h1>Можливості</h1></div>
        <AdminCreateDialog kind="activity" teachers={teachers} categories={database.categories} clubs={database.clubs} />
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/activities" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls pathname="/admin/activities" search={query.search} pageSize={pageSize} placeholder="Назва, трек, ментор">
              <AppSelect name="category" defaultValue={query.category ?? ''}>
                <option value="">Усі треки</option>
                {database.categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </AppSelect>
              <AppSelect name="status" defaultValue={query.status ?? ''}>
                <option value="">Усі стани</option>
                <option value="published">Опубліковано</option>
                <option value="draft">Чернетка</option>
                <option value="paused">Пауза</option>
                <option value="completed">Завершено</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? <div className="activity-grid">
              {result.items.map((activity) => (
                <div key={activity.id}>
                  <ActivityCard activity={activity} />
                  <AdminCrudActions
                    entity="activity"
                    id={activity.id}
                    title={activity.title}
                    fields={[
                      { name: 'image', label: 'Обкладинка', type: 'image', value: activity.imageUrl ?? '', alt: activity.title, help: 'Замініть або видаліть зображення можливості.' },
                      { name: 'title', label: 'Назва', value: activity.title },
                      { name: 'shortDescription', label: 'Короткий опис', type: 'textarea', value: activity.shortDescription },
                      { name: 'description', label: 'Повний опис', type: 'textarea', value: activity.description },
                      { name: 'categoryId', label: 'Трек', type: 'select', value: activity.categoryId, options: categoryOptions },
                      { name: 'clubId', label: 'Майданчик', type: 'select', value: activity.clubId, options: clubOptions },
                      { name: 'teacherId', label: 'Ментор', type: 'select', value: activity.teacherId, options: teacherOptions },
                      { name: 'points', label: 'Бали', type: 'number', value: activity.points },
                      { name: 'maxParticipants', label: 'Місткість', type: 'number', value: activity.maxParticipants },
                    ]}
                  />
                </div>
              ))}
            </div> : <EmptyState title="Можливостей не знайдено" body="Змініть пошук, трек або стан." />}
            <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/admin/activities" query={listQuery} />
          </section>
        </div>
      </div>
    </div>
  );
}
