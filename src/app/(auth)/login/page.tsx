import Link from 'next/link';
import { AuthForm } from '@/components/features/forms';
export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <p className="eyebrow">StudentFlow</p>
          <h1>Твій розвиток має власний ритм.</h1>
          <p>Увійди, щоб бачити маршрут, докази та портфоліо.</p>
        </aside>
        <section className="auth-main">
          <p className="eyebrow">Повернення до простору</p>
          <h2>Увійти</h2>
          <AuthForm mode="login" />
          <p>
            Ще немає профілю? <Link href="/register">Створити студентський профіль</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
