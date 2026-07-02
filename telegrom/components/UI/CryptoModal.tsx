'use client';

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

import { apiFetch } from '@/libs/apiClient';
import { 
  generateRSAKeyPair, encryptPrivateKeyWithPIN, exportPublicKey, 
  decryptPrivateKeyWithPIN, hashPIN 
} from '@/utils/crypto';
import { useGhostMode } from '@/hooks/useGhostMode';
// 🟢 Importamos el contexto global para usar el dispatch de la llave privada
import { useGlobal } from '@/context/GlobalContext';

type CryptoStep = 'SETUP_PIN' | 'REQUEST_OTP' | 'VERIFY_OTP' | 'UNLOCK_PIN';

interface CryptoModalProps {
  open: boolean;
  step: CryptoStep;
  onClose: () => void;
  onSuccess: () => void; 
}

export default function CryptoModal({ open, step: initialStep, onClose, onSuccess }: CryptoModalProps) {
  const { setupGhostPin } = useGhostMode();
  // 🟢 Extraemos el dispatch global
  const { dispatch } = useGlobal();
  
  const [currentStep, setCurrentStep] = useState<CryptoStep>(initialStep);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [encryptedData, setEncryptedData] = useState<{ encryptedPrivateKey: string, salt: string } | null>(null);

  const handleClose = () => {
    if (loading) return; 
    setPin('');
    setConfirmPin('');
    setOtp('');
    setError(null);
    setCurrentStep(initialStep);
    onClose();
  };

  // =========================================================
  // FLUJO 1: CREAR BÓVEDA (SETUP) - CON MUTADOR DE ENTORNO
  // =========================================================
  const handleSetupVault = async () => {
    if (pin.length !== 4) return setError("El PIN debe ser de 4 dígitos.");
    if (pin !== confirmPin) return setError("Los PINs no coinciden.");
    
    setLoading(true);
    setError(null);

    try {
      // 1. Generar llaves asimétricas
      const keyPair = await generateRSAKeyPair();
      const publicKeyJWK = await exportPublicKey(keyPair.publicKey);
      
      // 2. Cifrar la privada con el PIN y guardar hash para el buscador
      const { encryptedKey, salt } = await encryptPrivateKeyWithPIN(keyPair.privateKey, pin);
      await setupGhostPin(pin);

      // 3. Subir al backend
      await apiFetch('/crypto/setup', {
        method: 'POST',
        body: JSON.stringify({
          publicKey: publicKeyJWK,
          encryptedPrivateKey: encryptedKey,
          salt: salt
        })
      });

      console.log("🔑 Bóveda creada. Inicializando inyección de llave privada RSA...");

      // -----------------------------------------------------------------
      // 🔴 MODO PRODUCCIÓN: Solo inyecta en RAM global (Volátil al cerrar/recargar)
      // Para activar producción estricta, DESCOMENTA las siguientes líneas:
      // -----------------------------------------------------------------
      /*
      dispatch({ type: 'SET_PRIVATE_KEY', payload: keyPair.privateKey });
      */

      // -----------------------------------------------------------------
      // 🧪 MODO BYPASS DE DESARROLLO (ACTIVO): Respalda la llave en texto plano para desarrollo local
      // Para desactivar este comportamiento de persistencia, COMENTA las siguientes líneas:
      // -----------------------------------------------------------------
      dispatch({ type: 'SET_PRIVATE_KEY', payload: keyPair.privateKey });
      const rawKey = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      sessionStorage.setItem('flym_dev_bypass_key', JSON.stringify(rawKey));
      // -----------------------------------------------------------------

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al configurar la bóveda.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FLUJO 2: DESBLOQUEO - PEDIR OTP AL CORREO
  // =========================================================
  const handleRequestOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/crypto/request-unlock', { method: 'POST' });
      setCurrentStep('VERIFY_OTP');
    } catch (err: any) {
      setError(err.message || "Error al solicitar el código.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FLUJO 3: DESBLOQUEO - VERIFICAR OTP Y BAJAR LLAVE ENCRIPTADA
  // =========================================================
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return setError("El código debe tener 6 dígitos.");
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/crypto/verify-unlock', {
        method: 'POST',
        body: JSON.stringify({ otpCode: otp })
      });

      setEncryptedData({
        encryptedPrivateKey: res.encryptedPrivateKey,
        salt: res.salt
      });
      
      setCurrentStep('UNLOCK_PIN');
    } catch (err: any) {
      setError(err.message || "Código inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FLUJO 4: DESBLOQUEO - DESENCRIPTAR CON PIN LOCALMENTE
  // =========================================================
  const handleUnlockWithPin = async () => {
    if (pin.length !== 4) return setError("El PIN debe ser de 4 dígitos.");
    if (!encryptedData) return setError("Faltan datos de encriptación.");

    setLoading(true);
    setError(null);
    try {
      const privateKey = await decryptPrivateKeyWithPIN(
        encryptedData.encryptedPrivateKey, 
        pin, 
        encryptedData.salt
      );

      console.log("🔒 Bóveda desbloqueada con éxito. Llave inyectada en memoria RAM global.");
      dispatch({ type: 'SET_PRIVATE_KEY', payload: privateKey });

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError("PIN incorrecto. No se pudo desencriptar la bóveda.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDERIZADO DEL PASO ACTUAL
  // =========================================================
  const renderContent = () => {
    switch (currentStep) {
      case 'SETUP_PIN':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ bgcolor: '#202c33', color: '#e9edef' }}>
              Crea un PIN de 4 dígitos. Se usará para encriptar tus mensajes. <strong>Si lo olvidas, perderás acceso a los chats secretos.</strong>
            </Alert>
            <TextField label="PIN (4 dígitos)" type="password" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 4))} disabled={loading} fullWidth />
            <TextField label="Confirmar PIN" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))} disabled={loading} fullWidth />
          </Box>
        );
      
      case 'REQUEST_OTP':
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <EmailOutlinedIcon sx={{ fontSize: 48, color: '#00a884', mb: 2 }} />
            <Typography variant="body1" color="#e9edef">
              Para desbloquear la bóveda, enviaremos un código de seguridad a tu correo registrado.
            </Typography>
          </Box>
        );

      case 'VERIFY_OTP':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="#8696a0" align="center">
              Ingresa el código de 6 dígitos que enviamos a tu correo.
            </Typography>
            <TextField label="Código OTP" type="number" value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} disabled={loading} fullWidth />
          </Box>
        );

      case 'UNLOCK_PIN':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <LockOutlinedIcon sx={{ fontSize: 48, color: '#00a884', alignSelf: 'center', mb: 1 }} />
            <Typography variant="body2" color="#8696a0" align="center">
              Autorización exitosa. Ahora ingresa tu PIN para desencriptar la llave.
            </Typography>
            <TextField label="Tu PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 4))} disabled={loading} fullWidth />
          </Box>
        );
    }
  };

  const getActions = () => {
    switch (currentStep) {
      case 'SETUP_PIN': return <Button onClick={handleSetupVault} disabled={loading} variant="contained" color="success">Crear Bóveda</Button>;
      case 'REQUEST_OTP': return <Button onClick={handleRequestOTP} disabled={loading} variant="contained" color="success">Enviar Código</Button>;
      case 'VERIFY_OTP': return <Button onClick={handleVerifyOTP} disabled={loading} variant="contained" color="success">Verificar Código</Button>;
      case 'UNLOCK_PIN': return <Button onClick={handleUnlockWithPin} disabled={loading} variant="contained" color="success">Desbloquear</Button>;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { bgcolor: '#111b21', color: '#e9edef', minWidth: 320 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid #2a3942', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <VpnKeyOutlinedIcon sx={{ color: '#00a884' }} /> 
          {currentStep === 'SETUP_PIN' ? 'Configurar Bóveda' : 'Desbloquear Bóveda'}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #2a3942' }}>
        <Button onClick={handleClose} disabled={loading} sx={{ color: '#8696a0' }}>Cancelar</Button>
        <Box sx={{ position: 'relative' }}>
          {getActions()}
          {loading && <CircularProgress size={24} sx={{ color: '#00a884', position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
        </Box>
      </DialogActions>
    </Dialog>
  );
}