'use client';

import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FilePreviewProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onClear: () => void;
}

export function FilePreview({ selectedFile, previewUrl, onClear }: FilePreviewProps) {
  if (!selectedFile) return null;
  return (
    <Box sx={{ p: 2, bgcolor: '#182229', borderTop: '1px solid #2a3942', display: 'flex', justifyContent: 'center' }}>
      <IconButton onClick={onClear} sx={{ color: '#8696a0' }}><CloseIcon /></IconButton>
      {selectedFile.type.startsWith('image/') && <img src={previewUrl!} alt="preview" style={{ maxHeight: 150, borderRadius: 8 }} />}
    </Box>
  );
}