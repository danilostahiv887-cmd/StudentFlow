import { requireUser } from '@/server/auth';
import { getDb } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { ProfileForm } from '@/components/features/forms';
export default async function AdminProfilePage() {
  const user = await requireUser(['admin']);
  const db = await getDb();
  return (
    <div className="page">
      <div className="workspace">
        <WorkspaceNav role="admin" active="/admin/profile" />
        <div className="workspace-main">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Адміністративний контур</p>
              <h1>Мій профіль</h1>
            </div>
          </div>
          <ProfileForm profile={user} groups={db.groups} specialities={db.specialities} />
        </div>
      </div>
    </div>
  );
}
