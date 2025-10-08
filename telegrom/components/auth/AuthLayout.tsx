'use client';

import { Box, Card, CardContent, Typography, Alert, Skeleton } from "@mui/material";
import { ReactNode } from "react";
import { useAppPhase } from '../../context/AppPhaseContext';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  error?: string | null;
}

export default function AuthLayout({ children, title, error }: AuthLayoutProps) {
  const { phase } = useAppPhase();

  const showSkeleton = phase === 'loading' || phase === 'skeleton';

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f8fa",
        px: 2,
      }}
    >
      <Card sx={{ width: 400, p: 2, borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          {showSkeleton ? (
            <>
              <Skeleton variant="text" height={50} sx={{ mb: 3 }} animation="wave" />
              <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} animation="wave" />
              <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} animation="wave" />
              <Skeleton variant="rectangular" height={40} sx={{ mb: 3 }} animation="wave" />
              <Skeleton variant="rectangular" height={36} sx={{ mb: 1 }} animation="wave" />
              <Skeleton variant="rectangular" height={36} animation="wave" />
            </>
          ) : (
            <>
              {title && (
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ textAlign: "center", mb: 3 }}
                >
                  {title}
                </Typography>
              )}

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {children}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
