import Link from 'next/link';
import { AuthForm } from '@/components/features/forms';
export default function RegisterPage() { return <div className="auth-page"><div className="auth-shell"><aside className="auth-aside"><p className="eyebrow">Створення профілю</p><h1>Почни збирати власний маршрут.</h1></aside><section className="auth-main"><p className="eyebrow">Новий профіль</p><h2>Приєднатися до StudentFlow</h2><p>Заповни дані — групу та спеціальність можна вибрати у профілі.</p><AuthForm mode="register" /><p>Вже є профіль? <Link href="/login">Увійти</Link></p></section></div></div>; }
