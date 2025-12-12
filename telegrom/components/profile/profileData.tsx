import { apiFetch } from '@/libs/apiClient';

export async function getUserProfile() {
  const res = await apiFetch('/auth/profile', {
    method: 'GET',
  });
  return res.body;
}
