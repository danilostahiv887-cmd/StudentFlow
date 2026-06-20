import { requireUser } from '@/server/auth';
import { makePage, teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  ActivityCard,
  AppSelect,
  EmptyState,
  ListControls,
  Pagination,
} from '@/components/ui/primitives';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function TeacherActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['teacher']);
  const query = await searchParams;
  const { activities } = await teacherQueue(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let filtered = activities.filter(
    (activity) =>
      !needle ||
      `${activity.title} ${activity.shortDescription} ${activity.description} ${activity.category.name}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
  );
  if (query.status) filtered = filtered.filter((activity) => activity.status === query.status);
  const result = makePage(filtered, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: query.status, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Менторський простір</p>
          <h1>Призначені можливості</h1>
        </div>
        <p>Це активності, де адміністратор призначив вас ментором.</p>
      </div>
      <div className="workspace">
        <WorkspaceNav role="teacher" active="/teacher/activities" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/teacher/activities"
              search={query.search}
              pageSize={pageSize}
              placeholder="Назва, компетентність або опис"
            >
              <AppSelect name="status" defaultValue={query.status ?? ''}>
                <option value="">Усі стани</option>
                <option value="published">Опубліковано</option>
                <option value="draft">Чернетка</option>
                <option value="paused">Пауза</option>
                <option value="completed">Завершено</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? (
              <div className="activity-grid">
                {result.items.map((activity) => (
                  <ActivityCard activity={activity} key={activity.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Призначених можливостей не знайдено"
                body="Змініть пошук або стан."
              />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/teacher/activities"
              query={listQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
