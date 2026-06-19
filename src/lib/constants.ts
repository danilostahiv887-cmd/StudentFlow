import type { ApplicationStatus, ReportStatus, Role } from '@/types/entities';

export const PAGE_SIZE = 6;
export const roleLabel: Record<Role, string> = { student: 'Студент', teacher: 'Викладач', admin: 'Адміністратор' };
export const applicationLabel: Record<ApplicationStatus, string> = { submitted: 'У плані', under_review: 'Менторський слот', approved: 'Заплановано', rejected: 'Відкладено', cancelled: 'Прибрано', attended: 'Підтверджено', missed: 'Пропущено' };
export const reportLabel: Record<ReportStatus, string> = { draft: 'Чернетка', submitted: 'На перевірці', approved: 'Прийнято', rejected: 'Відхилено', needs_changes: 'Уточнити' };
export const statusTone: Record<string, string> = { submitted: 'violet', under_review: 'aqua', approved: 'lime', attended: 'lime', rejected: 'coral', cancelled: 'muted', missed: 'coral', draft: 'muted', needs_changes: 'coral', published: 'aqua', active: 'lime', inactive: 'coral' };
