/**
 * Reads a value from the environment (.env file locally, secrets on CI).
 * Fails with a clear message instead of letting a test type "undefined" into a form.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it to your .env file (see .env.example).`,
    );
  }
  return value;
}
