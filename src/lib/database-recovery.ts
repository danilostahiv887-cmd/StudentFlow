export type DatabaseStatus = {
  state: 'ready' | 'starting' | 'paused' | 'unconfigured' | 'error';
  projectStatus?: string;
  message: string;
  restoreRequested?: boolean;
};

export type DatabaseRecoveryMode = 'checking' | 'database-starting' | 'generic-error';

export function databaseRecoveryMode(error: Pick<Error, 'name' | 'message'>, status?: DatabaseStatus): DatabaseRecoveryMode {
  if (error.name === 'DatabaseStartingError' || error.message.includes('STUDENTFLOW_DATABASE_STARTING')) return 'database-starting';
  if (!status) return 'checking';
  return status.state === 'starting' || status.state === 'paused' ? 'database-starting' : 'generic-error';
}
