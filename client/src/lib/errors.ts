import axios from 'axios';

type ErrorPayload = { error?: { message?: string } | string } | undefined;

/** Extracts a human-readable message from an API error (envelope or raw). */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorPayload;
    const serverMessage = data?.error;
    if (typeof serverMessage === 'string') return serverMessage;
    if (serverMessage?.message) return serverMessage.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
