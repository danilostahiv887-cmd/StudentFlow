'use client';

import { useId, useRef, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { AppButton, AppInput, AppSelect, AppTextarea, FieldError, FormErrorSummary } from '@/components/ui/primitives';
import { AppModal, ConfirmDialog } from '@/components/ui/dialogs';
import { useToast } from '@/components/ui/toast';

type ApiResult = { success: boolean; formError?: string; fieldErrors?: Record<string, string[]>; data?: Record<string, unknown> & { role?: string } };
type UploadedMedia = { fileId?: string };
const maxImageBytes = 5 * 1024 * 1024;

async function request(url: string, method: string, body?: unknown): Promise<ApiResult> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<ApiResult>;
}

function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form)) as Record<string, string>;
}

function setImageField(root: HTMLElement, field: string, value: string) {
  const input = root.querySelector<HTMLInputElement>(`input[data-image-field="${field}"]`);
  if (input) input.value = value;
}

async function cleanupUploadedImages(uploads: UploadedMedia[]) {
  const fileIds = uploads.map((item) => item.fileId).filter(Boolean);
  if (!fileIds.length) return;
  await fetch('/api/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds }),
  }).catch(() => undefined);
}

async function uploadPendingImages(form: HTMLFormElement) {
  const uploads: UploadedMedia[] = [];
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-image-upload="true"]'));
  for (const input of inputs) {
    const file = input.files?.[0];
    if (!file) continue;
    if (!file.type.startsWith('image/')) throw new Error('Можна завантажувати лише зображення.');
    if (file.size > maxImageBytes) throw new Error('Зображення має бути до 5 МБ.');
    const root = input.closest<HTMLElement>('.image-picker');
    if (!root) continue;
    const payload = new FormData();
    payload.set('file', file);
    payload.set('folder', input.dataset.folder || '/studentflow/forms');
    const response = await fetch('/api/media', { method: 'POST', body: payload });
    const result = (await response.json()) as ApiResult;
    if (!response.ok || !result.success) throw new Error(result.formError ?? 'Не вдалося завантажити зображення.');
    const data = result.data ?? {};
    const url = String(data.url ?? '');
    if (!url) throw new Error('Не вдалося підготувати зображення для форми.');
    const upload = { fileId: typeof data.fileId === 'string' ? data.fileId : undefined };
    uploads.push(upload);
    setImageField(root, 'url', url);
    setImageField(root, 'fileId', upload.fileId ?? '');
    setImageField(root, 'fileName', typeof data.fileName === 'string' ? data.fileName : file.name);
    setImageField(root, 'thumbnailUrl', typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : url);
    setImageField(root, 'remove', 'false');
  }
  return uploads;
}

async function requestWithImages(form: HTMLFormElement, submit: (values: Record<string, string>) => Promise<ApiResult>) {
  const uploads = await uploadPendingImages(form);
  try {
    const result = await submit(formValues(form));
    if (!result.success) await cleanupUploadedImages(uploads);
    return result;
  } catch (error) {
    await cleanupUploadedImages(uploads);
    throw error;
  }
}

