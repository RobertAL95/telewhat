'use client';

import { useState } from 'react';

export function useChatHeader(onMakeSecret: () => void) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMakeSecretClick = () => {
    setMenuAnchor(null);
    onMakeSecret();
  };

  return {
    menuAnchor,
    handleMenuOpen,
    handleMenuClose,
    handleMakeSecretClick
  };
}