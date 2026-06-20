import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseRecoveryMode } from '../src/lib/database-recovery';

test('uses the database status when Next redacts a database-starting server error', () => {
  const redactedProductionError = new Error(
    'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.',
  );

  assert.equal(
    databaseRecoveryMode(redactedProductionError, {
      state: 'starting',
      message: 'Supabase запускається.',
    }),
    'database-starting',
  );
});

test('keeps the standard error view when the database is already ready', () => {
  const redactedProductionError = new Error(
    'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.',
  );

  assert.equal(
    databaseRecoveryMode(redactedProductionError, { state: 'ready', message: 'Supabase активна.' }),
    'generic-error',
  );
});
