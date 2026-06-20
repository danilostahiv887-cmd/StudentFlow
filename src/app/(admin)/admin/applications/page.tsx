import { requireUser } from '@/server/auth';
import { enrichApplication, getDb, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  AppSelect,
  EmptyState,
  ListControls,
  Pagination,
  StatusBadge,
} from '@/components/ui/primitives';
import { ReviewDialog } from '@/components/features/forms';

type Search = { search?: string; page?: string; pageSize?: string; status?: string };

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireUser(['admin']);
  const db = await getDb();
  const query = await searchParams;
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let items = db.applications.map((item) => enrichApplication(db, item));
  if (needle)
    items = items.filter((item) =>
      `${item.student.fullName} ${item.student.email} ${item.activity.title} ${item.activity.category.name} ${item.motivation} ${item.teacherComment ?? ''}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
    );
  if (query.status) items = items.filter((item) => item.status === query.status);
  const result = makePage(items, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: query.status, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Адміністративний контур</p>
          <h1>Маршрути студентів</h1>
        </div>
        <p>Огляд заявок, мотивації та стану кожного маршруту.</p>
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/applications" />
        <section className="workspace-main surface">
          <ListControls
            pathname="/admin/applications"
            search={query.search}
            pageSize={pageSize}
            placeholder="Студент, активність або мотивація"
          >
            <AppSelect name="status" defaultValue={query.status ?? ''}>
              <option value="">Усі стани</option>
              <option value="submitted">Подано</option>
              <option value="under_review">На розгляді</option>
              <option value="approved">Заплановано</option>
              <option value="attended">Підтверджено</option>
              <option value="rejected">Відхилено</option>
              <option value="cancelled">Прибрано</option>
            </AppSelect>
          </ListControls>
          {result.items.length ? (
            <div className="row-list">
              {result.items.map((item) => (
                <article className="data-row route-data-row" key={item.id}>
                  <div>
                    <b>{item.student.fullName}</b>
                    <small>
                      {item.activity.title} · {item.activity.category.name}
                    </small>
                    <p>{item.motivation}</p>
                  </div>
                  <StatusBadge status={item.status} />
                  <small>{item.teacherComment || 'Без коментаря'}</small>
                  <ReviewDialog
                    kind="application"
                    id={item.id}
                    title={`Маршрут: ${item.student.fullName}`}
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Маршрутів не знайдено" body="Змініть пошук або стан заявки." />
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pathname="/admin/applications"
            query={listQuery}
          />
        </section>
      </div>
    </div>
  );
}
