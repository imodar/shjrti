/**
 * Lightweight logger.
 *
 * - In development (import.meta.env.DEV): forwards to console with level prefix.
 * - In production: silences `debug`/`info`/`log` to reduce noise & avoid leaking
 *   internal data, but keeps `warn` and `error` so real issues remain visible
 *   (and can be picked up later by Sentry / a remote sink).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.debug("payload", data);
 *   logger.error("failed to save member", err);
 */

type LogArgs = unknown[];

const isDev =
  typeof import.meta !== "undefined" &&
  // Vite injects this; fall back to false for safety.
  Boolean((import.meta as any)?.env?.DEV);

function emit(
  level: "debug" | "info" | "log" | "warn" | "error",
  args: LogArgs,
) {
  if (!isDev && (level === "debug" || level === "info" || level === "log")) {
    return;
  }
  // eslint-disable-next-line no-console
  (console[level] as (...a: LogArgs) => void)(...args);
}

export const logger = {
  debug: (...args: LogArgs) => emit("debug", args),
  info: (...args: LogArgs) => emit("info", args),
  log: (...args: LogArgs) => emit("log", args),
  warn: (...args: LogArgs) => emit("warn", args),
  error: (...args: LogArgs) => emit("error", args),
};

export default logger;