function ImagePicker({
  label = 'Зображення',
  help = 'PNG, JPG або WebP до 5 МБ. Після вибору файл одразу з’явиться у попередньому огляді.',
  initialUrl = '',
  altBase = 'Зображення',
  urlFieldName = 'imageUrl',
  folder = '/studentflow/forms',
}: {
  label?: string;
  help?: string;
  initialUrl?: string;
  altBase?: string;
  urlFieldName?: string;
  folder?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl);
  const [removed, setRemoved] = useState(false);
  const [selectedName, setSelectedName] = useState<string>();
  const [error, setError] = useState<string>();

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError(undefined);
    if (!file.type.startsWith('image/')) {
      setError('Можна завантажувати лише зображення.');
      input.value = '';
      return;
    }
    if (file.size > maxImageBytes) {
      setError('Зображення має бути до 5 МБ.');
      input.value = '';
      return;
    }
    setRemoved(false);
    setSelectedName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    setPreview('');
    setRemoved(true);
    setSelectedName(undefined);
    setError(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="image-picker">
      <div className="image-picker-head">
        <div>
          <span>{label}</span>
          <p>{help}</p>
        </div>
        <ImageIcon size={18} aria-hidden />
      </div>
      <div className={preview ? 'image-preview has-image' : 'image-preview'}>
        {preview ? <img src={preview} alt={`Попередній огляд: ${altBase}`} /> : <span>Попередній огляд</span>}
      </div>
      <div className="image-picker-actions">
        <label className="button button-secondary" htmlFor={inputId}>
          <UploadCloud size={16} aria-hidden />
          {preview ? 'Замінити' : 'Вибрати файл'}
        </label>
        <input ref={inputRef} id={inputId} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" data-image-upload="true" data-folder={folder} onChange={selectImage} />
        <AppButton type="button" variant="ghost" onClick={clear} disabled={!preview}>
          <Trash2 size={16} aria-hidden />
          Видалити
        </AppButton>
      </div>
      {selectedName && <p className="image-status">Буде завантажено після збереження: {selectedName}</p>}
      {error && <p className="field-error">{error}</p>}
      <input type="hidden" name={urlFieldName} data-image-field="url" defaultValue="" />
      <input type="hidden" name="imageFileId" data-image-field="fileId" defaultValue="" />
      <input type="hidden" name="imageFileName" data-image-field="fileName" defaultValue="" />
      <input type="hidden" name="imageThumbnailUrl" data-image-field="thumbnailUrl" defaultValue="" />
      <input type="hidden" name="imageAlt" data-image-field="alt" value={altBase} readOnly />
      <input type="hidden" name="removeImage" data-image-field="remove" value={removed ? 'true' : 'false'} readOnly />
    </section>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const submit = async (form: HTMLFormElement) => {
    setPending(true);
    setError(undefined);
    const result = await request(`/api/auth/${mode}`, 'POST', formValues(form));
    setPending(false);
    if (!result.success) {
      setError(result.formError);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    const next = searchParams.get('next');
    const target = next?.startsWith('/') && !next.startsWith('//') ? next : `/${result.data?.role ?? 'student'}`;
    router.push(target);
    router.refresh();
  };
  return (
    <form className="auth-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <FormErrorSummary>{error}</FormErrorSummary>
      {mode === 'register' && <label>Повне ім’я<AppInput name="fullName" placeholder="Ім’я та прізвище" autoComplete="name" /><FieldError>{fieldErrors.fullName?.[0]}</FieldError></label>}
      <label>Електронна пошта<AppInput name="email" type="email" placeholder="you@example.com" autoComplete="email" /><FieldError>{fieldErrors.email?.[0]}</FieldError></label>
      <label>Пароль<AppInput name="password" type="password" placeholder="Щонайменше 6 символів" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><FieldError>{fieldErrors.password?.[0]}</FieldError></label>
      <AppButton type="submit" disabled={pending}>{pending ? 'Зачекайте…' : mode === 'login' ? 'Увійти до StudentFlow' : 'Створити студентський профіль'}</AppButton>
    </form>
  );
}

export function ApplyDialog({ activityId, activityTitle }: { activityId: string; activityTitle: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const submit = async (form: HTMLFormElement) => {
    setPending(true);
    const result = await request('/api/applications', 'POST', { activityId, motivation: new FormData(form).get('motivation') });
    setPending(false);
    if (!result.success) return setError(result.formError);
    setOpen(false);
    push('Крок додано до маршруту.');
    router.refresh();
  };
  return (
    <>
      <AppButton type="button" onClick={() => setOpen(true)}>Додати в маршрут</AppButton>
      <AppModal open={open} title={`Маршрут: ${activityTitle}`} onClose={() => setOpen(false)}>
        <form className="modal-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
          <FormErrorSummary>{error}</FormErrorSummary>
          <label className="form-label">Навіщо вам цей крок<AppTextarea name="motivation" rows={6} placeholder="Наприклад: хочу додати цей результат до портфоліо" /></label>
          <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>Скасувати</AppButton><AppButton type="submit" disabled={pending}>{pending ? 'Додаємо…' : 'Додати крок'}</AppButton></div>
        </form>
      </AppModal>
    </>
  );
}

export function ReportDialog({ applicationId, title, initialEvidenceUrl }: { applicationId: string; title: string; initialEvidenceUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const submit = async (form: HTMLFormElement) => {
    setError(undefined);
    setPending(true);
    try {
      const result = await requestWithImages(form, (values) => request('/api/reports', 'POST', { applicationId, ...values }));
      if (!result.success) return setError(result.formError);
      setOpen(false);
      push('Доказ передано ментору.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося передати доказ.');
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <AppButton type="button" variant="secondary" onClick={() => setOpen(true)}>Додати доказ</AppButton>
      <AppModal open={open} title={`Доказ: ${title}`} onClose={() => setOpen(false)} size="lg">
        <form className="modal-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
          <FormErrorSummary>{error}</FormErrorSummary>
          <div className="modal-grid modal-grid-2">
            <div className="modal-section">
              <label className="form-label">Що підтверджує результат<AppTextarea name="reflection" rows={5} placeholder="Опишіть артефакт, рішення, виступ, файл або інший результат" /></label>
              <label className="form-label">Час роботи<AppInput name="hoursSpent" type="number" placeholder="Наприклад, 4" /></label>
              <label className="form-label">Компетентності<AppInput name="skillsGained" placeholder="Наприклад, презентація, дослідження, командна робота" /></label>
            </div>
            <ImagePicker label="Доказ у вигляді зображення" urlFieldName="evidenceUrl" initialUrl={initialEvidenceUrl} altBase={title} folder="/studentflow/evidence" />
          </div>
          <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>Скасувати</AppButton><AppButton type="submit" disabled={pending}>{pending ? 'Зберігаємо…' : 'Передати доказ'}</AppButton></div>
        </form>
      </AppModal>
    </>
  );
}

export function ReviewDialog({ kind, id, title }: { kind: 'application' | 'report'; id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'approved' | 'rejected' | 'needs_changes'>('approved');
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const submit = async (form: HTMLFormElement) => {
    setPending(true);
    const result = await request('/api/reviews', 'POST', { kind, id, status: mode, feedback: new FormData(form).get('feedback') });
    setPending(false);
    if (!result.success) return setError(result.formError);
    setOpen(false);
    push('Фідбек збережено.');
    router.refresh();
  };
  return (
    <>
      <AppButton type="button" variant="secondary" onClick={() => setOpen(true)}>Дати фідбек</AppButton>
      <AppModal open={open} title={title} onClose={() => setOpen(false)}>
        <form className="modal-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
          <FormErrorSummary>{error}</FormErrorSummary>
          <div className="decision-grid">
            <button type="button" className={mode === 'approved' ? 'decision active' : 'decision'} onClick={() => setMode('approved')}>Прийняти</button>
            <button type="button" className={mode === 'needs_changes' ? 'decision active' : 'decision'} onClick={() => setMode('needs_changes')}>{kind === 'report' ? 'Уточнити' : 'Відкласти'}</button>
            <button type="button" className={mode === 'rejected' ? 'decision active' : 'decision'} onClick={() => setMode('rejected')}>Відхилити</button>
          </div>
          <label className="form-label">Коментар для студента<AppTextarea name="feedback" rows={4} placeholder="Додайте конкретний фідбек до маршруту або доказу" /></label>
          <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>Скасувати</AppButton><AppButton type="submit" disabled={pending}>{pending ? 'Зберігаємо…' : 'Зберегти фідбек'}</AppButton></div>
        </form>
      </AppModal>
    </>
  );
}

export function CancelApplication({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const { push } = useToast();
  const router = useRouter();
  const confirm = async () => {
    const result = await request('/api/applications', 'DELETE', { applicationId, reason });
    if (!result.success) return setError(result.formError);
    setOpen(false);
    push('Крок прибрано з маршруту.');
    router.refresh();
  };
  return (
    <>
      <AppButton type="button" variant="ghost" onClick={() => setOpen(true)}>Прибрати</AppButton>
      <AppModal open={open} title="Прибрати крок" onClose={() => setOpen(false)} size="sm">
        <FormErrorSummary>{error}</FormErrorSummary>
        <label className="form-label">Причина<AppTextarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Коротко поясніть рішення" /></label>
        <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>Назад</AppButton><AppButton type="button" variant="danger" onClick={() => void confirm()}>Прибрати з маршруту</AppButton></div>
      </AppModal>
    </>
  );
}

export function ToggleUserButton({ profileId, status }: { profileId: string; status: string }) {
  const [open, setOpen] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const confirm = async () => {
    const result = await request('/api/admin', 'PATCH', { profileId });
    if (!result.success) return push(result.formError ?? 'Не вдалося змінити статус.');
    setOpen(false);
    push('Статус користувача оновлено.');
    router.refresh();
  };
  return (
    <>
      <AppButton type="button" variant={status === 'active' ? 'danger' : 'secondary'} onClick={() => setOpen(true)}>{status === 'active' ? 'Деактивувати' : 'Активувати'}</AppButton>
      <ConfirmDialog open={open} title="Змінити статус користувача" message="Користувач одразу втратить або отримає доступ до робочого простору." confirmText="Підтвердити" danger={status === 'active'} onCancel={() => setOpen(false)} onConfirm={() => void confirm()} />
    </>
  );
}

export function StudentBadgeToggle({ studentId, badgeId, studentBadgeId }: { studentId: string; badgeId: string; studentBadgeId?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const grant = async () => {
    setPending(true);
    const result = await request('/api/admin', 'POST', { action: 'studentBadge', studentId, badgeId });
    setPending(false);
    if (!result.success) return push(result.formError ?? 'Не вдалося видати відзнаку.');
    push('Відзнаку видано студенту.');
    router.refresh();
  };
  const revoke = async () => {
    if (!studentBadgeId) return;
    setPending(true);
    const result = await request('/api/admin', 'DELETE', { entity: 'studentBadge', id: studentBadgeId });
    setPending(false);
    if (!result.success) return push(result.formError ?? 'Не вдалося забрати відзнаку.');
    setOpen(false);
    push('Відзнаку забрано.');
    router.refresh();
  };
  return (
    <>
      {studentBadgeId ? <AppButton type="button" variant="danger" disabled={pending} onClick={() => setOpen(true)}>Забрати</AppButton> : <AppButton type="button" variant="secondary" disabled={pending} onClick={() => void grant()}>{pending ? 'Видаємо…' : 'Видати'}</AppButton>}
      <ConfirmDialog open={open} title="Забрати відзнаку" message="Відзнака зникне з портфоліо студента. Її можна буде видати повторно вручну." confirmText={pending ? 'Зачекайте…' : 'Забрати'} danger onCancel={() => setOpen(false)} onConfirm={() => void revoke()} />
    </>
  );
}

export function ProfileForm({ profile, groups, specialities }: { profile: { fullName: string; phone?: string; bio?: string; groupId?: string; specialityId?: string; role: string }; groups: { id: string; name: string }[]; specialities: { id: string; name: string }[] }) {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const submit = async (form: HTMLFormElement) => {
    setPending(true);
    const result = await request('/api/profile', 'PATCH', formValues(form));
    setPending(false);
    if (!result.success) return setError(result.formError);
    push('Профіль оновлено.');
    router.refresh();
  };
  return (
    <form className="surface" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <FormErrorSummary>{error}</FormErrorSummary>
      <label className="form-label">Повне ім’я<AppInput name="fullName" defaultValue={profile.fullName} /></label>
      <label className="form-label">Телефон<AppInput name="phone" defaultValue={profile.phone} placeholder="+380 …" /></label>
      {profile.role === 'student' && <div className="dashboard-grid"><label className="form-label">Група<AppSelect name="groupId" defaultValue={profile.groupId}>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect></label><label className="form-label">Спеціальність<AppSelect name="specialityId" defaultValue={profile.specialityId}>{specialities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect></label></div>}
      <label className="form-label">Про себе<AppTextarea name="bio" defaultValue={profile.bio} rows={4} placeholder="Коротко про свої цілі" /></label>
      <AppButton type="submit" disabled={pending}>{pending ? 'Зберігаємо…' : 'Зберегти зміни'}</AppButton>
    </form>
  );
}

export function AdminCreateDialog({ kind, teachers = [], categories = [], clubs = [] }: { kind: 'teacher' | 'activity' | 'reference'; teachers?: { id: string; fullName: string }[]; categories?: { id: string; name: string }[]; clubs?: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const heading = kind === 'teacher' ? 'Створити ментора' : kind === 'activity' ? 'Створити можливість' : 'Додати довідник';
  const submit = async (form: HTMLFormElement) => {
    setError(undefined);
    setPending(true);
    try {
      const result = await requestWithImages(form, (values) => request('/api/admin', 'POST', { action: kind, ...values }));
      if (!result.success) return setError(result.formError);
      setOpen(false);
      push('Дані збережено.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти дані.');
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <AppButton type="button" onClick={() => setOpen(true)}>Додати</AppButton>
      <AppModal open={open} title={heading} onClose={() => setOpen(false)} size={kind === 'teacher' ? 'md' : 'lg'}>
        <form className="modal-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
          <FormErrorSummary>{error}</FormErrorSummary>
          {kind === 'teacher' && <div className="modal-section"><label className="form-label">Повне ім’я<AppInput name="fullName" /></label><label className="form-label">Електронна пошта<AppInput name="email" type="email" /></label><label className="form-label">Початковий пароль<AppInput name="password" type="password" /></label></div>}
          {kind === 'activity' && (
            <div className="modal-grid modal-grid-2">
              <div className="modal-section">
                <label className="form-label">Назва<AppInput name="title" /></label>
                <label className="form-label">Короткий опис<AppTextarea name="shortDescription" rows={3} /></label>
                <div className="modal-grid modal-grid-2 compact">
                  <label className="form-label">Трек<AppSelect name="categoryId">{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect></label>
                  <label className="form-label">Майданчик<AppSelect name="clubId">{clubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect></label>
                  <label className="form-label">Ментор<AppSelect name="teacherId">{teachers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</AppSelect></label>
                  <label className="form-label">Формат<AppSelect name="format"><option value="offline">Офлайн</option><option value="online">Онлайн</option><option value="hybrid">Гібрид</option></AppSelect></label>
                </div>
                <label className="form-label">Локація<AppInput name="location" /></label>
                <div className="modal-grid modal-grid-2 compact">
                  <label className="form-label">Старт<AppInput name="startAt" type="datetime-local" /></label>
                  <label className="form-label">Фініш<AppInput name="endAt" type="datetime-local" /></label>
                  <label className="form-label">Ліміт учасників<AppInput name="maxParticipants" type="number" /></label>
                  <label className="form-label">Цінність<AppInput name="points" type="number" /></label>
                </div>
              </div>
              <ImagePicker label="Обкладинка можливості" altBase="Нова можливість" folder="/studentflow/activities" />
            </div>
          )}
          {kind === 'reference' && (
            <div className="modal-grid modal-grid-2">
              <div className="modal-section">
                <label className="form-label">Тип<AppSelect name="kind"><option value="groups">Академічна група</option><option value="specialities">Спеціальність</option><option value="clubs">Майданчик</option><option value="categories">Трек</option><option value="badges">Відзнака</option></AppSelect></label>
                <label className="form-label">Назва<AppInput name="name" /></label>
                <label className="form-label">Код або колір<AppInput name="code" placeholder="Наприклад, ІПЗ або aqua" /></label>
                <label className="form-label">Опис<AppTextarea name="description" rows={3} /></label>
              </div>
              <ImagePicker label="Візуальний елемент" help="Використовується для майданчика, треку або відзнаки. Для груп і спеціальностей можна залишити порожнім." altBase="Довідник" folder="/studentflow/reference" />
            </div>
          )}
          <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>Скасувати</AppButton><AppButton type="submit" disabled={pending}>{pending ? 'Зберігаємо…' : 'Створити'}</AppButton></div>
        </form>
      </AppModal>
    </>
  );
}

type CrudField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'datetime-local' | 'image';
  value?: string | number;
  options?: { value: string; label: string }[];
  help?: string;
  alt?: string;
};

function CrudFieldControl({ field, title }: { field: CrudField; title: string }) {
  if (field.type === 'image') {
    return <ImagePicker label={field.label} help={field.help} initialUrl={String(field.value ?? '')} altBase={field.alt ?? title} />;
  }
  return (
    <label className="form-label">
      {field.label}
      {field.type === 'textarea' ? <AppTextarea name={field.name} defaultValue={String(field.value ?? '')} rows={4} /> : field.type === 'select' ? <AppSelect name={field.name} defaultValue={String(field.value ?? '')}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</AppSelect> : <AppInput name={field.name} type={field.type ?? 'text'} defaultValue={String(field.value ?? '')} />}
    </label>
  );
}

export function AdminCrudActions({ entity, id, title, fields }: { entity: string; id: string; title: string; fields: CrudField[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const save = async (form: HTMLFormElement) => {
    setError(undefined);
    setPending(true);
    try {
      const result = await requestWithImages(form, (values) => request('/api/admin', 'PUT', { entity, id, values }));
      if (!result.success) return setError(result.formError);
      setEditOpen(false);
      push('Зміни збережено.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти зміни.');
    } finally {
      setPending(false);
    }
  };
  const remove = async () => {
    const result = await request('/api/admin', 'DELETE', { entity, id });
    if (!result.success) return push(result.formError ?? 'Не вдалося видалити запис.');
    setDeleteOpen(false);
    push('Запис і пов’язані дані видалено.');
    router.refresh();
  };
  return (
    <div className="data-row-actions">
      <AppButton type="button" variant="secondary" onClick={() => setEditOpen(true)}>Редагувати</AppButton>
      <AppButton type="button" variant="danger" onClick={() => setDeleteOpen(true)}>Видалити</AppButton>
      <AppModal open={editOpen} title={`Редагувати: ${title}`} onClose={() => setEditOpen(false)} size={fields.length > 4 || fields.some((field) => field.type === 'image') ? 'lg' : 'md'}>
        <form className="modal-form" noValidate onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }}>
          <FormErrorSummary>{error}</FormErrorSummary>
          <div className="modal-grid modal-grid-2">
            {fields.map((field) => <CrudFieldControl field={field} title={title} key={field.name} />)}
          </div>
          <div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={() => setEditOpen(false)}>Скасувати</AppButton><AppButton type="submit" disabled={pending}>{pending ? 'Зберігаємо…' : 'Зберегти'}</AppButton></div>
        </form>
      </AppModal>
      <ConfirmDialog open={deleteOpen} title={`Видалити: ${title}`} message="Запис буде видалено разом із пов’язаними маршрутами, доказами, відзнаками або медіа, якщо вони залежать від цього запису." confirmText="Видалити" danger onCancel={() => setDeleteOpen(false)} onConfirm={() => void remove()} />
    </div>
  );
}
