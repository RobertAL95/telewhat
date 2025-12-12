import { apiFetch } from '@/libs/apiClient';

// ===================================================
// 🟢 Generar token de invitación (desde cookie JWT)
// ===================================================
export async function generateInviteToken() {
  const res = await apiFetch('/Invite', {
    method: 'POST',
    credentials: 'include',
  });

  // Tu backend devuelve { body: { link: ... } }
  return res.body?.link;
}

// ===================================================
// 🟢 Validar token de invitación
// ===================================================
export async function validateInviteToken(token: string) {
  try {
    const res = await apiFetch('/invite/accept', {
      method: 'POST',
      body: JSON.stringify({ token, guestName: 'Invitado' }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.body;
  } catch {
    return null;
  }
}

