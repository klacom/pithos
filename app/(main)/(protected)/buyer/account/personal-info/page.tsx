"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/AuthProvider";
import { updateUserName } from "../actions";
import { toast } from "sonner";

export default function PersonalInfoPage() {
    const { user, loading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const user_avatar = user?.user_metadata?.avatar_url ?? "";
    const initial_user_name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? "User";
    const user_email = user?.email ?? "No email provided";

    const handleSave = async () => {
        if (!fullName.trim()) {
            toast.error("Please enter your full name");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateUserName(fullName);
            if (result.success) {
                toast.success("Name updated successfully");
            } else {
                toast.error(result.error || "Failed to update name");
            }
        } catch (error) {
            toast.error("An error occurred while updating your name");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'> 
            <div className='flex flex-col gap-2'>
                <h1 className='font-bold text-3xl'>Personal Information</h1>
                <p className='text-muted-foreground'>Manage your personal details and profile information.</p>
            </div>
            <hr />

            {/* Profile Picture Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Profile Picture</h1>
                    <p className='text-muted-foreground'>Update your profile picture.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <div className="flex flex-col items-center gap-4">
                            {user_avatar ? (
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-[4px] border-background shadow-sm">
                                    <Image 
                                        src={user_avatar} 
                                        alt="Profile Picture" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-muted border-[4px] border-background shadow-sm flex items-center justify-center text-4xl font-medium text-foreground">
                                    {user_email?.[0]?.toUpperCase() ?? "?"}
                                </div>
                            )}
                            <Button variant="outline" size="sm">Change Photo</Button>
                        </div>
                    </Card>
                </div>
            </div>

            <hr />

            {/* Personal Details Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Personal Details</h1>
                    <p className='text-muted-foreground'>Update your personal information.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='full-name'>Full Name</Label>
                            <Input 
                                id='full-name' 
                                placeholder='Your full name' 
                                defaultValue={initial_user_name}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input id='email' type='email' placeholder='Your email' defaultValue={user_email} disabled />
                        </div>  

                        <div className='flex justify-end'>
                            <Button variant='red_default' onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
