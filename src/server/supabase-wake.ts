export type SupabaseWakeState = 'ready' | 'starting' | 'paused' | 'unconfigured' | 'error';

export interface SupabaseWakeStatus {
  state: SupabaseWakeState;
  projectStatus?: string;
  message: string;
  restoreRequested?: boolean;
}

const managementBaseUrl = 'https://api.supabase.com/v1';
const restoreCooldownMs = 10_000;
const defaultWaitMs = 25_000;
const pollMs = 10_000;
const readyProjectStatuses = new Set(['ACTIVE_HEALTHY', 'ACTIVE_UNHEALTHY']);
const startingProjectStatuses = new Set([
  'COMING_UP',
  'RESTORING',
  'RESTARTING',
  'PAUSING',
  'RESIZING',
  'UNKNOWN',
]);
const pausedProjectStatuses = new Set(['INACTIVE', 'PAUSE_FAILED', 'RESTORE_FAILED']);

const globalWakeState = globalThis as typeof globalThis & {
  __studentflowSupabaseWake?: {
    lastRestoreAt: number;
    lastPreflightAt?: number;
    inFlight?: Promise<SupabaseWakeStatus>;
  };
};

function stateStore() {
  globalWakeState.__studentflowSupabaseWake ??= { lastRestoreAt: 0 };
  return globalWakeState.__studentflowSupabaseWake;
}

function wakeConfig() {
  if (process.env.SUPABASE_WAKE_ENABLED === 'false') return undefined;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!projectRef || !accessToken) return undefined;
  return { projectRef, accessToken };
}

async function managementRequest(path: string, init: RequestInit = {}) {
  const config = wakeConfig();
  if (!config) throw new Error('Supabase Management API не налаштовано.');

  return fetch(`${managementBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

async function getProjectStatus() {
  const config = wakeConfig();
  if (!config) return undefined;

  const response = await managementRequest(`/projects/${config.projectRef}`);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Supabase Management API status ${response.status}: ${body || response.statusText}`,
    );
  }

  const project = (await response.json()) as {
    status?: string;
    databases?: Array<{ status?: string }>;
  };
  return project.status ?? project.databases?.[0]?.status ?? 'UNKNOWN';
}

async function requestRestore() {
  const config = wakeConfig();
  if (!config) return false;

  const store = stateStore();
  const now = Date.now();
  if (now - store.lastRestoreAt < restoreCooldownMs) return false;

  store.lastRestoreAt = now;
  const response = await managementRequest(`/projects/${config.projectRef}/restore`, {
    method: 'POST',
  });

  if ([200, 202, 204, 409].includes(response.status)) return true;
  const body = await response.text().catch(() => '');
  if (/no longer|not.*paused|already|restoring|coming_up/i.test(body)) return false;
  throw new Error(
    `Supabase restore request failed ${response.status}: ${body || response.statusText}`,
  );
}

export function shouldAttemptSupabaseWake(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : JSON.stringify(error);
  return /(^|\D)540(\D|$)|paused|inactive|temporarily unavailable|service unavailable|gateway timeout|fetch failed|failed to fetch|network|timeout|ECONNRESET|ENOTFOUND|tenant\/user .* not found|supavisor/i.test(
    text,
  );
}

export function databaseStartingError(
  message = 'База даних StudentFlow запускається. Повторіть запит за кілька секунд.',
) {
  const error = new Error(`STUDENTFLOW_DATABASE_STARTING: ${message}`);
  error.name = 'DatabaseStartingError';
  return error;
}

export function isDatabaseStartingError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'DatabaseStartingError' ||
      error.message.includes('STUDENTFLOW_DATABASE_STARTING'))
  );
}

export async function getSupabaseWakeStatus(
  options: { restoreIfPaused?: boolean } = {},
): Promise<SupabaseWakeStatus> {
  if (!wakeConfig()) {
    return {
      state: 'unconfigured',
      message: 'Автоматичне пробудження Supabase не налаштовано.',
    };
  }

  try {
    const projectStatus = await getProjectStatus();

    if (projectStatus && readyProjectStatuses.has(projectStatus)) {
      return { state: 'ready', projectStatus, message: 'Supabase активна.' };
    }

    if (projectStatus && pausedProjectStatuses.has(projectStatus)) {
      let restoreRequested = false;
      if (options.restoreIfPaused) restoreRequested = await requestRestore();
      return {
        state: 'paused',
        projectStatus,
        restoreRequested,
        message: restoreRequested
          ? 'Надіслано запит на запуск Supabase.'
          : 'Supabase ще запускається або запит уже надсилали нещодавно.',
      };
    }

    if (projectStatus && startingProjectStatuses.has(projectStatus)) {
      return { state: 'starting', projectStatus, message: 'Supabase запускається.' };
    }

    return { state: 'starting', projectStatus, message: 'Очікуємо доступність Supabase.' };
  } catch (error) {
    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'Не вдалося перевірити Supabase.',
    };
  }
}

export async function ensureSupabaseAwake(reason = 'database request') {
  const store = stateStore();
  if (store.inFlight) return store.inFlight;

  store.inFlight = getSupabaseWakeStatus({ restoreIfPaused: true })
    .then((status) => ({ ...status, message: `${status.message} Причина: ${reason}.` }))
    .finally(() => {
      store.inFlight = undefined;
    });

  return store.inFlight;
}

export async function waitForSupabaseReady(reason = 'database request', maxWaitMs = defaultWaitMs) {
  const deadline = Date.now() + maxWaitMs;
  let status = await ensureSupabaseAwake(reason);
  if (status.state === 'ready') return true;

  while (Date.now() + pollMs <= deadline) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    status = await getSupabaseWakeStatus({ restoreIfPaused: true });
    if (status.state === 'ready') return true;
  }

  return false;
}

export async function preflightSupabaseWake() {
  if (!wakeConfig()) return;

  const store = stateStore();
  const now = Date.now();
  if (store.lastPreflightAt && now - store.lastPreflightAt < 60_000) return;

  store.lastPreflightAt = now;
  await getSupabaseWakeStatus({ restoreIfPaused: true }).catch(() => undefined);
}
