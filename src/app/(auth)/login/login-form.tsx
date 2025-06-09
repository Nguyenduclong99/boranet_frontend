"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, TextField, Typography, Container, Box, Alert, Link as MuiLink } from '@mui/material';
import Cookies from "js-cookie";
import { LoginBody, LoginBodyType } from "@/schemaValidations/auth.schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/app-provider";
import { jwtDecode, JwtPayload } from "jwt-decode";
import Link from 'next/link';

interface LoginResponse {
    accessToken: string;
    tokenType: string;
    user: any;
    roles: string[];
}

const LoginForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { setUser, setRoles } = useAppContext();
    const router = useRouter();

    const form = useForm<LoginBodyType>({
        resolver: zodResolver(LoginBody),
        defaultValues: {
            usernameOrEmail: "",
            password: "",
        },
    });

    const API_LOGIN_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
        ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/signin`
        : "http://localhost:8081/api/auth/signin";

    const API_OVERDUE_JOBS_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
        ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/jobs/overdue`
        : "http://localhost:8081/api/jobs/overdue";

    async function onSubmit(values: LoginBodyType) {
        if (loading) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(API_LOGIN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || "Something went wrong during login.");
                throw new Error(errorData.message || "Login failed");
            }

            const data: LoginResponse = await response.json();
            const { accessToken, roles } = data;

            const decodedToken = jwtDecode<JwtPayload>(accessToken);
            const expiresAt = decodedToken.exp ? decodedToken.exp * 1000 : null;

            Cookies.set("accessToken", accessToken, { expires: 1 });
            if (expiresAt) {
                Cookies.set("accessTokenExpiresAt", String(expiresAt), { expires: 1 });
            }
            if (data.user) {
                setUser(data.user);
            }
            if (roles && roles.length > 0) {
                setRoles(roles);
                Cookies.set("userRoles", JSON.stringify(roles), { expires: 1 });
            }
            setSuccess("Login successful!");

            try {
                const overdueResponse = await fetch(API_OVERDUE_JOBS_URL, {
                    headers: {
                        Authorization: `Bearer ${data.accessToken}`,
                    },
                });
                if (!overdueResponse.ok) {
                    console.error(
                        "Failed to fetch overdue jobs:",
                        await overdueResponse.json()
                    );
                    router.push("/");
                    return;
                }
                const overdueData = await overdueResponse.json();
                if (overdueData && overdueData.length > 0) {
                    localStorage.setItem("overdueJobs", JSON.stringify(overdueData));
                    router.push("/jobs/over-due-date");
                } else {
                    router.push("/");
                }
            } catch (error) {
                console.error("Error checking overdue jobs:", error);
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

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
                    Login
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

                <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="usernameOrEmail"
                        label="Email or Username"
                        name="usernameOrEmail"
                        autoComplete="username"
                        {...form.register("usernameOrEmail")}
                        error={!!form.formState.errors.usernameOrEmail}
                        helperText={form.formState.errors.usernameOrEmail?.message}
                        autoFocus
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        {...form.register("password")}
                        error={!!form.formState.errors.password}
                        helperText={form.formState.errors.password?.message}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, bgcolor: 'black', '&:hover': { bgcolor: '#333333' } }}
                        disabled={loading}
                    >
                        {loading ? "Logging In..." : "Login"}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2">
                            Don't have an account?{' '}
                            <Link href="/register" passHref legacyBehavior>
                                <MuiLink component="span" variant="body2" sx={{ cursor: 'pointer' }}>
                                    Sign Up here
                                </MuiLink>
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginForm;