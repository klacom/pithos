// app/page.tsx
import { Suspense } from "react";
import { BigBanner } from "@/components/BigBanner";
import NavBar from "@/components/NavBar";
import { HomeCategories } from "@/components/HomeCategories";
import Footer from "@/components/Footer";
import { ListBanner } from "@/components/ListBanner";
import { SmallBanner } from "@/components/SmallBanner";
import NavBarLoader from "@/components/NavBarLoader";

export default function Home() {
    // No async here — the shell renders instantly
    return (
        <main className="min-h-screen flex flex-col items-center">
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>
            <div className="flex-1 w-full flex flex-col gap-5 items-center">
                <SmallBanner />
                <BigBanner />
                <HomeCategories />
                <ListBanner />
                <Footer />
            </div>
        </main>
    );
}