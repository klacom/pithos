"use client";

import Link from "next/link";
import PithosLogo from "@/components/PithosLogo";
import { Github, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { getSystemConfig, SystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";

const Footer = () => {
    // const currentYear = new Date().getFullYear();
    const currentYear = 2026;
    const [config, setConfig] = useState<SystemConfig | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await getSystemConfig();
            if (data) setConfig(data);
        };
        fetchConfig();
    }, []);

    return (
        <footer className="bg-card border-t w-full">
            <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                {/* Brand Section */}
                <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold uppercase text-xl">
                        <PithosLogo size={32} color="foreground" />
                        Pithos
                    </Link>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        The ultimate marketplace for high-quality 3D assets, textures, and creative tools. Empowering creators worldwide to build amazing digital experiences.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                            <Twitter size={18} />
                        </a>
                        <a href="https://github.com/klacom/pithos" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                            <Github size={18} />
                        </a>
                        <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                            <Youtube size={18} />
                        </a>
                    </div>
                </div>

                {/* Marketplace Links */}
                <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
                    <h3 className="font-bold text-lg">Marketplace</h3>
                    <ul className="flex flex-col items-center md:items-start gap-3 text-sm text-muted-foreground">
                        <li><Link href="/product-listing" className="hover:text-primary transition-colors">All Assets</Link></li>
                        <li><Link href="/product-listing?category=3d" className="hover:text-primary transition-colors">3D Models</Link></li>
                        <li><Link href="/product-listing?category=textures" className="hover:text-primary transition-colors">Textures</Link></li>
                        <li><Link href="/product-listing?category=tools" className="hover:text-primary transition-colors">Scripts & Tools</Link></li>
                        <li><Link href="/product-listing?sort=newest" className="hover:text-primary transition-colors">New Releases</Link></li>
                    </ul>
                </div>

                {/* Company Links */}
                <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
                    <h3 className="font-bold text-lg">Company</h3>
                    <ul className="flex flex-col items-center md:items-start gap-3 text-sm text-muted-foreground">
                        <li><Link href="/company/about" className="hover:text-primary transition-colors">About Pithos</Link></li>
                        <li><Link href="/company/become-seller" className="hover:text-primary transition-colors">Become a Seller</Link></li>
                        <li><Link href="/company/affiliate" className="hover:text-primary transition-colors">Affiliate Program</Link></li>
                        <li><Link href="/company/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/company/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                {/* Support Section */}
                <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
                    <h3 className="font-bold text-lg">Contact & Support</h3>
                    <ul className="flex flex-col items-center md:items-start gap-4 text-sm text-muted-foreground">
                        <li className="flex items-center gap-3">
                            <Mail size={16} className="text-primary" />
                            <span>{config?.support_email || "support@pithos.com"}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={16} className="text-primary" />
                            <span>{config?.support_phone || "+63 (02) 8123-4567"}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <MapPin size={16} className="text-primary" />
                            <span>{config?.support_location || "Manila, Philippines"}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <p>© {currentYear} Pithos Marketplace. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span>Powered by <a href="https://supabase.com" className="font-bold hover:text-primary">Supabase</a></span>
                        <span>Payments by <a href="https://paymongo.com" className="font-bold hover:text-primary">PayMongo</a></span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
