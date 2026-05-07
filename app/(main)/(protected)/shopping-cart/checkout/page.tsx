"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCartItems, type CartListItem } from "@/app/shop-actions";

export default function CheckoutPage() {
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [items, setItems] = useState<CartListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const idsString = searchParams.get("ids");

    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            try {
                const ids = idsString ? idsString.split(",") : [];
                if (ids.length === 0) {
                    router.push("/shopping-cart");
                    return;
                }
                const cartItems = await getCartItems(ids);
                if (cartItems.length === 0) {
                    router.push("/shopping-cart");
                    return;
                }
                setItems(cartItems);
            } catch (error) {
                console.error("Failed to fetch checkout items:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [idsString, router]);

    const total = items.reduce((sum, item) => sum + item.price, 0);

    const handlePlaceOrder = () => {
        router.push("/shopping-cart/checkout/success");
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-8 min-h-[calc(100vh-200px)] mb-8">
            <div className="flex flex-col gap-8 px-4 md:px-8 lg:px-12 max-w-screen-2xl mx-auto w-full">
                <div className="flex flex-col gap-2 mt-8 lg:mt-0">
                    <Link href="/shopping-cart">
                        <Button variant={"red_ghost"} className="self-start px-0 hover:bg-transparent">
                            <ArrowLeft size={16} className="mr-2" />
                            Go Back
                        </Button>
                    </Link>
                    <h1 className="font-bold text-4xl">Checkout</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 w-full">
                    {/* Left side: Payment Options */}
                    <Card className="p-8 flex flex-col gap-6 w-full lg:w-2/3">
                        <h2 className="font-bold text-lg uppercase">Payment Options</h2>

                        <div className="flex flex-col gap-4">
                            {/* GCash */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'gcash' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('gcash')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPayment === 'gcash' ? 'border-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'gcash' && <div className="w-3 h-3 rounded-full bg-primary" />}
                                    </div>
                                    <Image src="/payment-logos/gcash.png" alt="GCash" width={60} height={20} className="object-contain" />
                                    <span className="font-semibold">GCash</span>
                                </div>
                                
                                {/* Dropdown form for GCash */}
                                {selectedPayment === 'gcash' && (
                                    <div className="mt-6 pl-9 flex flex-col gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            You will be redirected to the GCash portal to securely complete your purchase.
                                        </p>
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-2">*Required: save this payment method for future purchases?</p>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-gcash" className="w-4 h-4 text-primary" />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-gcash" className="w-4 h-4 text-primary" defaultChecked />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PayPal */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'paypal' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('paypal')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPayment === 'paypal' ? 'border-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'paypal' && <div className="w-3 h-3 rounded-full bg-primary" />}
                                    </div>
                                    <Image src="/payment-logos/paypal.webp" alt="PayPal" width={60} height={20} className="object-contain" />
                                    <span className="font-semibold">PayPal</span>
                                </div>

                                {/* Dropdown form for PayPal */}
                                {selectedPayment === 'paypal' && (
                                    <div className="mt-6 pl-9 flex flex-col gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            You will be redirected to the PayPal website to securely complete your purchase.
                                        </p>
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-2">*Required: save this payment method for future purchases?</p>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-paypal" className="w-4 h-4 text-primary" />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-paypal" className="w-4 h-4 text-primary" defaultChecked />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Credit/Debit Card */}
                            <div 
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'card' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted/30 hover:bg-muted/50'}`}
                                onClick={() => setSelectedPayment('card')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPayment === 'card' ? 'border-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'card' && <div className="w-3 h-3 rounded-full bg-primary" />}
                                    </div>
                                    <div className="w-12 h-8 bg-gray-400 rounded flex items-center justify-center">
                                        <div className="w-full h-2 bg-gray-500 mt-2"></div>
                                    </div>
                                    <span className="font-semibold">Credit Card / Debit Card</span>
                                </div>

                                {/* Dropdown form for Card */}
                                {selectedPayment === 'card' && (
                                    <div className="mt-6 pl-9 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Card Details</span>
                                            <div className="flex gap-1">
                                                <Image src="/payment-logos/visa.jpg" alt="Visa" width={30} height={20} className="object-contain" />
                                                <Image src="/payment-logos/mastercard.png" alt="Mastercard" width={30} height={20} className="object-contain" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <Input placeholder="Card Number *" className="bg-background" />
                                            </div>
                                            <div>
                                                <Input placeholder="Name on Card *" className="bg-background" />
                                            </div>
                                            <div className="flex gap-4">
                                                <Input placeholder="Expiration *" className="bg-background flex-1" />
                                                <Input placeholder="CCV *" className="bg-background flex-1" />
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-2">*Required: save this payment method for future purchases?</p>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-card" className="w-4 h-4 text-primary" />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="save-card" className="w-4 h-4 text-primary" defaultChecked />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Right side: Order Summary */}
                    <Card className="p-8 flex flex-col justify-between w-full lg:w-1/3 min-h-[400px]">
                        <div className="flex flex-col gap-6">
                            <h2 className="font-bold text-lg uppercase">Order Summary</h2>
                            
                            <div className="flex flex-col gap-4">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-4 items-center">
                                        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md border">
                                            <Image 
                                                src={item.imageSrc} 
                                                alt={item.title} 
                                                fill 
                                                className="object-cover aspect-square"
                                                unoptimized 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                                            <p className="text-xs text-muted-foreground">{item.sellerName}</p>
                                        </div>
                                        <span className="font-semibold text-sm">{item.priceLabel}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-lg">P{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <Button variant="red_default" className="w-full mt-8" onClick={handlePlaceOrder}>
                            Place Order
                        </Button>
                    </Card>
                </div>
            </div>
        </main>
    );
}
