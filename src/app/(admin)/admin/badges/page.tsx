import { requireUser } from '@/server/auth';
import { getDb } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { BadgeCard } from '@/components/ui/primitives';
import { AdminCreateDialog, AdminCrudActions } from '@/components/features/forms';

export default async function AdminBadgesPage() {
  await requireUser(['admin']);
  const db = await getDb();
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
            <div className="badge-grid">
              {db.badges.map((badge) => {
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
