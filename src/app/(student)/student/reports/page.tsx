import { requireUser } from '@/server/auth';
import { makePage, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import {
  AppSelect,
  EmptyState,
  ListControls,
  Pagination,
  StatusBadge,
} from '@/components/ui/primitives';
import { ReportDialog } from '@/components/features/forms';

type Search = { search?: string; status?: string; page?: string; pageSize?: string };

export default async function StudentReportsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser(['student']);
  const query = await searchParams;
  const { applications, reports } = await studentData(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let available = applications.filter((item) => ['approved', 'attended'].includes(item.status));
  if (needle)
    available = available.filter((application) => {
      const report = reports.find((item) => item.applicationId === application.id);
      return `${application.activity.title} ${application.activity.category.name} ${application.activity.resultDescription} ${report?.skillsGained ?? ''} ${report?.teacherFeedback ?? ''}`
        .toLocaleLowerCase('uk-UA')
        .includes(needle);
    });
  if (query.status)
    available = available.filter((application) => {
      const report = reports.find((item) => item.applicationId === application.id);
      return query.status === 'missing' ? !report : report?.status === query.status;
    });
  const result = makePage(available, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, status: query.status, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Портфоліо</p>
          <h1>Докази результату</h1>
        </div>
      </div>
      <div className="workspace">
        <WorkspaceNav role="student" active="/student/reports" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls
              pathname="/student/reports"
              search={query.search}
              pageSize={pageSize}
              placeholder="Крок, навичка або фідбек"
            >
              <AppSelect name="status" defaultValue={query.status ?? ''}>
                <option value="">Усі докази</option>
                <option value="missing">Ще не додано</option>
                <option value="draft">Чернетка</option>
                <option value="submitted">На перевірці</option>
                <option value="approved">Прийнято</option>
                <option value="needs_changes">Потребує змін</option>
                <option value="rejected">Відхилено</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? (
              <div className="row-list">
                {result.items.map((application) => {
                  const report = reports.find((item) => item.applicationId === application.id);
                  return (
                    <article className="data-row" key={application.id}>
                      <div>
                        <b>{application.activity.title}</b>
                        <small>
                          {report?.teacherFeedback || application.activity.resultDescription}
                        </small>
                      </div>
                      {report ? (
                        <StatusBadge status={report.status} />
                      ) : (
                        <StatusBadge status="draft" />
                      )}
                      <small>
                        {report
                          ? `${report.hoursSpent} год · ${report.skillsGained || 'чернетка'}`
                          : 'доказ ще не додано'}
                      </small>
                      <div className="data-row-actions">
                        {report?.evidenceUrl && (
                          <a
                            className="button button-ghost"
                            href={report.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Відкрити файл
                          </a>
                        )}
                        {(!report || ['draft', 'needs_changes'].includes(report.status)) && (
                          <ReportDialog
                            applicationId={application.id}
                            title={application.activity.title}
                            initialEvidenceUrl={report?.evidenceUrl}
                          />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Немає кроків для доказів"
                body="Змініть фільтр або додайте можливість до маршруту."
              />
            )}
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pathname="/student/reports"
              query={listQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
