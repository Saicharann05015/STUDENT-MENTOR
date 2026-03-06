"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authAPI } from "@/lib/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = Cookies.get("token");
        if (token) {
            authAPI
                .getMe()
                .then((res) => setUser(res.data.data))
                .catch(() => {
                    Cookies.remove("token");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authAPI.login({ email, password });
        Cookies.set("token", res.data.data.token, { expires: 7, secure: true, sameSite: 'Lax' });
        setUser(res.data.data.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await authAPI.register({ name, email, password });
        Cookies.set("token", res.data.data.token, { expires: 7, secure: true, sameSite: 'Lax' });
        setUser(res.data.data.user);
    };

    const logout = () => {
        Cookies.remove("token");
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
