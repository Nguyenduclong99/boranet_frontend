'use client'

import { isClient } from '@/lib/http'
import { AccountResType } from '@/schemaValidations/account.schema'
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react'
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

type User = AccountResType['data']
type Role = string[];

interface JwtPayload {
    roles: string[];
    sub: string;
    username?: string;
    title?: string;
}

interface AppContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    roles: Role | null;
    setRoles: (roles: Role | null) => void;
    isAuthenticated: boolean;
    currentUser: User | null;
    logout: () => void;
}

const AppContext = createContext<AppContextType>({
    user: null,
    setUser: () => { },
    roles: null,
    setRoles: () => { },
    isAuthenticated: false,
    currentUser: null,
    logout: () => { },
})

export const useAppContext = () => {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context
}

export default function AppProvider({
    children
}: {
    children: React.ReactNode
}) {
    const [user, setUserState] = useState<User | null>(null);
    const [roles, setRolesState] = useState<Role | null>(null);
    const isAuthenticated = Boolean(user);

    const setUser = useCallback(
        (user: User | null) => {
            setUserState(user);
            if (isClient()) {
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    localStorage.removeItem('user');
                }
            }
        },
        [setUserState]
    );

    const setRoles = useCallback(
        (roles: Role | null) => {
            setRolesState(roles);
        },
        [setRolesState]
    );

    const logout = useCallback(() => {
        setUserState(null);
        setRolesState(null);
        if (isClient()) {
            localStorage.removeItem('user');
            Cookies.remove('accessToken');
            Cookies.remove('accessTokenExpiresAt');
            Cookies.remove('refreshToken');
            Cookies.remove('userRoles');
        }
    }, [setUserState, setRolesState]);

    useEffect(() => {
        if (isClient()) {
            const accessToken = Cookies.get('accessToken');
            const storedUser = localStorage.getItem('user');

            if (accessToken) {
                try {
                    const decodedToken = jwtDecode<JwtPayload>(accessToken);
                    if (decodedToken && decodedToken.sub) {
                        const newUser: User = {
                            id: decodedToken.sub,
                            email: decodedToken.sub,
                            username: decodedToken.username || decodedToken.sub,
                            title: decodedToken.roles.includes("ROLE_ADMIN") ? "Admin" : "User",
                            ... (storedUser ? JSON.parse(storedUser) : {})
                        };
                        setUserState(newUser);
                        setRolesState(decodedToken.roles);
                    } else {
                        setUserState(null);
                        setRolesState(null);
                        Cookies.remove('accessToken');
                        Cookies.remove('accessTokenExpiresAt');
                        Cookies.remove('refreshToken');
                        Cookies.remove('userRoles');
                        localStorage.removeItem('user');
                    }
                } catch (error) {
                    console.error("Failed to decode token:", error);
                    setUserState(null);
                    setRolesState(null);
                    Cookies.remove('accessToken');
                    Cookies.remove('accessTokenExpiresAt');
                    Cookies.remove('refreshToken');
                    Cookies.remove('userRoles');
                    localStorage.removeItem('user');
                }
            } else {
                setUserState(null);
                setRolesState(null);
                Cookies.remove('accessToken');
                Cookies.remove('accessTokenExpiresAt');
                Cookies.remove('refreshToken');
                Cookies.remove('userRoles');
                localStorage.removeItem('user');
            }
        }
    }, []);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                roles,
                setRoles,
                isAuthenticated,
                currentUser: user,
                logout
            }}
        >
            {children}
        </AppContext.Provider>
    )
}