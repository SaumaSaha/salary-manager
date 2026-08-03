import { describe, it, expect } from 'vitest';
import { handleResponse } from './client';

describe('Client Service (`services/client.ts`)', () => {
  it('returns parsed json on successful response', async () => {
    const mockData = { id: 1, name: 'Test' };
    const response = new Response(JSON.stringify(mockData), { status: 200 });

    const data = await handleResponse<typeof mockData>(response);
    expect(data).toEqual(mockData);
  });

  it('throws error with detail message on non-ok response', async () => {
    const errorBody = { detail: 'Invalid parameters provided' };
    const response = new Response(JSON.stringify(errorBody), { status: 400 });

    await expect(handleResponse(response)).rejects.toThrow('Invalid parameters provided');
  });

  it('throws error with default fallback when response body is not json', async () => {
    const response = new Response('Internal Server Error Text', { status: 500 });

    await expect(handleResponse(response)).rejects.toThrow('An unexpected error occurred');
  });

  it('throws error with HTTP status when error detail is missing', async () => {
    const response = new Response(JSON.stringify({}), { status: 403 });

    await expect(handleResponse(response)).rejects.toThrow('HTTP Error 403');
  });
});
