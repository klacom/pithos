"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateUserName, updateUserAvatar } from "../actions";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png"];

export default function PersonalInfoPage() {
    const { user, loading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_SIZE) {
            toast.error("File is too large. Maximum size is 5MB.");
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleUpload = async () => {
        if (!previewUrl || !fileInputRef.current?.files?.[0] || !user?.id) {
            toast.error("Please select a file first");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", fileInputRef.current.files[0]);
            formData.append("userId", user.id);

            const res = await fetch("/api/upload-user-profile", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            const result = await updateUserAvatar(data.url);
            if (result.success) {
                toast.success("Profile picture updated successfully");
                window.location.reload();
            } else {
                toast.error(result.error || "Failed to update profile picture");
            }
        } catch (error) {
            toast.error("Failed to upload profile picture");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelPreview = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const displayedAvatar = previewUrl || user_avatar;

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
                    <p className='text-muted-foreground'>Update your profile picture. (Max 5MB, JPG/PNG only)</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                {displayedAvatar ? (
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-[4px] border-background shadow-sm">
                                        <Image 
                                            src={displayedAvatar} 
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
                                {previewUrl && (
                                    <button
                                        onClick={handleCancelPreview}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/jpg,image/jpeg,image/png"
                                    onChange={handleFileChange}
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <Upload size={16} className="mr-2" />
                                    Choose Photo
                                </Button>
                                {previewUrl && (
                                    <Button 
                                        variant="red_default" 
                                        size="sm"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Uploading..." : "Save Photo"}
                                    </Button>
                                )}
                            </div>
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
