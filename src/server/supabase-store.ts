import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Activity,
  Application,
  Badge,
  Category,
  Club,
  DatabaseSnapshot,
  Group,
  MediaAsset,
  ParticipationReport,
  Profile,
  Speciality,
  StudentBadge,
} from '@/types/entities';
import {
  databaseStartingError,
  shouldAttemptSupabaseWake,
  waitForSupabaseReady,
} from '@/server/supabase-wake';

type TableName =
  | 'profiles'
  | 'groups'
  | 'specialities'
  | 'mediaAssets'
  | 'clubs'
  | 'categories'
  | 'activities'
  | 'applications'
  | 'reports'
  | 'badges'
  | 'studentBadges';

const tableOrder: TableName[] = [
  'specialities',
  'groups',
  'profiles',
  'mediaAssets',
  'categories',
  'clubs',
  'activities',
  'applications',
  'reports',
  'badges',
  'studentBadges',
];

const childFirst: TableName[] = [
  'studentBadges',
  'reports',
  'applications',
  'activities',
  'badges',
  'clubs',
  'categories',
  'groups',
  'mediaAssets',
  'specialities',
  'profiles',
];

let cached: SupabaseClient | undefined;

type DatabaseRows = Record<TableName, Array<{ id: string }>>;

const globalDatabaseState = globalThis as typeof globalThis & {
  __studentflowDatabaseCache?: {
    snapshot?: DatabaseSnapshot;
    expiresAt: number;
    inFlight?: Promise<DatabaseSnapshot>;
    writeChain?: Promise<void>;
  };
};

function databaseState() {
  globalDatabaseState.__studentflowDatabaseCache ??= { expiresAt: 0 };
  return globalDatabaseState.__studentflowDatabaseCache;
}

function databaseCacheTtlMs() {
  const configured = Number(process.env.STUDENTFLOW_DATABASE_CACHE_TTL_MS ?? 15_000);
  return Number.isFinite(configured) ? Math.max(0, configured) : 15_000;
}

function cloneDatabase(snapshot: DatabaseSnapshot) {
  return structuredClone(snapshot);
}

function snapshotRows(snapshot: DatabaseSnapshot): DatabaseRows {
  return {
    profiles: snapshot.profiles,
    groups: snapshot.groups,
    specialities: snapshot.specialities,
    mediaAssets: snapshot.mediaAssets,
    clubs: snapshot.clubs,
    categories: snapshot.categories,
    activities: snapshot.activities,
    applications: snapshot.applications,
    reports: snapshot.reports,
    badges: snapshot.badges,
    studentBadges: snapshot.studentBadges,
  };
}

function storeDatabaseSnapshot(snapshot: DatabaseSnapshot) {
  const state = databaseState();
  state.snapshot = cloneDatabase(snapshot);
  state.expiresAt = Date.now() + databaseCacheTtlMs();
}

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Не задано ${name}. Заповніть .env перед запуском Supabase-версії StudentFlow.`,
    );
  }
  return value;
}

export function supabaseAdmin() {
  if (!cached) {
    cached = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

async function selectAll<T>(table: TableName) {
  const { data, error } = await runSupabaseQuery(`read ${table}`, () =>
    supabaseAdmin().from(table).select('*'),
  );
  if (error) throw new Error(`Supabase read ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

async function runSupabaseQuery<T extends { error: unknown }>(
  label: string,
  operation: () => PromiseLike<T>,
) {
  const retryAfterWake = async () => {
    if (!(await waitForSupabaseReady(label))) throw databaseStartingError();

    try {
      const retried = await operation();
      if (retried.error && shouldAttemptSupabaseWake(retried.error)) {
        throw databaseStartingError();
      }
      return retried;
    } catch (error) {
      if (shouldAttemptSupabaseWake(error)) throw databaseStartingError();
      throw error;
    }
  };

  let result: T;
  try {
    result = await operation();
  } catch (error) {
    if (!shouldAttemptSupabaseWake(error)) throw error;
    return retryAfterWake();
  }

  if (!result.error || !shouldAttemptSupabaseWake(result.error)) return result;
  return retryAfterWake();
}

async function loadDatabase(): Promise<DatabaseSnapshot> {
  const [
    profiles,
    specialities,
    groups,
    mediaAssets,
    clubs,
    categories,
    activities,
    applications,
    reports,
    badges,
    studentBadges,
  ] = await Promise.all([
    selectAll<Profile>('profiles'),
    selectAll<Speciality>('specialities'),
    selectAll<Group>('groups'),
    selectAll<MediaAsset>('mediaAssets'),
    selectAll<Club>('clubs'),
    selectAll<Category>('categories'),
    selectAll<Activity>('activities'),
    selectAll<Application>('applications'),
    selectAll<ParticipationReport>('reports'),
    selectAll<Badge>('badges'),
    selectAll<StudentBadge>('studentBadges'),
  ]);

  return {
    profiles,
    specialities,
    groups,
    mediaAssets,
    clubs,
    categories,
    activities,
    applications,
    reports,
    badges,
    studentBadges,
  };
}

