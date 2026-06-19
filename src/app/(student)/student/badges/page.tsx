import { requireUser } from '@/server/auth';
import { studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { BadgeCard } from '@/components/ui/primitives';
export default async function BadgesPage() { const user = await requireUser(['student']); const { database, unlocked } = await studentData(user.id); return <div className="page"><div className="page-intro"><div><p className="eyebrow">Студентський простір</p><h1>Відзнаки</h1></div><p>Кожна відзнака відображає підтверджений крок маршруту.</p></div><div className="workspace"><WorkspaceNav role="student" active="/student/badges" /><div className="workspace-main"><section className="surface"><div className="badge-grid">{database.badges.map((badge) => { const item = unlocked.find((value) => value.badgeId === badge.id); return <BadgeCard badge={badge} unlockedAt={item?.unlockedAt} progress={item ? 100 : 35} key={badge.id} />; })}</div></section></div></div></div>; }
