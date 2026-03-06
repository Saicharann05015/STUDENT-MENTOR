"use client";

import { useState } from "react";
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
import { GraduationCap, Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

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

                <Card className="border-border/50 shadow-2xl shadow-primary/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            {success ? "Check Your Email" : "Forgot Password?"}
                        </CardTitle>
                        <CardDescription>
                            {success
                                ? "We've sent you a password reset link"
                                : "Enter your email and we'll send you a reset link"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="inline-flex p-4 rounded-2xl bg-primary/10">
                                    <Mail className="h-10 w-10 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    If an account exists with <strong>{email}</strong>, you&apos;ll
                                    receive a reset link shortly. The link expires in 15 minutes.
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full mt-4">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Mail className="h-4 w-4 mr-2" />
                                    )}
                                    Send Reset Link
                                </Button>
                                <Link
                                    href="/login"
                                    className="block text-center text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="h-3 w-3 inline mr-1" />
                                    Back to Login
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
