import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApplyDialog } from '@/components/features/forms';
import { ActivityCard, ImageKitImage, SkillBars } from '@/components/ui/primitives';
import { currentUser } from '@/server/auth';
import { getActivityBySlug, listActivities } from '@/server/repository';
import { formatDate } from '@/lib/formatters';

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [activity, user] = await Promise.all([getActivityBySlug(slug), currentUser()]);
  if (!activity) notFound();
  const similar = (await listActivities({ category: activity.categoryId, pageSize: 3 })).items
    .filter((item) => item.id !== activity.id)
    .slice(0, 3);

  return (
    <div className="page">
      <div className="activity-detail route-detail">
        <div className="detail-cover route-cover">
          <ImageKitImage
            imageKey={activity.imageKey}
            url={activity.imageUrl}
            alt={activity.imageAlt ?? activity.title}
            priority
          />
        </div>
        <article className="detail-content">
          <p className="eyebrow">
            {activity.category.name} · {activity.club.name}
          </p>
          <h1>{activity.title}</h1>
          <p className="detail-summary">{activity.description}</p>
          <div className="detail-facts route-facts">
            <div>
              <span>Старт</span>
              <b>{formatDate(activity.startAt)}</b>
            </div>
            <div>
              <span>Формат</span>
              <b>
                {activity.format === 'offline'
                  ? 'Офлайн'
                  : activity.format === 'online'
                    ? 'Онлайн'
                    : 'Гібрид'}
              </b>
            </div>
            <div>
              <span>Локація</span>
              <b>{activity.location}</b>
            </div>
            <div>
              <span>Цінність</span>
              <b>{activity.points} балів</b>
            </div>
            <div>
              <span>Рівень</span>
              <b>
                {activity.difficulty === 'beginner'
                  ? 'Старт'
                  : activity.difficulty === 'intermediate'
                    ? 'Ріст'
                    : 'Виклик'}
              </b>
            </div>
            <div>
              <span>Ментор</span>
              <b>{activity.teacher.fullName}</b>
            </div>
          </div>
          {user?.role === 'student' ? (
            <ApplyDialog activityId={activity.id} activityTitle={activity.title} />
          ) : (
            <Link className="button button-primary" href="/login">
              Увійти та додати крок
            </Link>
          )}
          <section className="info-section">
            <h2>Що підготувати</h2>
            <p>{activity.requirements}</p>
          </section>
          <section className="info-section">
            <h2>Доказ для портфоліо</h2>
            <p>{activity.resultDescription}</p>
          </section>
          <section className="info-section">
            <h2>Компетентності</h2>
            <SkillBars skills={activity.skills} />
          </section>
        </article>
      </div>
      {similar.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p>Поруч із цим напрямом</p>
              <h2>Наступні кроки</h2>
            </div>
            <Link href={`/activities?category=${activity.categoryId}`}>Увесь напрям</Link>
          </div>
          <div className="activity-grid">
            {similar.map((item) => (
              <ActivityCard activity={item} key={item.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
