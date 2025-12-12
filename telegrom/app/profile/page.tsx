'use client';
import { Box } from '@mui/material';
import ProfileView from '@/components/profile/profileView';

export default function ProfilePage() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <ProfileView />
    </Box>
  );
}
