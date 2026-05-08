import Image from "next/image"
import { Button } from "../ui/button"
import { Upload } from "lucide-react"
import { formatMaxSiteContentImageSizeLabel } from "@/lib/upload-validation"

const UploadListImage = ({ title, placeholder }: { title: string, placeholder: string }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 w-full">
            <Image
                src={"/sample-pics/SinSpire Girl.png"}
                alt="Sample"
                width={600}
                height={50}
                className="w-full md:w-1/4 h-full object-cover rounded-md border border-muted"
                loading="eager"
            />
            <div className='flex flex-col gap-2 w-full md:w-3/4'>
                <h1 className='font-medium'>{title}</h1>
                <input type="text" placeholder={placeholder} className={`border-muted outline-none focus:border-foreground focus:ring-foreground w-full hover:border hover:border-foreground bg-primary-foreground px-2 rounded-md h-auto`} />

                {/* Choose a file or drag and drop image here */}
                <div className="bg-primary-foreground h-full rounded-md border-2 border-dashed border-muted flex flex-col items-center justify-center p-4 gap-4">
                    <Upload />
                    <div className="flex flex-col">
                        <h2 className="text-center font-semibold text-lg">Choose an image or drag and drop it here</h2>
                        <p className="font-light opacity-50 text-md text-center">JPEG, PNG, WebP, and GIF formats, up to {formatMaxSiteContentImageSizeLabel()}</p>
                    </div>
                    <Button variant={"outline"}>
                        Browse File
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UploadListImage
