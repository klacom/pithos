"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "../ui/button"
import { Upload } from "lucide-react"
import TitleInputForm from "./TitleInputForm"

type Props = {
    title?: string
    placeholder: string
    blockId: string
    onUploaded?: (url: string) => void
    fetchedLink? : string
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const TitleInputUpload = ({ title, placeholder, blockId, onUploaded, fetchedLink }: Props) => {
    const [uploading, setUploading] = useState(false)
    const [fileUrl, setFileUrl] = useState<string | null>(null)

    const uploadFile = async (file: File) => {
        try {
            if (file.size > MAX_SIZE) {
                alert("File too large (max 5MB)")
                return
            }

            const allowed = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "video/mp4",
                "audio/wav"
            ]

            if (!allowed.includes(file.type)) {
                alert("Unsupported file type")
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
            alert("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* Preview */}
            <div className="w-full md:w-2/4">
                {fileUrl ? (
                    <Image
                        src={fileUrl}
                        alt="Uploaded"
                        width={600}
                        height={200}
                        className="w-full h-full object-cover rounded-md border border-muted"
                    />
                ) : (
                    <Image
                        src={fetchedLink || ""}
                        alt={fetchedLink || ""}
                        width={600}
                        height={200}
                        className="w-full h-full object-cover rounded-md border border-muted"
                    />
                )}
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
                            JPEG, JPG, PNG, GIF, MP4, WAV (max 5MB)
                        </p>
                    </div>

                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            if (!e.target.files?.[0]) return
                            uploadFile(e.target.files[0])
                        }}
                    />

                </label>

            </div>
        </div>
    )
}

export default TitleInputUpload