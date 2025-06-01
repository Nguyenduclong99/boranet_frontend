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
import Cookies from 'js-cookie'; // Import Cookies

type User = AccountResType['data']
type Role = string[];

interface AppContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    roles: Role | null;
    setRoles: (roles: Role | null) => void;
    isAuthenticated: boolean;
    currentUser: User | null; // Added currentUser to the type
    logout: () => void; // Added logout to the type
}

const AppContext = createContext<AppContextType>({
    user: null,
    setUser: () => { },
    roles: null,
    setRoles: () => { },
    isAuthenticated: false,
    currentUser: null, // Default value for currentUser
    logout: () => { }, // Default value for logout
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
    const [user, setUserState] = useState<User | null>(() => {
        if (isClient()) {
            const _user = localStorage.getItem('user')
            return _user ? JSON.parse(_user) : null
        }
        return null
    })
    const [roles, setRolesState] = useState<Role | null>(null);
    const isAuthenticated = Boolean(user)

    const setUser = useCallback(
        (user: User | null) => {
            setUserState(user)
            if (isClient()) {
                localStorage.setItem('user', JSON.stringify(user))
            }
        },
        [setUserState]
    )

    const setRoles = useCallback(
        (roles: Role | null) => {
            setRolesState(roles);
        },
        [setRolesState]
    );

    // Implement the logout function
    const logout = useCallback(() => {
        // Clear user data from state and local storage
        setUserState(null);
        setRolesState(null);
        if (isClient()) { // Ensure localStorage and Cookies are only accessed on the client side
            localStorage.removeItem('user');
            Cookies.remove('accessToken');
            Cookies.remove('accessTokenExpiresAt'); // Assuming you also store this
        }
        // You might want to redirect the user to the login page here
        // router.push('/login'); // If you have access to useRouter here
    }, [setUserState, setRolesState]);


    useEffect(() => {
        if (isClient()) { // Ensure localStorage is only accessed on the client side
            const _user = localStorage.getItem('user')
            setUserState(_user ? JSON.parse(_user) : null)
        }
    }, []) // Empty dependency array means this runs once on mount

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                roles,
                setRoles,
                isAuthenticated,
                currentUser: user, // Provide currentUser as the current user state
                logout // Provide the logout function
            }}
        >
            {children}
        </AppContext.Provider>
    )
}