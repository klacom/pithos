"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Loader2, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CartListItem } from "@/app/shop-actions";

export default function CheckoutPage() {
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const directProductId = searchParams.get("product_id");
    const selectedIdsParam = searchParams.get("ids");

    useEffect(() => {
        async function loadItems() {
            setLoading(true);
            try {
                const res = await fetch(`/api/cart/items`, { cache: "no-store" });
                const items: CartListItem[] = await res.json();
                if (directProductId) {
                    const directItem = items.find(item => item.productId === directProductId);
                    if (directItem) {
                        setCartItems([directItem]);
                    } else {
                        setCartItems(items.filter(item => item.productId === directProductId));
                    }
                } else if (selectedIdsParam) {
                    const ids = selectedIdsParam.split(",");
                    setCartItems(items.filter(item => ids.includes(item.productId)));
                } else {
                    setCartItems(items);
                }
            } catch (error) {
                console.error("Failed to load checkout items:", error);
                toast.error("Failed to load your items.");
            } finally {
                setLoading(false);
            }
        }
        loadItems();
    }, [directProductId]);

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price, 0);
    }, [cartItems]);

    const handlePlaceOrder = async () => {
        if (!selectedPayment) {
            toast.error("Please select a payment method.");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create Payment Intent
            const res = await fetch("/api/payments/create-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productIds: cartItems.map(item => item.productId),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const { clientKey, intentId } = data;

            // 2. Handle specific payment methods
            if (selectedPayment === 'card') {
                const sessionRes = await fetch("/api/payments/checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productIds: cartItems.map(item => item.productId),
                        line_items: cartItems.map(item => {
                            currency: "PHP"
                            amount: item.price
                            name: item.title
                        }),
                    }),
                });

                const sessionData = await sessionRes.json();
                if (!sessionRes.ok) throw new Error(sessionData.error);

                window.location.href = sessionData.checkoutUrl;
                return;
            }

            if (selectedPayment === 'gcash' || selectedPayment === 'paymaya') {
                const attachRes = await fetch("/api/payments/attach-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        intentId,
                        paymentMethodType: selectedPayment,
                        clientKey,
                    }),
                });

                const attachData = await attachRes.json();
                if (!attachRes.ok) throw new Error(attachData.error);

                const redirectUrl = attachData.data.attributes.next_action?.redirect?.url;
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    router.push("/shopping-cart/checkout/success");
                }
            }

        } catch (error: any) {
            console.error("Payment failed:", error);
            toast.error(error.message || "Something went wrong with the payment.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <div className="flex flex-col gap-1">
                            <h2 className="font-bold text-lg uppercase">Payment Options</h2>
                            <p className="text-sm text-muted-foreground">Select your preferred payment method securely powered by PayMongo.</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* GCash */}
                            <div
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'gcash' ? 'border-primary bg-primary/5' : 'border-muted bg-muted/20 hover:bg-muted/40'}`}
                                onClick={() => setSelectedPayment('gcash')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === 'gcash' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'gcash' && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Image src="/payment-logos/gcash.png" alt="GCash" width={60} height={20} className="object-contain" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">GCash</span>
                                        <span className="text-xs text-muted-foreground">Pay using your GCash wallet</span>
                                    </div>
                                </div>
                            </div>

                            {/* PayMaya */}
                            <div
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'paymaya' ? 'border-primary bg-primary/5' : 'border-muted bg-muted/20 hover:bg-muted/40'}`}
                                onClick={() => setSelectedPayment('paymaya')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === 'paymaya' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'paymaya' && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Image src="/payment-logos/paymongo.png" alt="Maya" width={60} height={20} className="object-contain" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Maya</span>
                                        <span className="text-xs text-muted-foreground">Pay using your Maya account</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit/Debit Card */}
                            <div
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'card' ? 'border-primary bg-primary/5' : 'border-muted bg-muted/20 hover:bg-muted/40'}`}
                                onClick={() => setSelectedPayment('card')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === 'card' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                        {selectedPayment === 'card' && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="p-2 bg-white rounded-lg shadow-sm flex gap-2">
                                        <CreditCard className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">Credit / Debit Card</span>
                                        <span className="text-xs text-muted-foreground">Visa, Mastercard, JCB</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                            <Wallet className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-blue-900">Secure Payment</p>
                                <p className="text-xs text-blue-700">Your payment information is encrypted and processed securely by PayMongo. Pithos does not store your card details.</p>
                            </div>
                        </div>
                    </Card>

                    {/* Right side: Order Summary */}
                    <Card className="p-8 flex flex-col justify-between w-full lg:w-1/3 min-h-[400px] border-2 border-muted shadow-lg">
                        <div className="flex flex-col gap-6">
                            <h2 className="font-bold text-lg uppercase tracking-wider">Order Summary</h2>

                            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                                {cartItems.map((item) => (
                                    <div key={item.productId} className="flex gap-4 items-center border-b border-muted pb-4">
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                            <Image
                                                src={item.imageSrc}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm truncate">{item.title}</h3>
                                            <p className="text-xs text-muted-foreground truncate">by {item.sellerName}</p>
                                        </div>
                                        <span className="font-bold text-sm">₱{item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 pt-4 border-t-2 border-muted">
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span className="text-sm">Subtotal</span>
                                    <span className="text-sm">₱{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span className="text-sm">Processing Fee</span>
                                    <span className="text-sm">₱0.00</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-muted">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-black text-2xl text-primary">₱{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="red_default"
                            className="w-full mt-8 py-6 text-lg font-bold shadow-xl hover:translate-y-[-2px] transition-all"
                            onClick={handlePlaceOrder}
                            disabled={isProcessing || cartItems.length === 0}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Place Order Now"
                            )}
                        </Button>
                    </Card>
                </div>
            </div>
        </main >
    );
}
