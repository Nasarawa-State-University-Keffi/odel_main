import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

// DEFINING THE TYPE OF DATA USER SHOULD TAKE

interface User {
    userId: string;
    roles: string[];
    mfa: boolean;
}


// DEFINING THE TYPE OF DATA THE AUTHCONTEXT WILL TAKE

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    login: (user: User, token: string, refreshToken: string) => void;
    logout: () => void;
    checkAuth: () => boolean;
    isLoading: boolean;
}

// CREATING THE AUTHCONTEXT

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CREATING THE useAuth HOOK

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


// CREATING THE AuthProvider

interface AuthProviderProps {
    children: ReactNode;
}

// CREATING THE AuthProvider

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Initialize auth state from cookies on mount
    useEffect(() => {
        const storedUser = Cookies.get('admin_user');
        const storedToken = Cookies.get('admin_token');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    // HANDLES LOGIN DATA AND SETTING THEM TO COOKIES

    const login = (userData: User, token: string, refreshToken: string) => {
        Cookies.set('admin_user', JSON.stringify(userData), { secure: true, sameSite: 'strict' });
        Cookies.set('admin_token', token, { secure: true, sameSite: 'strict' });
        Cookies.set('admin_refresh_token', refreshToken, { secure: true, sameSite: 'strict' });
        setUser(userData);
    };


    // HANDLES LOGOUT AND REMOVING DATA FROM THE COOKIES

    const logout = () => {
        Cookies.remove('admin_user');
        Cookies.remove('admin_token');
        Cookies.remove('admin_refresh_token');
        Cookies.remove('pending_mfa_user');
        setUser(null);
        navigate('/api/auth/admin/login');
    };

    // CHECKING IF THE USER IS AUTHENTICATED

    const checkAuth = (): boolean => {
        const token = Cookies.get('admin_token');
        const storedUser = Cookies.get('admin_user');
        return !!(token && storedUser);
    };

    // CHECKING IF THE USER HAS A SPECIFIC ROLE

    const hasRole = (role: string): boolean => {
        return user?.roles?.includes(role) || false;
    };

    // CHECKING IF THE USER HAS ANY OF THE SPECIFIED ROLES

    const hasAnyRole = (roles: string[]): boolean => {
        return roles.some(role => user?.roles?.includes(role)) || false;
    };


    // CHECKING IF THE USER IS ADMIN OR SUPER_ADMIN

    const isAdmin = hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    const isSuperAdmin = hasRole('SUPER_ADMIN');
    const isAuthenticated = !!user && checkAuth();

    // RETURNING THE VALUES

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        hasRole,
        hasAnyRole,
        login,
        logout,
        checkAuth,
        isLoading,
    };

    // RETURNING THE VALUES

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
