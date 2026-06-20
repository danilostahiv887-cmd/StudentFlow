import { requireUser } from '@/server/auth';
import { studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { ProfileForm } from '@/components/features/forms';
export default async function StudentProfilePage() {
  const user = await requireUser(['student']);
  const { profile, database } = await studentData(user.id);
  return (
    <div className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Студентський простір</p>
          <h1>Профіль</h1>
        </div>
      </div>
      <div className="workspace">
        <WorkspaceNav role="student" active="/student/profile" />
        <div className="workspace-main">
          <ProfileForm
            profile={profile}
            groups={database.groups}
            specialities={database.specialities}
          />
        </div>
      </div>
    </div>
  );
}
