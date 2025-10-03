import type { RequestError } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export async function request<T = unknown>(path: string, init: RequestInit & { body?: unknown } = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;
  const headers = new Headers(init.headers);
  let body = init.body;

  if (body !== undefined && !(body instanceof FormData) && typeof body !== 'string') {
    body = JSON.stringify(body);
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers, body });
  const text = await response.text();
  let payload: unknown = undefined;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = text;
    }
  }

  if (!response.ok) {
    const err = new Error('Request failed') as RequestError;
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload as T;
}
