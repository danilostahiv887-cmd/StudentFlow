import { requireUser } from '@/server/auth';
import { getDb, makePage } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { ListControls, Pagination } from '@/components/ui/primitives';
import { AdminCreateDialog, AdminCrudActions } from '@/components/features/forms';

type Search = {
  search?: string;
  pageSize?: string;
  groupsPage?: string;
  specialitiesPage?: string;
  clubsPage?: string;
  categoriesPage?: string;
};

export default async function AdminReferencePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireUser(['admin']);
  const query = await searchParams;
  const db = await getDb();
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const contains = (...parts: Array<string | number | undefined>) =>
    !needle || parts.join(' ').toLocaleLowerCase('uk-UA').includes(needle);
  const mediaFor = (kind: 'club' | 'visual' | 'badge', imageKey: number) =>
    db.mediaAssets.find((item) => item.kind === kind && item.imageKey === imageKey);

  const groups = makePage(
    db.groups.filter((item) => contains(item.name, item.startYear, item.endYear)),
    Number(query.groupsPage ?? 1),
    pageSize,
  );
  const specialities = makePage(
    db.specialities.filter((item) => contains(item.code, item.name, item.description)),
    Number(query.specialitiesPage ?? 1),
    pageSize,
  );
  const clubs = makePage(
    db.clubs.filter((item) => contains(item.name, item.description)),
    Number(query.clubsPage ?? 1),
    pageSize,
  );
  const categories = makePage(
    db.categories.filter((item) => contains(item.name, item.slug, item.color)),
    Number(query.categoriesPage ?? 1),
    pageSize,
  );
  const baseQuery = { search: query.search, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Адміністративний контур</p>
          <h1>Довідники</h1>
        </div>
        <AdminCreateDialog kind="reference" />
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/reference" />
        <div className="workspace-main">
          <section className="surface reference-toolbar">
            <ListControls
              pathname="/admin/reference"
              search={query.search}
              pageSize={pageSize}
              placeholder="Група, спеціальність, напрям або майданчик"
            />
          </section>
          <div className="dashboard-columns">
            <section className="surface">
              <h2>Академічні групи</h2>
              <div className="row-list">
                {groups.items.map((item) => (
                  <div className="queue-row" key={item.id}>
                    <div>
                      <b>{item.name}</b>
                      <small>
                        {item.startYear}-{item.endYear}
                      </small>
                    </div>
                    <AdminCrudActions
                      entity="group"
                      id={item.id}
                      title={item.name}
                      fields={[
                        { name: 'name', label: 'Назва', value: item.name },
                        {
                          name: 'startYear',
                          label: 'Рік початку',
                          type: 'number',
                          value: item.startYear,
                        },
                        {
                          name: 'endYear',
                          label: 'Рік завершення',
                          type: 'number',
                          value: item.endYear,
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>
              <Pagination
                page={groups.page}
                pageCount={groups.pageCount}
                total={groups.total}
                pathname="/admin/reference"
                query={baseQuery}
                pageParam="groupsPage"
              />
            </section>
            <section className="surface">
              <h2>Спеціальності</h2>
              <div className="row-list">
                {specialities.items.map((item) => (
                  <div className="queue-row" key={item.id}>
                    <div>
                      <b>
                        {item.code} · {item.name}
                      </b>
                      <small>{item.description}</small>
                    </div>
                    <AdminCrudActions
                      entity="speciality"
                      id={item.id}
                      title={item.name}
                      fields={[
                        { name: 'code', label: 'Код', value: item.code },
                        { name: 'name', label: 'Назва', value: item.name },
                        {
                          name: 'description',
                          label: 'Опис',
                          type: 'textarea',
                          value: item.description,
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>
              <Pagination
                page={specialities.page}
                pageCount={specialities.pageCount}
                total={specialities.total}
                pathname="/admin/reference"
                query={baseQuery}
                pageParam="specialitiesPage"
              />
            </section>
            <section className="surface">
              <h2>Майданчики</h2>
              <div className="row-list">
                {clubs.items.map((item) => {
                  const media = mediaFor('club', item.imageKey);
                  return (
                    <div className="queue-row" key={item.id}>
                      <div>
                        <b>{item.name}</b>
                        <small>{item.description}</small>
                      </div>
                      <AdminCrudActions
                        entity="club"
                        id={item.id}
                        title={item.name}
                        fields={[
                          {
                            name: 'image',
                            label: 'Зображення майданчика',
                            type: 'image',
                            value: media?.url ?? '',
                            alt: item.name,
                          },
                          { name: 'name', label: 'Назва', value: item.name },
                          {
                            name: 'description',
                            label: 'Опис',
                            type: 'textarea',
                            value: item.description,
                          },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
              <Pagination
                page={clubs.page}
                pageCount={clubs.pageCount}
                total={clubs.total}
                pathname="/admin/reference"
                query={baseQuery}
                pageParam="clubsPage"
              />
            </section>
            <section className="surface">
              <h2>Напрями</h2>
              <div className="row-list">
                {categories.items.map((item) => {
                  const media = mediaFor('visual', item.imageKey);
                  return (
                    <div className="queue-row" key={item.id}>
                      <div>
                        <b>{item.name}</b>
                        <small>{item.color}</small>
                      </div>
                      <AdminCrudActions
                        entity="category"
                        id={item.id}
                        title={item.name}
                        fields={[
                          {
                            name: 'image',
                            label: 'Візуальний елемент напряму',
                            type: 'image',
                            value: media?.url ?? '',
                            alt: item.name,
                          },
                          { name: 'name', label: 'Назва', value: item.name },
                          { name: 'color', label: 'Акцент', value: item.color },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
              <Pagination
                page={categories.page}
                pageCount={categories.pageCount}
                total={categories.total}
                pathname="/admin/reference"
                query={baseQuery}
                pageParam="categoriesPage"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
