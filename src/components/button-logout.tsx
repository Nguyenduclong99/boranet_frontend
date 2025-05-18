'use client'

import authApiRequest from '@/apiRequests/auth'
import { useAppContext } from '@/app/app-provider'
import { Button } from '@/components/ui/button'
import { handleErrorApi } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from "js-cookie";
const API_BASE_URL = 'http://localhost:8081'; // Add this line
function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export default function ButtonLogout() {
    const { setUser } = useAppContext()
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        try {
            const token = getCookie('sessionToken');

            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { // Use full URL
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`, // Include the token
                    'Content-Type': 'application/json', // Or whatever content type your API expects
                },
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }
            Cookies.remove("accessToken");
            Cookies.remove("sessionToken");
            Cookies.remove("accessTokenExpiresAt");
            Cookies.remove("userRoles");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('accessTokenExpiresAt');
            setUser(null);
            router.push('/login');

        } catch (error) {
            handleErrorApi({ error });
            router.push(`/login?redirectFrom=${pathname}`);
        } finally {
            router.refresh();
        }
    };

    return (
        <Button size={'sm'} onClick={handleLogout}>
            Đăng xuất
        </Button>
    );
}