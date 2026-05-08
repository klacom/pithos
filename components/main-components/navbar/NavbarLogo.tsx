import Link from "next/link";
import PithosLogo from "../../PithosLogo";

export function NavbarLogo() {
    return (
        <Link href="/" className="flex items-center gap-2 font-bold uppercase text-foreground">
            <PithosLogo size={24} color="currentColor" />
            Pithos
        </Link>
    );
}