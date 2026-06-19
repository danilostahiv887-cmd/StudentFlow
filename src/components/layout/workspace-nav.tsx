import Link from 'next/link';
import type { Role } from '@/types/entities';
const links: Record<Role, [string, string][]> = {
  student: [['/student','Панель'],['/student/applications','Маршрут'],['/student/reports','Докази'],['/student/portfolio','Портфоліо'],['/student/badges','Відзнаки'],['/student/profile','Профіль']],
  teacher: [['/teacher','Панель'],['/teacher/reviews','Фідбек'],['/teacher/activities','Мої треки'],['/teacher/profile','Профіль']],
  admin: [['/admin','Панель'],['/admin/students','Студенти'],['/admin/teachers','Ментори'],['/admin/activities','Можливості'],['/admin/applications','Маршрути'],['/admin/reports','Докази'],['/admin/reference','Довідники'],['/admin/badges','Відзнаки'],['/admin/profile','Профіль']]
};
export function WorkspaceNav({ role, active }: { role: Role; active: string }) { return <aside className="side-nav"><span>Навігація</span>{links[role].map(([href, title]) => <Link className={href === active ? 'active' : ''} href={href} key={href}>{title}</Link>)}</aside>; }