export async function readDatabase() {
  const state = databaseState();

  if (state.snapshot && state.expiresAt > Date.now()) return cloneDatabase(state.snapshot);

  state.inFlight ??= loadDatabase()
    .then((snapshot) => {
      storeDatabaseSnapshot(snapshot);
      return databaseState().snapshot!;
    })
    .finally(() => {
      databaseState().inFlight = undefined;
    });

  return cloneDatabase(await state.inFlight);
}

export async function insertRow<T extends { id: string }>(table: TableName, row: T) {
  const { error } = await runSupabaseQuery(`insert ${table}`, () =>
    supabaseAdmin().from(table).insert(row),
  );
  if (error) throw new Error(`Supabase insert ${table}: ${error.message}`);
}

export async function upsertRow<T extends { id: string }>(table: TableName, row: T) {
  const { error } = await runSupabaseQuery(`upsert ${table}`, () =>
    supabaseAdmin().from(table).upsert(row, { onConflict: 'id' }),
  );
  if (error) throw new Error(`Supabase upsert ${table}: ${error.message}`);
}

export async function updateRow(table: TableName, id: string, patch: Record<string, unknown>) {
  const { error } = await runSupabaseQuery(`update ${table}`, () =>
    supabaseAdmin().from(table).update(patch).eq('id', id),
  );
  if (error) throw new Error(`Supabase update ${table}: ${error.message}`);
}

export async function deleteRow(table: TableName, id: string) {
  const { error } = await runSupabaseQuery(`delete ${table}`, () =>
    supabaseAdmin().from(table).delete().eq('id', id),
  );
  if (error) throw new Error(`Supabase delete ${table}: ${error.message}`);
}

export async function deleteWhere(table: TableName, column: string, value: string) {
  const { error } = await runSupabaseQuery(`delete ${table}.${column}`, () =>
    supabaseAdmin().from(table).delete().eq(column, value),
  );
  if (error) throw new Error(`Supabase delete ${table}.${column}: ${error.message}`);
}

export async function syncDatabase(snapshot: DatabaseSnapshot) {
  const state = databaseState();
  const run = (state.writeChain ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const previous = state.snapshot ? cloneDatabase(state.snapshot) : await loadDatabase();
      const previousRows = snapshotRows(previous);
      const nextRows = snapshotRows(snapshot);

      for (const table of childFirst) {
        const nextIds = new Set(nextRows[table].map((row) => row.id));
        const deletedIds = previousRows[table]
          .filter((row) => !nextIds.has(row.id))
          .map((row) => row.id);
        if (!deletedIds.length) continue;

        const { error } = await runSupabaseQuery(`delete changed ${table}`, () =>
          supabaseAdmin().from(table).delete().in('id', deletedIds),
        );
        if (error) throw new Error(`Supabase delete ${table}: ${error.message}`);
      }

      for (const table of tableOrder) {
        const previousById = new Map(previousRows[table].map((row) => [row.id, row]));
        const changedRows = nextRows[table].filter(
          (row) => JSON.stringify(previousById.get(row.id)) !== JSON.stringify(row),
        );
        if (!changedRows.length) continue;

        const { error } = await runSupabaseQuery(`sync ${table}`, () =>
          supabaseAdmin().from(table).upsert(changedRows, { onConflict: 'id' }),
        );
        if (error) throw new Error(`Supabase sync ${table}: ${error.message}`);
      }

      storeDatabaseSnapshot(snapshot);
    });

  state.writeChain = run;
  try {
    await run;
  } finally {
    if (state.writeChain === run) state.writeChain = undefined;
  }
}

export async function replaceDatabase(snapshot: DatabaseSnapshot) {
  for (const table of childFirst) {
    const { error } = await runSupabaseQuery(`clear ${table}`, () =>
      supabaseAdmin().from(table).delete().neq('id', '__never__'),
    );
    if (error) throw new Error(`Supabase clear ${table}: ${error.message}`);
  }

  const rows: Record<TableName, unknown[]> = {
    profiles: snapshot.profiles,
    specialities: snapshot.specialities,
    groups: snapshot.groups,
    mediaAssets: snapshot.mediaAssets,
    clubs: snapshot.clubs,
    categories: snapshot.categories,
    activities: snapshot.activities,
    applications: snapshot.applications,
    reports: snapshot.reports,
    badges: snapshot.badges,
    studentBadges: snapshot.studentBadges,
  };

  for (const table of tableOrder) {
    if (!rows[table].length) continue;
    const { error } = await runSupabaseQuery(`seed ${table}`, () =>
      supabaseAdmin().from(table).insert(rows[table]),
    );
    if (error) throw new Error(`Supabase seed ${table}: ${error.message}`);
  }

  storeDatabaseSnapshot(snapshot);
}
