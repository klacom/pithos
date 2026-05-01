import { BigBanner } from "@/components/BigBanner";
import NavBar from "@/components/NavBar";
import { HomeCategories } from "@/components/HomeCategories";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { ListBanner } from "@/components/ListBanner";
import { SmallBanner } from "@/components/SmallBanner";

export default async function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center">
            <Suspense>
                <NavBar />
            </Suspense>
            <div className="flex-1 w-full flex flex-col gap-5 items-center">
                <SmallBanner/>
                <BigBanner />
                <HomeCategories />
                <ListBanner />
                {/* TODO: don't forget Popular Bundles */}
                <div className="flex-1 flex flex-col gap-20 p-5">
                    <main className="flex-1 flex flex-col gap-6 items-center">
                    </main>
                </div>

                <Footer />


            </div>
        </main>
    );
}
