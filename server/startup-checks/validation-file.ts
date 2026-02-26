/**
 * Startup check для файла валидации адресов.
 * Перенесено из scripts/startup-checks/validation-file.mjs в TypeScript.
 */

import { promises as fs } from 'fs';

const isValidValidationFile = (data: unknown): boolean => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'addresses' in data &&
    Array.isArray((data as { addresses: unknown }).addresses) &&
    (data as { addresses: unknown[] }).addresses.every(
      (addr) => typeof addr === 'string',
    )
  );
};

export const startupCheckValidationFile = async (
  filePath: string,
): Promise<void> => {
  if (!filePath) {
    console.info(
      '[startupCheckValidationFile] No VALIDATION_FILE_PATH — skipping check',
    );
    return;
  }

  try {
    await fs.stat(filePath);
  } catch {
    console.error(`[startupCheckValidationFile] File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = await fs.readFile(filePath, 'utf8');

  if (raw.trim() === '') {
    console.info(
      '[startupCheckValidationFile] Empty file — valid (0 addresses)',
    );
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(
      `[startupCheckValidationFile] Invalid JSON: ${(err as Error).message}`,
    );
    process.exit(1);
  }

  if (!isValidValidationFile(parsed)) {
    console.error(
      '[startupCheckValidationFile] Invalid format. Expected: { addresses: string[] }',
    );
    process.exit(1);
  }

  const count = (parsed as { addresses: string[] }).addresses.length;
  console.info(`[startupCheckValidationFile] OK — ${count} addresses loaded`);
};
