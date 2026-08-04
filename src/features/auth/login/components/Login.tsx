"use client";
import Link from "next/link";
import {
    Card, CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import { Form } from "@/features/core/components/form";
import { useLogin } from "../hooks/useLogin";
import { Spinner } from "@/features/core/components/spinner";
import { FormInput } from "@/features/core/components/FormInput";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const { loading, error, form, onSubmit } = useLogin()
    return (
        <div className="flex justify-center items-center h-screen  px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormInput
                                control={form.control}
                                label="Email"
                                name="email"
                                placeholder="you@example.com"
                                icon={<User className="text-muted-foreground" size={18} />}
                            />
                            <FormInput
                                control={form.control}
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••••••••••"
                                icon={<Lock className="text-muted-foreground" size={18} />}
                            />
                            {error && (
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11  font-medium "
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        Loging in <Spinner />
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <div className="text-center">
                        <p className="text-sm ">
                            {"Don't have an account? "}
                            <Link
                                href="/auth/signup"
                                className="font-medium  hover:underline text-primary"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
