import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <Link
                href={"/"}
                className="absolute top-4 left-4 text-xl font-bold cursor-pointer"
            >
                EDA
            </Link>
            <main>{children}</main>
        </div>
    );
}
