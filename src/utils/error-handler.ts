import { isAxiosError } from "@/lib/axios";

type ErrorRecord = Record<string, string | string[]>;
type ErrorItem = { message?: string } | string;

interface ErrorResponseData {
  message?: string;
  error?: string;
  detail?: string;
  errors?: ErrorItem[] | ErrorRecord;
}

export function extractErrorMessage(
  err: unknown,
  fallback = "Something went wrong"
): string {
  // Axios-specific handling
  if (isAxiosError(err)) {
    // Network/timeout errors (no server response)
    if (!err.response) {
      if (err.code === "ECONNABORTED") {
        return "Request timed out. Please try again.";
      }
      return "Network error. Check your connection and try again.";
    }

    // Server responded with a payload
    const data = err.response.data as unknown as ErrorResponseData;

    // 1) Direct string fields
    const direct = data?.message ?? data?.error ?? data?.detail ?? err.message;
    if (typeof direct === "string" && direct.trim()) return direct;

    // 2) Array of errors with message fields
    if (Array.isArray(data?.errors)) {
      const firstWithMessage = data.errors.find(
        (e): e is { message: string } =>
          typeof (e as { message?: string })?.message === "string"
      );
      if (firstWithMessage?.message) return firstWithMessage.message;

      const joined = data.errors
        .map((e) => {
          if (typeof e === "string") return e;
          if ("message" in e && typeof e.message === "string") return e.message;
          return "";
        })
        .filter(Boolean)
        .join(", ");
      if (joined) return joined;
    }

    // 3) Field error map
    if (
      data?.errors &&
      typeof data.errors === "object" &&
      !Array.isArray(data.errors)
    ) {
      const parts: string[] = [];
      for (const [field, val] of Object.entries(data.errors)) {
        if (Array.isArray(val)) {
          parts.push(`${field}: ${val.join(", ")}`);
        } else if (typeof val === "string") {
          parts.push(`${field}: ${val}`);
        }
      }
      if (parts.length) return parts.join(" | ");
    }

    // 4) Fallback to status text
    if (err.response.statusText) return err.response.statusText;
  }

  // Non-Axios errors
  if (err instanceof Error && err.message) return err.message;

  return fallback;
}

/**
 * Optionally expose the HTTP status for conditional UI (e.g., 401 -> redirect).
 */
export function getErrorStatus(err: unknown): number | undefined {
  if (isAxiosError(err)) return err.response?.status;
  return undefined;
}

/**
 * Useful when you want all messages (for forms), not just the first.
 */
export function extractAllErrorMessages(err: unknown): string[] {
  const messages: string[] = [];

  if (isAxiosError(err)) {
    if (!err.response) {
      if (err.code === "ECONNABORTED")
        return ["Request timed out. Please try again."];
      return ["Network error. Check your connection and try again."];
    }

    const data = err.response.data as unknown as ErrorResponseData;

    if (typeof data?.message === "string") messages.push(data.message);
    if (typeof data?.error === "string") messages.push(data.error);
    if (typeof data?.detail === "string") messages.push(data.detail);

    if (Array.isArray(data?.errors)) {
      for (const e of data.errors) {
        if (typeof e === "string") messages.push(e);
        else if (typeof e.message === "string") messages.push(e.message);
      }
    } else if (
      data?.errors &&
      typeof data.errors === "object" &&
      !Array.isArray(data.errors)
    ) {
      for (const [field, val] of Object.entries(data.errors)) {
        if (Array.isArray(val)) messages.push(`${field}: ${val.join(", ")}`);
        else if (typeof val === "string") messages.push(`${field}: ${val}`);
      }
    }
  } else if (err instanceof Error && err.message) {
    messages.push(err.message);
  }

  return messages.length ? messages : ["Something went wrong"];
}
