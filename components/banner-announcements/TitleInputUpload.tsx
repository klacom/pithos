"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "../ui/button"
import { Upload, AlertCircle } from "lucide-react"
import TitleInputForm from "./TitleInputForm"
import { validateSiteContentImage, formatMaxSiteContentImageSizeLabel } from "@/lib/upload-validation"

type Props = {
    title?: string
    placeholder: string
    blockId: string
    onUploaded?: (url: string) => void
    fetchedLink?: string
}

const TitleInputUpload = ({ title, placeholder, blockId, onUploaded, fetchedLink }: Props) => {
    const [uploading, setUploading] = useState(false)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const uploadFile = async (file: File) => {
        try {
            setUploadError(null)

            // Use centralized validation
            const validationError = validateSiteContentImage(file)
            if (validationError) {
                setUploadError(validationError)
                return
            }

            setUploading(true)

            const formData = new FormData()
            formData.append("file", file)
            formData.append("blockId", blockId)
            formData.append("folder", "big_banner_folder")

            console.log("File formData: ", formData);


            const res = await fetch("/api/upload-site-content", {
                method: "POST",
                body: formData
            })

            console.log(fileUrl)

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            // alert(fileUrl);

            setFileUrl(data.url)
            onUploaded?.(data.url)

        } catch (err) {
            console.error(err)
            setUploadError(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* Preview */}
            <div className="w-full md:w-2/4 aspect-video relative">
                {(() => {
                    const mediaUrl = fileUrl || fetchedLink;
                    if (!mediaUrl) return (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md text-muted-foreground text-xs italic">
                            No media selected
                        </div>
                    );

                    const isVideo = mediaUrl.toLowerCase().endsWith(".mp4");
                    if (isVideo) {
                        return (
                            <video
                                src={mediaUrl}
                                className="w-full h-full object-cover rounded-md border border-muted"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        );
                    }

                    return (
                        <Image
                            src={mediaUrl}
                            alt="Uploaded"
                            fill
                            className="object-cover rounded-md border border-muted"
                            unoptimized
                        />
                    );
                })()}
            </div>

            {/* Upload UI */}
            <div className='flex flex-col gap-2 w-full md:w-2/4'>
                {title ? <label className='font-medium'>{title}</label> : <></>}

                {/* <input
                    type="text"
                    placeholder={placeholder}
                    value={fileUrl ?? ""}
                    readOnly
                    className="border-muted w-full bg-primary-foreground px-2 rounded-md"
                /> */}

                {/* <TitleInputForm
                    type="text"
                    
                    placeholder={placeholder}
                    value={fileUrl || fetchedLink}
                    readOnly={true}
                /> */}

                <label className="bg-primary-foreground rounded-md border-2 border-dashed border-muted flex flex-col items-center justify-center p-4 gap-4 cursor-pointer hover:border-foreground h-full">

                    <Upload />

                    <div className="flex flex-col">
                        <h2 className="text-center font-semibold text-lg">
                            {uploading ? "Uploading..." : "Choose or drag and drop"}
                        </h2>
                        <p className="font-light opacity-50 text-md text-center">
                            JPEG, PNG, WebP, GIF, MP4 (max {formatMaxSiteContentImageSizeLabel()})
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="image/*,video/mp4"
                        className="hidden"
                        onChange={(e) => {
                            if (!e.target.files?.[0]) return
                            uploadFile(e.target.files[0])
                        }}
                    />

                </label>

                {uploadError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800">
                        <AlertCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-200">{uploadError}</p>
                    </div>
                )}

            </div>
        </div>
    )
}

export default TitleInputUpload