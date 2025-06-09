"use client";

import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Container, Box, Alert, Link as MuiLink } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface VerifyCodeResponse {
  success: boolean;
  message: string;
}

const VerifyEmailPage = () => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get('email');

  const API_VERIFY_CODE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/verify-account`
    : "http://localhost:8081/api/auth/verify-account";

  useEffect(() => {
    if (!userEmail) {
      setError("Email not found. Please register again.");
    }
  }, [userEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const validateCode = () => {
    if (!verificationCode) {
      return "Verification code is required.";
    }
    if (verificationCode.length !== 6) {
      return "Verification code must be 6 digits.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!userEmail) {
      setError("Email is missing. Cannot verify account.");
      setLoading(false);
      return;
    }

    const validationError = validateCode();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_VERIFY_CODE_URL}?email=${encodeURIComponent(userEmail)}&code=${encodeURIComponent(verificationCode)}`, {
        method: 'POST',
      });

      const data: VerifyCodeResponse = await response.json();

      if (!response.ok) {
        setError(data.message || 'Verification failed. Please try again.');
      } else {
        setSuccess(data.message || 'Email verified successfully! You can now log in.');
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Verify Your Email
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          A 6-digit verification code has been sent to {userEmail || "your email address"}. Please enter it below.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="verificationCode"
            label="Verification Code"
            name="verificationCode"
            type="text"
            inputProps={{ maxLength: 6, pattern: "[0-9]*" }}
            value={verificationCode}
            onChange={handleChange}
            autoFocus
            disabled={!userEmail} // Disable input if email is not found
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, bgcolor: 'black', '&:hover': { bgcolor: '#333333' } }}
            disabled={loading || !userEmail}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Didn't receive the code?{' '}
              <Link href="/resend-code" passHref legacyBehavior>
                <MuiLink component="span" variant="body2" sx={{ cursor: 'pointer' }}>
                  Resend code
                </MuiLink>
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Link href="/login" passHref legacyBehavior>
                <MuiLink component="span" variant="body2" sx={{ cursor: 'pointer' }}>
                  Go back to login
                </MuiLink>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default VerifyEmailPage;