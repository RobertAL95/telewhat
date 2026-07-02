'use client';

// 🟢 MEJOR PRÁCTICA: Importar React explícitamente para asegurar que SWC 
// identifique el token JSX en subcomponentes modulares independientes.
import React, { JSX } from 'react';
import { Box, TextField, IconButton, Tooltip, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

interface ChatInputAreaProps {
  isRecording: boolean;
  recordingTime: number;
  input: string;
  selectedFile: File | null;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onStopRecording: () => void;
}

// 🟢 MEJOR PRÁCTICA: Declarar el tipo de retorno explícito : JSX.Element
export function ChatInputArea({
  isRecording, recordingTime, input, selectedFile, isUploading, fileInputRef,
  onFileSelect, onInputChange, onSend, onStartRecording, onCancelRecording, onStopRecording
}: ChatInputAreaProps): JSX.Element {
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ bgcolor: '#202c33', px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
      {!isRecording ? (
        <React.Fragment>
          <Tooltip title="Adjuntar">
            <IconButton sx={{ color: "#8696a0", mr: 1 }} onClick={() => fileInputRef.current?.click()}>
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={onFileSelect} 
            accept="image/*,video/*,audio/*" 
          />
          
          <TextField 
            fullWidth 
            size="small" 
            placeholder="Escribe un mensaje" 
            value={input} 
            onChange={(e) => onInputChange(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onSend()} 
            sx={{ mr: 1, '& .MuiOutlinedInput-root': { bgcolor: '#2a3942', borderRadius: 2, color: '#e9edef', '& fieldset': { border: 'none' } } }} 
          />
          
          {input.trim() || selectedFile ? (
            <IconButton onClick={onSend} disabled={isUploading} sx={{ color: '#fff', bgcolor: '#00a884' }}>
              <SendIcon />
            </IconButton>
          ) : (
            <IconButton onClick={onStartRecording} sx={{ color: '#fff', bgcolor: '#00a884' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </IconButton>
          )}
        </React.Fragment>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#2a3942', borderRadius: 2, px: 2, py: 0.5 }}>
          <Typography sx={{ color: '#e9edef' }}>{formatTime(recordingTime)}</Typography>
          <Box>
            <IconButton onClick={onCancelRecording} sx={{ color: '#8696a0' }}>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={onStopRecording} sx={{ color: '#fff', bgcolor: '#00a884' }}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}