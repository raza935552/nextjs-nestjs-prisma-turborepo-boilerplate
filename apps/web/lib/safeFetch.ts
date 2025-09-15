import z, { ZodSchema } from 'zod';
import { env } from './env';

/**
 * Fetch data from API and validate the response using a Zod schema.
 *
 * @template T - Zod schema type
 * @param {T} schema - Zod schema to validate the response data
 * @param {URL | RequestInfo} url - API endpoint (relative to env.API_URL)
 * @param {RequestInit} [init] - Optional fetch init options
 * @returns {Promise<[string | null, z.TypeOf<T> | null]>} - Returns a tuple of [errorMessage, validatedData]
 */
export const safeFetch = async <T extends ZodSchema<unknown>>(
  schema: T,
  url: URL | RequestInfo,
  init?: RequestInit,
): Promise<[string | null, z.TypeOf<T>]> => {
  const fullUrl = `${env.API_URL}${url}`;
  const response: Response = await fetch(fullUrl, init);

  const contentType = response.headers.get('content-type') || '';
  let data: unknown = null;
  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Return helpful error when server returned HTML (e.g., 404 page)
      if (!response.ok) {
        return [
          `Request failed (${response.status}). Non-JSON response from ${fullUrl}`,
          null as any,
        ];
      }
      // Attempt to parse text as JSON if possible, or return validation error
      try {
        data = JSON.parse(text);
      } catch {
        return [
          `Unexpected non-JSON response from ${fullUrl}`,
          null as any,
        ];
      }
    }
  } catch (e) {
    return [
      `Failed to read response from ${fullUrl}: ${(e as Error).message}`,
      null as any,
    ];
  }

  if (!response.ok) {
    const msg = (data as any)?.message ?? `Request failed (${response.status})`;
    return [msg, null as any];
  }

  const validateFields = schema.safeParse(data);

  if (!validateFields.success) {
    console.log(data);
    console.log('Validation errors:', validateFields.error);
    return [`Validation error: ${validateFields.error.message}`, null];
  }

  return [null, validateFields.data];
};
