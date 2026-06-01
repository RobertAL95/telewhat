'use client';
import { useState, useEffect, useCallback } from 'react';
import { hashPIN } from '@/utils/crypto';

const GHOST_HASH_KEY = 'flym_ghost_hash';
const SECRET_KEY_SESSION = 'flym_unlocked_key';

export const useGhostMode = () => {
  // Estado para saber si debemos pintar los chats secretos en la lista
  const [isGhostModeUnlocked, setIsGhostModeUnlocked] = useState(false);
  
  // Estado para saber si el usuario ya configuró alguna vez un PIN en este dispositivo
  const [hasGhostSetup, setHasGhostSetup] = useState(false);

  useEffect(() => {
    // Al cargar la app, revisamos si hay una huella (hash) guardada
    const savedHash = localStorage.getItem(GHOST_HASH_KEY);
    setHasGhostSetup(!!savedHash);
  }, []);

  // =========================================================
  // 1. EL DETECTOR DE LA BARRA DE BÚSQUEDA
  // =========================================================
  const checkSearchInput = useCallback(async (searchText: string) => {
    if (!searchText || searchText.length < 4) {
      setIsGhostModeUnlocked(false);
      return false;
    }

    const savedHash = localStorage.getItem(GHOST_HASH_KEY);
    if (!savedHash) return false;

    // Hasheamos lo que el usuario está escribiendo al vuelo
    const currentHash = await hashPIN(searchText);

    if (currentHash === savedHash) {
      console.log('👻 ¡Modo Fantasma Activado!');
      setIsGhostModeUnlocked(true);
      return true;
    }

    setIsGhostModeUnlocked(false);
    return false;
  }, []);

  // =========================================================
  // 2. CONFIGURAR EL PIN POR PRIMERA VEZ (Guardar la Huella)
  // =========================================================
  const setupGhostPin = useCallback(async (pin: string) => {
    const hash = await hashPIN(pin);
    localStorage.setItem(GHOST_HASH_KEY, hash);
    setHasGhostSetup(true);
  }, []);

  // =========================================================
  // 3. BLOQUEAR MANUALMENTE (Cerrar la Bóveda)
  // =========================================================
  const lockGhostMode = useCallback(() => {
    setIsGhostModeUnlocked(false);
    sessionStorage.removeItem(SECRET_KEY_SESSION); // Destruimos la llave de la RAM
    console.log('🔒 Bóveda cerrada por seguridad.');
  }, []);

  return {
    isGhostModeUnlocked,
    hasGhostSetup,
    checkSearchInput,
    setupGhostPin,
    lockGhostMode
  };
};