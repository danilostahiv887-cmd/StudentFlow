import Link from 'next/link';
import {
  ActivityCard,
  ActiveFiltersBar,
  AppSelect,
  EmptyState,
  PageSizeSelect,
  Pagination,
  SearchBox,
} from '@/components/ui/primitives';
import { listActivities } from '@/server/repository';

type Search = { [key: string]: string | string[] | undefined };
const first = (value: Search[string]) => (Array.isArray(value) ? value[0] : value);

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const page = Number(first(params.page) ?? 1);
  const pageSize = Number(first(params.pageSize) ?? 6);
  const filters = {
    search: first(params.search),
    category: first(params.category),
    club: first(params.club),
    format: first(params.format),
    difficulty: first(params.difficulty),
    sort: first(params.sort),
    page,
    pageSize,
  };
  const result = await listActivities(filters);
  const query = Object.fromEntries(
    Object.entries(filters)
      .filter(([key, value]) => key !== 'page' && value && value !== 'closest')
      .map(([key, value]) => [key, String(value)]),
  );
  const active = [
    ['search', filters.search],
    ['category', result.categories.find((item) => item.id === filters.category)?.name],
    ['club', result.clubs.find((item) => item.id === filters.club)?.name],
    ['format', filters.format],
    ['difficulty', filters.difficulty],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      label: String(value),
      href: `/activities?${new URLSearchParams(Object.entries(query).filter(([entry]) => entry !== key)).toString()}`,
    }));

  return (
    <div className="page">
      <div className="page-intro nav-intro">
        <div>
          <p className="eyebrow">Навігатор</p>
          <h1>Кроки для персонального маршруту</h1>
        </div>
        <Link className="button button-primary" href="/register">
          Створити профіль
        </Link>
      </div>
      <div className="catalog-layout navigator-layout">
        <form className="filters navigator-filters" action="/activities">
          <h2>Зібрати маршрут</h2>
          <SearchBox defaultValue={filters.search} placeholder="Навичка, назва або формат" />
          <label>
            Напрям
            <AppSelect name="category" defaultValue={filters.category}>
              <option value="">Усі напрями</option>
              {result.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Майданчик
            <AppSelect name="club" defaultValue={filters.club}>
              <option value="">Усі майданчики</option>
              {result.clubs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Формат
            <AppSelect name="format" defaultValue={filters.format}>
              <option value="">Будь-який</option>
              <option value="offline">Офлайн</option>
              <option value="online">Онлайн</option>
              <option value="hybrid">Гібрид</option>
            </AppSelect>
          </label>
          <label>
            Рівень
            <AppSelect name="difficulty" defaultValue={filters.difficulty}>
              <option value="">Будь-який</option>
              <option value="beginner">Старт</option>
              <option value="intermediate">Ріст</option>
              <option value="advanced">Виклик</option>
            </AppSelect>
          </label>
          <input type="hidden" name="pageSize" value={pageSize} />
          <div className="filters-actions">
            <button className="button button-primary" type="submit">
              Підібрати
            </button>
            <Link className="button button-ghost" href="/activities">
              Скинути
            </Link>
          </div>
        </form>
        <section>
          <ActiveFiltersBar filters={active} />
          <div className="catalog-toolbar">
            <form action="/activities">
              <SearchBox defaultValue={filters.search} placeholder="Швидкий пошук" />
              <input type="hidden" name="category" value={filters.category ?? ''} />
              <input type="hidden" name="club" value={filters.club ?? ''} />
              <input type="hidden" name="format" value={filters.format ?? ''} />
              <input type="hidden" name="difficulty" value={filters.difficulty ?? ''} />
            </form>
            <form action="/activities" className="size-select">
              <input type="hidden" name="search" value={filters.search ?? ''} />
              <label>
                Порядок{' '}
                <AppSelect name="sort" defaultValue={filters.sort ?? 'closest'}>
                  <option value="closest">Найближчі</option>
                  <option value="points">Найбільше балів</option>
                  <option value="popular">Найчастіше в маршрутах</option>
                </AppSelect>
              </label>
              <PageSizeSelect value={pageSize} />
              <button className="button button-secondary" type="submit">
                Оновити
              </button>
            </form>
          </div>
          {result.items.length ? (
            <div className="activity-grid">
              {result.items.map((activity) => (
                <ActivityCard activity={activity} key={activity.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Кроків не знайдено"
              body="Змініть пошук або напрям."
              action={
                <Link className="button button-primary" href="/activities">
                  Показати все
                </Link>
              }
            />
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pathname="/activities"
            query={query}
          />
        </section>
      </div>
    </div>
  );
}
