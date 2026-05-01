"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import MfaSetup from "@/components/MfaSetup";

export default function AccountPage() {
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const { user, loading } = useAuth();

    const user_avatar = user?.user_metadata?.avatar_url ?? "";
    const user_name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? "User";
    const user_email = user?.email ?? "No email provided";

    return (
        <main className="flex flex-col min-h-[calc(100vh-200px)] py-16 bg-muted/20">
            <div className="flex flex-col gap-8 px-4 md:px-20 lg:px-40 xl:px-60 2xl:px-80 w-full mx-auto items-end">
                
                <Card className="w-full flex flex-col gap-16 p-8 md:p-16 pt-24 relative overflow-visible mt-12 shadow-sm border-0 rounded-xl">
                    
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                        {user_avatar ? (
                            <div className="relative w-40 h-40 rounded-full overflow-hidden border-[6px] border-background bg-muted shadow-sm">
                                <Image 
                                    src={user_avatar} 
                                    alt="Profile Picture" 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-40 h-40 rounded-full bg-muted border-[6px] border-background shadow-sm flex items-center justify-center text-6xl font-medium text-foreground">
                                {user_email?.[0]?.toUpperCase() ?? "?"}
                            </div>
                        )}
                    </div>

                    {/* Personal Info Section */}
                    <section id="personal-info" className="flex flex-col gap-8">
                        <h2 className="font-bold text-2xl">Personal Info</h2>
                        
                        {/* Info Fields */}
                        <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
                            {/* Name */}
                            <div className="flex justify-between items-center group">
                                <div className="flex w-full items-center">
                                    <span className="w-1/3 text-foreground font-medium">Name</span>
                                    <span className="w-2/3 truncate text-muted-foreground">{user_name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            {/* Email */}
                            <div className="flex justify-between items-center group">
                                <div className="flex w-full items-center">
                                    <span className="w-1/3 text-foreground font-medium">Email</span>
                                    <span className="w-2/3 truncate text-muted-foreground">{user_email}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Location */}
                            <div className="flex justify-between items-center group">
                                <div className="flex w-full items-center">
                                    <span className="w-1/3 text-foreground font-medium">Location</span>
                                    <span className="w-2/3 text-muted-foreground">Taguig</span>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* MFA Security Section */}
                    <section id="security" className="flex flex-col gap-6">
                        <div className="max-w-2xl mx-auto w-full">
                            <MfaSetup />
                        </div>
                    </section>

                    {/* Payment Options Section */}
                    <section id="payment-options" className="flex flex-col gap-6">
                        <h2 className="font-bold text-2xl">Payment Options</h2>
                        
                        <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                            {/* GCash */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'gcash' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('gcash')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <Image src="/payment-logos/gcash.png" alt="GCash" width={60} height={20} className="object-contain" />
                                        <span className="font-bold text-sm">GCash</span>
                                    </div>
                                    {selectedPayment === 'gcash' && <Check className="w-5 h-5 text-primary" />}
                                </div>
                            </div>

                            {/* PayPal */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'paypal' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('paypal')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <Image src="/payment-logos/paypal.webp" alt="PayPal" width={60} height={20} className="object-contain" />
                                        <span className="font-bold text-sm">PayPal</span>
                                    </div>
                                    {selectedPayment === 'paypal' && <Check className="w-5 h-5 text-primary" />}
                                </div>
                            </div>

                            {/* Credit/Debit Card */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'card' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('card')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-8 bg-gray-400 rounded flex items-center justify-center">
                                            <div className="w-full h-2 bg-gray-500 mt-2"></div>
                                        </div>
                                        <span className="font-bold text-sm">Credit Card / Debit Card</span>
                                    </div>
                                    {selectedPayment === 'card' && <Check className="w-5 h-5 text-primary" />}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Purchase History Section */}
                    <section id="purchase-history" className="flex flex-col gap-6">
                        <h2 className="font-bold text-2xl">Purchase History</h2>
                        
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-foreground font-bold border-b">
                                    <tr>
                                        <th className="px-4 py-3">Order Date</th>
                                        <th className="px-4 py-3">Payment Type</th>
                                        <th className="px-4 py-3">Order ID</th>
                                        <th className="px-4 py-3">Invoice Number</th>
                                        <th className="px-4 py-3">Order Total</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors text-muted-foreground font-medium">
                                        <td className="px-4 py-4">2/28/2026</td>
                                        <td className="px-4 py-4">GCash</td>
                                        <td className="px-4 py-4">6789</td>
                                        <td className="px-4 py-4">42067</td>
                                        <td className="px-4 py-4">$134.00</td>
                                        <td className="px-4 py-4">Completed</td>
                                        <td className="px-4 py-4">
                                            <Link href="#" className="text-red-500 hover:text-red-600 font-medium">
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                    {/* Add more rows here as needed */}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </Card>

                {/* Apply Changes Button */}
                <Button variant="red_default" className="w-full sm:w-auto px-8 py-6 font-bold">
                    Apply Changes
                </Button>
            </div>
        </main>
    );
}