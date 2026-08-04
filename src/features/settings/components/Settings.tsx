"use client";

import { Sun, Smartphone, Check } from "lucide-react";
import {
    Card, CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/features/core/components/card";
import { Label } from "@/features/core/components/label";
import { themes } from "../constants/constants";
import { useTheme } from "../hooks/useTheme";

export default function Settings() {
    const { theme, mounted, resolvedTheme, handleThemeChange } = useTheme()
    // Don't render theme-dependent content until mounted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                <div className="w-full  mx-auto p-6">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="h-32 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="w-full  mx-auto p-6">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your application preferences and appearance.
                        </p>
                    </div>

                    {/* Theme Section */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Sun className="h-5 w-5 text-primary" />
                                </div>
                                Theme Preferences
                            </CardTitle>
                            <CardDescription>
                                Choose how the application looks and feels. Your theme
                                preference will be saved and applied across all sessions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Current Theme Display */}
                            <div className="p-4 bg-muted/50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">
                                            Current Theme
                                        </Label>
                                        <p className="text-sm text-muted-foreground capitalize mt-1">
                                            {theme}{" "}
                                            {resolvedTheme &&
                                                theme !== resolvedTheme &&
                                                `(${resolvedTheme})`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        Active
                                    </div>
                                </div>
                            </div>

                            {/* Theme Options */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">Select Theme</Label>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {themes.map((themeOption) => {
                                        const IconComponent = themeOption.icon;
                                        const isSelected = theme === themeOption.id;

                                        return (
                                            <button
                                                key={themeOption.id}
                                                onClick={() => handleThemeChange(themeOption.id)}
                                                className={`
                          relative w-full p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer
                          ${isSelected
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                                                    }
                        `}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`
                            p-2 rounded-md transition-colors
                            ${isSelected
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                            }
                          `}
                                                    >
                                                        <IconComponent className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {themeOption.label}
                                                            </span>
                                                            {isSelected && (
                                                                <Check className="h-4 w-4 text-primary" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {themeOption.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Settings Placeholder */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                </div>
                                More Settings
                            </CardTitle>
                            <CardDescription>
                                Additional preferences and configurations coming soon.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
                                {[
                                    "Notifications",
                                    "Language",
                                    "Accessibility",
                                    "Privacy",
                                    "Data",
                                    "Account",
                                ].map((setting) => (
                                    <div
                                        key={setting}
                                        className="p-4 border rounded-lg bg-muted/20 cursor-pointer hover:scale-[1.01] transition-all duration-200 "
                                    >
                                        <h3 className="font-medium text-sm text-muted-foreground">
                                            {setting}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Coming soon
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
