"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ShieldCheck, FileText, Users, Handshake } from "lucide-react";
import Link from "next/link";

const COMPANY_PAGES = {
    about: {
        title: "About Pithos",
        description: "The ultimate marketplace for high-quality 3D assets.",
        icon: Sparkles,
        content: (
            <div className="space-y-6">
                <p>
                    Pithos is a premier digital marketplace dedicated to providing high-quality 3D models, textures, and creative tools for developers, designers, and hobbyists.
                </p>
                <p>
                    Our mission is to empower creators by providing them with the assets they need to bring their visions to life, while offering a fair and supportive platform for digital artists to showcase and sell their work.
                </p>
                <h3 className="text-xl font-bold mt-8">Why Pithos?</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Curated selection of high-quality assets</li>
                    <li>Secure transaction platform powered by PayMongo</li>
                    <li>Supportive community of creators and sellers</li>
                    <li>80% revenue share for our sellers</li>
                </ul>
            </div>
        ),
    },
    "become-seller": {
        title: "Become a Seller",
        description: "Join our community of talented creators and start earning today.",
        icon: Users,
        content: (
            <div className="space-y-6">
                <p>
                    Are you a 3D artist, texture creator, or tool developer? Pithos is the perfect place to reach thousands of potential buyers.
                </p>
                <h3 className="text-xl font-bold mt-8">Seller Benefits</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-xl bg-muted/50">
                        <h4 className="font-bold mb-2">High Revenue Share</h4>
                        <p className="text-sm">Keep 80% of every sale you make on the platform.</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-muted/50">
                        <h4 className="font-bold mb-2">Global Reach</h4>
                        <p className="text-sm">Showcase your work to a global audience of creators.</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-muted/50">
                        <h4 className="font-bold mb-2">Easy Management</h4>
                        <p className="text-sm">Manage your assets, orders, and payouts with our intuitive dashboard.</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-muted/50">
                        <h4 className="font-bold mb-2">Fast Payouts</h4>
                        <p className="text-sm">Receive your earnings directly to your preferred payout method.</p>
                    </div>
                </div>
                <div className="mt-8 flex justify-center">
                    <Button asChild size="lg" variant="red_default">
                        <Link href="/auth/sign-up">Start Selling Now</Link>
                    </Button>
                </div>
            </div>
        ),
    },
    affiliate: {
        title: "Affiliate Program",
        description: "Earn rewards by referring new customers and sellers to Pithos.",
        icon: Handshake,
        content: (
            <div className="space-y-6">
                <p>
                    Help us grow the Pithos community and earn rewards for every successful referral. Our affiliate program is designed for influencers, bloggers, and active community members.
                </p>
                <p>
                    More details about the affiliate program will be available soon. Stay tuned for updates!
                </p>
            </div>
        ),
    },
    privacy: {
        title: "Privacy Policy",
        description: "How we handle and protect your personal information.",
        icon: ShieldCheck,
        content: (
            <div className="space-y-6">
                <p>
                    At Pithos, we take your privacy seriously. This policy outlines the types of information we collect, how we use it, and the measures we take to keep it secure.
                </p>
                <h3 className="text-xl font-bold mt-8">Information We Collect</h3>
                <p>
                    We collect information you provide directly to us, such as when you create an account, make a purchase, or contact our support team. This may include your name, email address, and payment information.
                </p>
                <h3 className="text-xl font-bold mt-8">How We Use Your Information</h3>
                <p>
                    We use your information to provide and improve our services, process transactions, and communicate with you about your account and our latest offerings.
                </p>
                <p>
                    We do not sell your personal information to third parties.
                </p>
            </div>
        ),
    },
    terms: {
        title: "Terms of Service",
        description: "The rules and guidelines for using the Pithos platform.",
        icon: FileText,
        content: (
            <div className="space-y-6">
                <p>
                    By using Pithos, you agree to comply with our terms and conditions. These terms govern your use of our website, services, and any assets purchased through our marketplace.
                </p>
                <h3 className="text-xl font-bold mt-8">User Accounts</h3>
                <p>
                    You are responsible for maintaining the security of your account and for all activities that occur under your account.
                </p>
                <h3 className="text-xl font-bold mt-8">Asset Licensing</h3>
                <p>
                    All assets purchased on Pithos are subject to specific licensing terms. Please review the license information provided with each asset before use.
                </p>
                <h3 className="text-xl font-bold mt-8">Prohibited Conduct</h3>
                <p>
                    You may not use Pithos for any illegal or unauthorized purpose, or to upload any content that violates the rights of others.
                </p>
            </div>
        ),
    },
};

export default function CompanyPage() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();

    const page = COMPANY_PAGES[slug as keyof typeof COMPANY_PAGES];

    if (!page) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-20 flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
                <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
                <Button onClick={() => router.push("/")} variant="outline">
                    Return Home
                </Button>
            </main>
        );
    }

    const Icon = page.icon;

    return (
        <main className="mx-auto max-w-4xl px-4 py-16 flex flex-col gap-8">
            <Button
                variant="ghost"
                className="w-fit px-0 hover:bg-transparent -ml-2"
                onClick={() => router.back()}
            >
                <ArrowLeft size={16} className="mr-2" />
                Go Back
            </Button>

            <div className="flex flex-col gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl w-fit text-primary">
                    <Icon size={32} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
                <p className="text-xl text-muted-foreground">{page.description}</p>
            </div>

            <hr className="border-muted" />

            <div className="prose prose-slate max-w-none text-foreground leading-relaxed">
                {page.content}
            </div>
        </main>
    );
}
