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
import { formatDateOnly } from '@/lib/formatters';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function TeacherParticipationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['teacher']);
  const query = await searchParams;
  const { applications, reports } = await teacherQueue(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const selectedStatus = query.status ?? '';
  const evidenceByApplication = new Map<string, string[]>();

  for (const report of reports) {
    if (!report.evidenceUrl) continue;
    const urls = evidenceByApplication.get(report.applicationId) ?? [];
    if (!urls.includes(report.evidenceUrl)) urls.push(report.evidenceUrl);
    evidenceByApplication.set(report.applicationId, urls);
  }

  let items = applications;

  if (selectedStatus) items = items.filter((item) => item.status === selectedStatus);
  if (needle) {
    items = items.filter((item) =>
      `${item.student.fullName} ${item.student.email} ${item.activity.title} ${item.activity.category.name} ${item.motivation} ${item.teacherComment ?? ''} ${(evidenceByApplication.get(item.id) ?? []).join(' ')}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle),
    );
  }

  const result = makePage(items, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: selectedStatus, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Менторський супровід</p>
          <h1>Студентські участі</h1>
        </div>
        <p>Участі студентів у можливостях, де ви призначені ментором.</p>
      </div>
      <div className="workspace">
        <WorkspaceNav role="teacher" active="/teacher/participations" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/teacher/participations"
              search={query.search}
              pageSize={pageSize}
              placeholder="Студент, можливість або мотивація"
            >
              <AppSelect name="status" defaultValue={selectedStatus}>
                <option value="">Усі стани</option>
                <option value="submitted">У плані</option>
                <option value="under_review">Менторський слот</option>
                <option value="approved">Заплановано</option>
                <option value="attended">Підтверджено</option>
                <option value="rejected">Відкладено</option>
                <option value="cancelled">Прибрано</option>
                <option value="missed">Пропущено</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? (
              <div className="row-list">
                {result.items.map((item) => {
                  const evidenceUrls = evidenceByApplication.get(item.id) ?? [];

                  return (
                    <article className="data-row route-data-row" key={item.id}>
                      <div>
                        <b>{item.student.fullName}</b>
                        <small>
                          {item.activity.title} · {item.activity.category.name} ·{' '}
                          {formatDateOnly(item.createdAt)}
                        </small>
                        <p>{item.motivation}</p>
                      </div>
                      <StatusBadge status={item.status} />
                      <small>{item.teacherComment || 'Фідбек ще не додано'}</small>
                      <div className="data-row-actions">
                        <Link
                          href={`/teacher/students/${item.studentId}`}
                          className="button button-ghost"
                        >
                          Профіль
                        </Link>
                        {evidenceUrls.map((url, index) => (
                          <a
                            className="button button-ghost"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            key={url}
                          >
                            {evidenceUrls.length > 1 ? `Файл ${index + 1}` : 'Файл доказу'}
                          </a>
                        ))}
                        <ReviewDialog
                          kind="application"
                          id={item.id}
                          title={`Участь: ${item.student.fullName}`}
                          evidenceUrls={evidenceUrls}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Участей не знайдено" body="Змініть пошук або стан участі." />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/teacher/participations"
              query={listQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
