import { requireUser } from '@/server/auth';
import { teacherQueue } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { ActivityCard, EmptyState } from '@/components/ui/primitives';
export default async function TeacherActivitiesPage() { const user = await requireUser(['teacher']); const { activities } = await teacherQueue(user.id); return <div className="page"><div className="page-intro"><div><p className="eyebrow">Менторський простір</p><h1>Мої треки</h1></div></div><div className="workspace"><WorkspaceNav role="teacher" active="/teacher/activities" /><div className="workspace-main"><section className="surface">{activities.length ? <div className="activity-grid">{activities.map((activity) => <ActivityCard activity={activity} key={activity.id} />)}</div> : <EmptyState title="Треків ще немає" body="Нові можливості з’являться після призначення ментора." />}</section></div></div></div>; }
