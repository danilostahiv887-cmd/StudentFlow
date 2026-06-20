import { requireUser } from '@/server/auth';
import { getDb } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { AdminCreateDialog, AdminCrudActions } from '@/components/features/forms';

export default async function AdminReferencePage() {
  await requireUser(['admin']);
  const db = await getDb();
  const mediaFor = (kind: 'club' | 'visual' | 'badge', imageKey: number) => db.mediaAssets.find((item) => item.kind === kind && item.imageKey === imageKey);
  return (
    <div className="page">
      <div className="page-intro">
        <div><p className="eyebrow">Адміністративний контур</p><h1>Довідники</h1></div>
        <AdminCreateDialog kind="reference" />
      </div>
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/reference" />
        <div className="workspace-main">
          <div className="dashboard-columns">
            <section className="surface">
              <h2>Академічні групи</h2>
              <div className="row-list">{db.groups.map((item) => <div className="queue-row" key={item.id}><div><b>{item.name}</b><small>{item.startYear}-{item.endYear}</small></div><AdminCrudActions entity="group" id={item.id} title={item.name} fields={[{ name: 'name', label: 'Назва', value: item.name }, { name: 'startYear', label: 'Рік початку', type: 'number', value: item.startYear }, { name: 'endYear', label: 'Рік завершення', type: 'number', value: item.endYear }]} /></div>)}</div>
            </section>
            <section className="surface">
              <h2>Спеціальності</h2>
              <div className="row-list">{db.specialities.map((item) => <div className="queue-row" key={item.id}><div><b>{item.code} · {item.name}</b><small>{item.description}</small></div><AdminCrudActions entity="speciality" id={item.id} title={item.name} fields={[{ name: 'code', label: 'Код', value: item.code }, { name: 'name', label: 'Назва', value: item.name }, { name: 'description', label: 'Опис', type: 'textarea', value: item.description }]} /></div>)}</div>
            </section>
            <section className="surface">
              <h2>Майданчики</h2>
              <div className="row-list">
                {db.clubs.map((item) => {
                  const media = mediaFor('club', item.imageKey);
                  return <div className="queue-row" key={item.id}><div><b>{item.name}</b><small>{item.description}</small></div><AdminCrudActions entity="club" id={item.id} title={item.name} fields={[{ name: 'image', label: 'Зображення майданчика', type: 'image', value: media?.url ?? '', alt: item.name }, { name: 'name', label: 'Назва', value: item.name }, { name: 'description', label: 'Опис', type: 'textarea', value: item.description }]} /></div>;
                })}
              </div>
            </section>
            <section className="surface">
              <h2>Треки</h2>
              <div className="row-list">
                {db.categories.map((item) => {
                  const media = mediaFor('visual', item.imageKey);
                  return <div className="queue-row" key={item.id}><div><b>{item.name}</b><small>{item.color}</small></div><AdminCrudActions entity="category" id={item.id} title={item.name} fields={[{ name: 'image', label: 'Візуальний елемент треку', type: 'image', value: media?.url ?? '', alt: item.name }, { name: 'name', label: 'Назва', value: item.name }, { name: 'color', label: 'Акцент', value: item.color }]} /></div>;
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
