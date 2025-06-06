'use client';

import { useAppContext } from '@/app/app-provider';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import Cookies from "js-cookie";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default function ButtonLogout() {
    const { setUser } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const handleLogout = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }
            Cookies.remove("accessToken");
            Cookies.remove("accessToken");
            Cookies.remove("accessTokenExpiresAt");
            Cookies.remove("userRoles");
            setUser(null);
            router.push('/login');

        } catch (error: any) {
            console.error('Logout error:', error);
            toast({
                variant: "destructive",
                title: "Đăng xuất không thành công",
                description: error.message || "Có lỗi xảy ra",
            });
            router.push(`/login?redirectFrom=${pathname}`);

        } finally {
            router.refresh();
            localStorage.removeItem('accessToken');
            localStorage.removeItem('accessTokenExpiresAt');

        }
    };

    return (
        <Button size={'sm'} onClick={handleLogout}>
            Đăng xuất
        </Button>
    );
}