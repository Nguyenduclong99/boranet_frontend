"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginBody, LoginBodyType } from "@/schemaValidations/auth.schema";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/app-provider";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface LoginResponse {
    accessToken: string;
    tokenType: string;
    user: any;
    roles: string[];
}

const LoginForm = () => {
    const [loading, setLoading] = useState(false);
    const { setUser, setRoles } = useAppContext();
    const { toast } = useToast();
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
        try {
            const response = await fetch(API_LOGIN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errorData = await response.json();
                toast({
                    variant: "destructive",
                    title: "Đăng nhập thất bại",
                    description: errorData.message || "Đã có lỗi xảy ra khi đăng nhập.",
                });
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
            toast({ description: "Đăng nhập thành công" });
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
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Đăng nhập thất bại",
                description: error.message || "Đã có lỗi xảy ra khi đăng nhập.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="usernameOrEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email hoặc Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập email hoặc username" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mật khẩu</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default LoginForm;