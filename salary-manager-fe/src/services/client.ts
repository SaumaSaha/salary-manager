export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'An unexpected error occurred' }));
    throw new Error(errorData.detail || `HTTP Error ${res.status}`);
  }
  return res.json();
}
