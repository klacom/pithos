// app/page.tsx
import { Suspense } from "react";
import NavBar from "@/components/NavBar";
import NavBarLoader from "@/components/NavBarLoader";
import Footer from "@/components/Footer";
import HomeBlocks from "@/components/banner-announcements/HomePageBlocks";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center">
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>

            <div className="flex-1 w-full flex flex-col gap-5 items-center px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
                <Suspense fallback={<div>Loading homepage...</div>}>
                    <HomeBlocks />
                </Suspense>
            </div>

            <Footer />
        </main>
    );
}