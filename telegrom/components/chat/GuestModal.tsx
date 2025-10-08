'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

type Props = {
  onConfirm: (name: string) => void;
};

export default function GuestModal({ onConfirm }: Props) {
  const [name, setName] = useState('');

  return (
    <Dialog open fullWidth maxWidth="xs">
      <DialogTitle>Bienvenido Invitado</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Coloca tu nombre aquí"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onConfirm(name.trim())}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
