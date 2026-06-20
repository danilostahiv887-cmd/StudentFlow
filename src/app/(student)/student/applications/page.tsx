import { requireUser } from '@/server/auth';
import { makePage, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  AppSelect,
  EmptyState,
  ListControls,
  Pagination,
  SkillBars,
  StatusBadge,
} from '@/components/ui/primitives';
import { CancelApplication } from '@/components/features/forms';
import { formatDateOnly } from '@/lib/formatters';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function StudentApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['student']);
  const query = await searchParams;
  const { applications } = await studentData(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const search = query.search?.trim().toLocaleLowerCase('uk-UA');
  let items = applications.filter(
    (item) =>
      !search ||
      `${item.activity.title} ${item.activity.category.name} ${item.activity.skills.join(' ')}`
        .toLocaleLowerCase('uk-UA')
        .includes(search),
  );
  if (query.status) items = items.filter((item) => item.status === query.status);
  const result = makePage(items, Number(query.page ?? 1), pageSize);
  const filters = { search: query.search, status: query.status, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Студентський маршрут</p>
          <h1>Мої кроки</h1>
        </div>
      </div>
      <div className="workspace">
        <WorkspaceNav role="student" active="/student/applications" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/student/applications"
              search={query.search}
              pageSize={pageSize}
              placeholder="Крок, напрям або навичка"
            >
              <AppSelect name="status" defaultValue={query.status ?? ''}>
                <option value="">Усі стани</option>
                <option value="submitted">Подано</option>
                <option value="under_review">На розгляді</option>
                <option value="approved">Заплановано</option>
                <option value="attended">Підтверджено</option>
                <option value="cancelled">Прибрано</option>
                <option value="rejected">Відкладено</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? (
              <div className="row-list route-list">
                {result.items.map((item, index) => (
                  <article className="data-row route-data-row" key={item.id}>
                    <div>
                      <b>
                        {(result.page - 1) * result.pageSize + index + 1}. {item.activity.title}
                      </b>
                      <small>
                        {item.activity.category.name} · {formatDateOnly(item.activity.startAt)}
                      </small>
                      <SkillBars skills={item.activity.skills} compact />
                    </div>
                    <StatusBadge status={item.status} />
                    <small>{item.motivation}</small>
                    <div className="data-row-actions">
                      {['submitted', 'under_review', 'approved'].includes(item.status) && (
                        <CancelApplication applicationId={item.id} />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Маршрут порожній"
                body="Відкрийте навігатор і додайте крок, який підсилить портфоліо."
              />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/student/applications"
              query={filters}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
