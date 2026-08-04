// components/navbar/NavbarActions.tsx
import Link from "next/link";
import { Button } from "@/features/core/components/button";

export default function NavbarActions() {
  return <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
    {/* <Button
      asChild
      variant="outline"
      size="sm"
      className={cn("dark:text-white text-black")}
    >
      <Link href="/auth/login">
        <span className="font-semibold">Login</span>
      </Link>
    </Button> */}
    <Button asChild size="sm">
      <Link href="/auth/signup">
        <span className="font-semibold">Login</span>
      </Link>
    </Button>
  </div>
}
