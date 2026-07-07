import { QueryFailedError } from 'typeorm';

type MysqlDriverError = { code?: string; errno?: number };

function isMysqlError(error: unknown): error is QueryFailedError & { driverError: MysqlDriverError } {
  return error instanceof QueryFailedError;
}

/**
 * MySQL ER_DUP_ENTRY (errno 1062) — unique constraint violation.
 */
export function isDuplicateEntryError(error: unknown): boolean {
  if (!isMysqlError(error)) return false;
  const { code, errno } = (error.driverError as MysqlDriverError) ?? {};
  return code === 'ER_DUP_ENTRY' || errno === 1062;
}

/**
 * MySQL ER_ROW_IS_REFERENCED_2 (errno 1451) — foreign key constraint violation on delete.
 */
export function isForeignKeyConstraintError(error: unknown): boolean {
  if (!isMysqlError(error)) return false;
  const { code, errno } = (error.driverError as MysqlDriverError) ?? {};
  return code === 'ER_ROW_IS_REFERENCED_2' || errno === 1451;
}
