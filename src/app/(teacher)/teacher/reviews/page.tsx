import Link from 'next/link';
import { requireUser } from '@/server/auth';
import { makePage, teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  AppSelect,
  EmptyState,
  ListControls,
  Pagination,
  StatusBadge,
} from '@/components/ui/primitives';
import { ReviewDialog } from '@/components/features/forms';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function TeacherReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['teacher']);
  const query = await searchParams;
  const { reports } = await teacherQueue(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const selectedStatus = query.status ?? 'submitted';
  let items = reports;
  if (selectedStatus !== 'all') items = items.filter((item) => item.status === selectedStatus);
  if (needle)
    items = items.filter((item) =>
      `${item.student.fullName} ${item.student.email} ${item.application.activity.title} ${item.reflection} ${item.skillsGained}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
    );
  const result = makePage(items, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: selectedStatus, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Менторський фідбек</p>
          <h1>Докази на перевірці</h1>
        </div>
      </div>
      <div className="workspace">
        <WorkspaceNav role="teacher" active="/teacher/reviews" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/teacher/reviews"
              search={query.search}
              pageSize={pageSize}
              placeholder="Студент, активність або навичка"
            >
              <AppSelect name="status" defaultValue={selectedStatus}>
                <option value="submitted">На перевірці</option>
                <option value="all">Усі докази</option>
                <option value="approved">Прийнято</option>
                <option value="needs_changes">Потребує змін</option>
                <option value="rejected">Відхилено</option>
                <option value="draft">Чернетка</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? (
              <div className="row-list">
                {result.items.map((item) => (
                  <article className="data-row" key={item.id}>
                    <div>
                      <b>{item.student.fullName}</b>
                      <small>
                        {item.application.activity.title} · {item.reflection}
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                    <small>
                      {item.hoursSpent} год · {item.skillsGained}
                    </small>
                    <div className="data-row-actions">
                      <Link
                        href={`/teacher/students/${item.studentId}`}
                        className="button button-ghost"
                      >
                        Профіль
                      </Link>
                      {item.evidenceUrl && (
                        <a
                          className="button button-ghost"
                          href={item.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Файл
                        </a>
                      )}
                      <ReviewDialog
                        kind="report"
                        id={item.id}
                        title={`Доказ: ${item.student.fullName}`}
                        evidenceUrl={item.evidenceUrl}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Доказів не знайдено" body="Змініть пошук або стан перевірки." />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/teacher/reviews"
              query={listQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
