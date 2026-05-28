import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { useAuthConfig } from '../context/AuthConfigContext';

interface AuthContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Container component that wraps auth forms with branding and loading states.
 * Responsive layout that works on mobile and desktop.
 */
export function AuthContainer({ children, title, subtitle }: AuthContainerProps) {
  const { branding, isLoading, error } = useAuthConfig();

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress aria-label="Loading authentication" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        py={4}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Branding */}
          {branding.logoUrl && (
            <Box display="flex" justifyContent="center" mb={2}>
              <img
                src={branding.logoUrl}
                alt={`${branding.appName} logo`}
                style={{ maxHeight: 48, objectFit: 'contain' }}
              />
            </Box>
          )}

          <Typography
            variant="h5"
            component="h1"
            textAlign="center"
            fontWeight={600}
            gutterBottom
          >
            {title || branding.appName}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              {subtitle}
            </Typography>
          )}

          {children}
        </Paper>
      </Box>
    </Container>
  );
}
