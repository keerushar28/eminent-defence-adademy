import Link from "next/link";
import { AnimatedGroup } from "../../components/animated-group";
import { ArrowRight } from "lucide-react";
import { Button } from "@/features/core/components/button";
import Image from "next/image";
import DarkImage from "../assets/herodark.jpg";
import LightImage from "../assets/herolight.png";

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: "blur(12px)",
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
                type: "spring" as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
} as const;

export default function HeroSection() {
    return (
        <section>
            <div className="relative pt-24 md:pt-36">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                        <AnimatedGroup variants={transitionVariants}>
                            <Link
                                href="#link"
                                className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                            >
                                <span className="text-foreground text-sm">
                                    Organize your academy effortlessly 🚀⚡
                                </span>
                                <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                    <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                        <span className="flex size-6">
                                            <ArrowRight className="m-auto size-3 dark:text-white text-black" />
                                        </span>
                                        <span className="flex size-6">
                                            <ArrowRight className="m-auto size-3 dark:text-white text-black" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </AnimatedGroup>

                        <AnimatedGroup variants={transitionVariants}>
                            <div className="mt-8 text-balance text-5xl sm:5xl md:text-7xl lg:mt-16 xl:text-[5.25rem] dark:text-white text-black">
                                Modern Solutions for Hostel Management
                            </div>

                            <div className="mx-auto mt-8 max-w-4xl text-balance text-lg text-muted-foreground">
                                A complete digital solution to manage hostel operations,
                                streamline student accommodations, track attendance,
                                handle staff duties, and simplify fee management
                            </div>
                        </AnimatedGroup>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}
                            className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                        >
                            <div
                                key={1}
                                className="bg-foreground/10 rounded-sm border p-0.5"
                            >
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-sm px-5 text-base"
                                >
                                    <Link href="/auth/login">
                                        <span className="text-nowrap">Get Started Here</span>
                                    </Link>
                                </Button>
                            </div>
                        </AnimatedGroup>
                    </div>
                </div>
           
            </div>
        </section>
    );
}
