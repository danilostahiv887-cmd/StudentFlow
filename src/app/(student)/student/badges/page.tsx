import { requireUser } from '@/server/auth';
import { makePage, studentData } from '@/server/repository';
import { WorkspaceNav } from '@/components/layout/workspace-nav';
import { AppSelect, BadgeCard, EmptyState, ListControls, Pagination } from '@/components/ui/primitives';

type Search = { search?: string; state?: string; page?: string; pageSize?: string };

export default async function BadgesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser(['student']);
  const query = await searchParams;
  const { database, unlocked } = await studentData(user.id);
  const pageSize = Number(query.pageSize ?? 6);
  const needle = query.search?.trim().toLocaleLowerCase('uk-UA');
  const imageUrl = (imageKey: number) => database.mediaAssets.find((item) => item.kind === 'badge' && item.imageKey === imageKey)?.url;
  let badges = database.badges.filter((badge) => !needle || `${badge.title} ${badge.description}`.toLocaleLowerCase('uk-UA').includes(needle));
  if (query.state === 'unlocked') badges = badges.filter((badge) => unlocked.some((item) => item.badgeId === badge.id));
  if (query.state === 'locked') badges = badges.filter((badge) => !unlocked.some((item) => item.badgeId === badge.id));
  const result = makePage(badges, Number(query.page ?? 1), pageSize);
  const listQuery = { search: query.search, state: query.state, pageSize: query.pageSize };

  return (
    <div className="page">
      <div className="page-intro"><div><p className="eyebrow">Студентський простір</p><h1>Відзнаки</h1></div><p>Кожна відзнака відображає підтверджений крок маршруту.</p></div>
      <div className="workspace"><WorkspaceNav role="student" active="/student/badges" /><div className="workspace-main"><section className="surface"><ListControls pathname="/student/badges" search={query.search} pageSize={pageSize} placeholder="Назва або опис відзнаки"><AppSelect name="state" defaultValue={query.state ?? ''}><option value="">Усі відзнаки</option><option value="unlocked">Відкриті</option><option value="locked">Ще закриті</option></AppSelect></ListControls>{result.items.length ? <div className="badge-grid">{result.items.map((badge) => { const item = unlocked.find((value) => value.badgeId === badge.id); return <BadgeCard badge={badge} unlockedAt={item?.unlockedAt} progress={item ? 100 : 35} imageUrl={imageUrl(badge.imageKey)} key={badge.id} />; })}</div> : <EmptyState title="Відзнак не знайдено" body="Змініть пошук або фільтр колекції." />}<Pagination page={result.page} pageCount={result.pageCount} total={result.total} pathname="/student/badges" query={listQuery} /></section></div></div>
    </div>
  );
}
