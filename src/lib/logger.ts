/**
 * Logs debug messages to the console.
 * @param message - The message to log.
 * @param args - Additional arguments.
 */
export function logDebug(message: string, ...args: unknown[]): void {
  console.debug(`[DEBUG] ${message}`, ...args);
}

/**
 * Logs error messages to the console.
 * @param message - The error message.
 * @param args - Additional arguments.
 */
export function logError(message: string, ...args: unknown[]): void {
  console.error(`[ERROR] ${message}`, ...args);
}
