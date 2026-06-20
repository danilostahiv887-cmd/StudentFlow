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

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Не задано ${name}. Заповніть .env перед запуском Supabase-версії StudentFlow.`);
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
  const { data, error } = await supabaseAdmin().from(table).select('*');
  if (error) throw new Error(`Supabase read ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function readDatabase(): Promise<DatabaseSnapshot> {
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

export async function insertRow<T extends { id: string }>(table: TableName, row: T) {
  const { error } = await supabaseAdmin().from(table).insert(row);
  if (error) throw new Error(`Supabase insert ${table}: ${error.message}`);
}

export async function upsertRow<T extends { id: string }>(table: TableName, row: T) {
  const { error } = await supabaseAdmin().from(table).upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Supabase upsert ${table}: ${error.message}`);
}

export async function updateRow(table: TableName, id: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin().from(table).update(patch).eq('id', id);
  if (error) throw new Error(`Supabase update ${table}: ${error.message}`);
}

export async function deleteRow(table: TableName, id: string) {
  const { error } = await supabaseAdmin().from(table).delete().eq('id', id);
  if (error) throw new Error(`Supabase delete ${table}: ${error.message}`);
}

export async function deleteWhere(table: TableName, column: string, value: string) {
  const { error } = await supabaseAdmin().from(table).delete().eq(column, value);
  if (error) throw new Error(`Supabase delete ${table}.${column}: ${error.message}`);
}

export async function replaceDatabase(snapshot: DatabaseSnapshot) {
  for (const table of childFirst) {
    const { error } = await supabaseAdmin().from(table).delete().neq('id', '__never__');
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
    const { error } = await supabaseAdmin().from(table).insert(rows[table]);
    if (error) throw new Error(`Supabase seed ${table}: ${error.message}`);
  }
}
