import Link from 'next/link';
import { ArrowUpRight, Compass, Layers3, Search, Sparkles } from 'lucide-react';
import { ActivityCard, SkillBars } from '@/components/ui/primitives';
import { getDb, listActivities } from '@/server/repository';

export default async function HomePage() {
  const [{ items }, database] = await Promise.all([
    listActivities({ pageSize: 3, sort: 'points' }),
    getDb(),
  ]);
  const skills = Array.from(new Set(database.activities.flatMap((item) => item.skills))).slice(
    0,
    7,
  );

  return (
    <div className="landing route-landing">
      <section className="route-hero">
        <div className="route-hero-visual" />
        <div className="route-hero-content">
          <p className="eyebrow">StudentFlow · маршрут розвитку</p>
          <h1>Складай власну карту розвитку.</h1>
          <form className="command-search route-search" action="/activities">
            <Search size={18} />
            <input name="search" placeholder="Знайти крок за навичкою, форматом або треком…" />
            <kbd>↵</kbd>
            <button className="button button-primary" type="submit">
              Знайти
            </button>
          </form>
          <div className="route-hero-actions">
            <Link className="button button-primary" href="/activities">
              <Compass size={17} />
              Відкрити навігатор
            </Link>
            <Link className="button button-ghost" href="/register">
              <Sparkles size={17} />
              Почати маршрут
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-block compass-section">
        <div className="section-heading">
          <div>
            <p>Треки розвитку</p>
            <h2>Оберіть, яку сторону портфоліо посилити.</h2>
          </div>
          <Link href="/activities">
            Перейти до навігатора <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="competency-grid">
          {database.categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/activities?category=${category.id}`}
              className={`competency-cell cell-${category.color}`}
            >
              <span>0{index + 1}</span>
              <b>{category.name}</b>
              <small>
                {database.activities.filter((item) => item.categoryId === category.id).length}{' '}
                кроків
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-block route-workflow-strip">
        <div className="route-copy">
          <p className="eyebrow">Персональна логіка</p>
          <h2>Не список подій, а маршрут із доказами.</h2>
          <div className="flow-steps">
            <div>
              <span>01</span>
              <b>Додайте крок</b>
            </div>
            <div>
              <span>02</span>
              <b>Зафіксуйте доказ</b>
            </div>
            <div>
              <span>03</span>
              <b>Отримайте фідбек</b>
            </div>
            <div>
              <span>04</span>
              <b>Оновіть портфоліо</b>
            </div>
          </div>
        </div>
        <div className="skill-console">
          <div className="surface-head">
            <h2>Компетентності</h2>
            <Layers3 size={18} />
          </div>
          <SkillBars skills={skills} />
        </div>
      </section>

      <section className="pulse-band route-recommendations">
        <div className="landing-block">
          <div className="section-heading">
            <div>
              <p>Рекомендовані кроки</p>
              <h2>Почніть із найсильніших можливостей.</h2>
            </div>
            <Link href="/activities">
              Усі кроки <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="activity-grid">
            {items.map((activity) => (
              <ActivityCard activity={activity} key={activity.id} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
