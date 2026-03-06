"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    GraduationCap,
    Loader2,
    CheckCircle2,
    ArrowLeft,
} from "lucide-react";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!token) {
            setError("Invalid reset link. Please request a new one.");
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Password reset failed");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="border-border/50 shadow-2xl shadow-primary/5">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <p className="text-destructive">
                        Invalid reset link. Please request a new password reset.
                    </p>
                    <Link href="/forgot-password">
                        <Button variant="outline">Request New Link</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-border/50 shadow-2xl shadow-primary/5">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
                    <h2 className="text-2xl font-bold">Password Reset!</h2>
                    <p className="text-muted-foreground">
                        Your password has been updated. Redirecting to login...
                    </p>
                    <Link href="/login">
                        <Button variant="outline">Go to Login</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-2xl shadow-primary/5">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <CardDescription>
                    Enter your new password below
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Reset Password
                    </Button>
                    <Link
                        href="/login"
                        className="block text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3 inline mr-1" />
                        Back to Login
                    </Link>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8 gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Student Mentor
                    </h1>
                </div>
                <Suspense
                    fallback={
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    }
                >
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
