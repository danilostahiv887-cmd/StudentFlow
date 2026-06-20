import { requireUser } from '@/server/auth';
import { getDb, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { AppSelect, BadgeCard, EmptyState, ListControls, Pagination } from '@/components/ui/primitives';
import { AdminCreateDialog, AdminCrudActions } from '@/components/features/forms';

type Search = { search?: string; state?: string; page?: string; pageSize?: string };

export default async function AdminBadgesPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser(['admin']);
  const query = await searchParams;
  const db = await getDb();
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  let badges = db.badges.filter((badge) => !needle || `${badge.title} ${badge.description}`.toLocaleLowerCase('uk-UA').includes(needle));
  if (query.state === 'active') badges = badges.filter((badge) => badge.isActive);
  if (query.state === 'inactive') badges = badges.filter((badge) => !badge.isActive);
  const result = makePage(badges, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, state: query.state, pageSize: query.pageSize };
  return (
    <div className="page">
      <div className="page-intro">
        <div><p className="eyebrow">Адміністративний контур</p><h1>Відзнаки</h1></div>
        <AdminCreateDialog kind="reference" />
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/badges" />
        <div className="workspace-main">
          <section className="surface">
            <ListControls pathname="/admin/badges" search={query.search} pageSize={pageSize} placeholder="Назва або умова">
              <AppSelect name="state" defaultValue={query.state ?? ''}>
                <option value="">Усі відзнаки</option>
                <option value="active">Активні</option>
                <option value="inactive">Неактивні</option>
              </AppSelect>
            </ListControls>
            {result.items.length ? <div className="badge-grid">
              {result.items.map((badge) => {
                const media = db.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === badge.imageKey);
                return (
                  <div key={badge.id}>
                    <BadgeCard badge={badge} progress={30} imageUrl={media?.url} />
                    <AdminCrudActions
                      entity="badge"
                      id={badge.id}
                      title={badge.title}
                      fields={[
                        { name: 'image', label: 'Зображення відзнаки', type: 'image', value: media?.url ?? '', alt: badge.title, help: 'Зображення буде показане на картці відзнаки.' },
                        { name: 'title', label: 'Назва', value: badge.title },
                        { name: 'description', label: 'Опис', type: 'textarea', value: badge.description },
                        { name: 'conditionValue', label: 'Поріг', type: 'number', value: badge.conditionValue },
                      ]}
                    />
                  </div>
                );
              })}
            </div> : <EmptyState title="Відзнак не знайдено" body="Змініть пошук або стан." />}
            <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/admin/badges" query={listQuery} />
          </section>
        </div>
      </div>
    </div>
  );
}
