import Link from "next/link";

export const NavbarLogo = () => (
    <Link
        href="/"
        aria-label="home"
        className="flex items-center space-x-2 text-xl dark:text-white text-black"
    >
        EDA
    </Link>
);
