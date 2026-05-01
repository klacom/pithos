"use client";

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Suspense } from 'react'
import { useEffect, useState } from "react"
import { useParams } from 'next/navigation';

type Props = {
    params: {
        product_id: string
    }
}

const page = () => {

    const { product_id } = useParams();

    console.log("Product ID: ", product_id);

    const [product, setProduct] = useState<any>(null)
    const [images, setImages] = useState<string[]>([])
    const [seller, setSeller] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/product/${product_id}`)
            const data = await res.json()

            if (!res.ok) {
                console.error(data.error)
                return
            }

            // console.log("data images: ",data.images);

            setProduct(data.product);
            setImages(data.images);
            setSeller(data.user);
        }

        fetchData()
    }, [product_id])

    if (!product) return <div>Loading...</div>

    return (
        <Suspense>
            <main className='flex flex-col gap-8 px-4 md:px-20 lg:px-40 xl:px-60 2xl:px-80 w-full mb-4'>

                {/* Content */}

                {/* Go back */}

                <Button variant={'red_ghost'} className='self-start'>
                    <ArrowLeft size={16} />
                    Go Back
                </Button>

                {/* 2 Main Divs */}
                <div className='grid grid-cols-[5fr_2fr] gap-8 w-full'>

                    {/* LEFT */}
                    <div className='w-full flex flex-col gap-8'>
                        {/* Main Picture */}
                        <div className='relative w-full h-[550px] overflow-clip rounded-lg'>

                            {/* TODO: Place next and prev button here later */}

                           

                           
                            {/* BG Blurred */}
                            <Image fill src={images[0]} alt='Blured Version of Main' className='object-cover blur-md' />

                            {/* Darken */}
                            <div className='bg-black opacity-50 w-full h-full'></div>

                            {/* Main Pic */}
                            <Image fill src={images[0]} alt='Main' className='object-contain' />

                            {/* TODO: Page Numbers */}
                            <p className='absolute bottom-0 justify-self-center drop-shadow-sm mb-2 bg-[#00000033] p-2 px-4 rounded-2xl text-white'>1 / {images.length}</p>

                            {/* TODO: Left Arrow */}
                            <ArrowLeft className='absolute left-0 top-0 bottom-0 justify-self-center self-center ml-2 ' color='white' />

                            {/* TODO: Left Arrow */}
                            <ArrowRight className='absolute right-0 top-0 bottom-0 justify-self-center self-center mr-2' color='white' />

                        </div>

                        {/* Thumb Nails */}

                        <div className='flex gap-2'>
                            {images.map((img, i) => (
                                <div key={i} className='h-[100px] w-full relative rounded-md overflow-hidden'>
                                    <Image src={img} alt="" fill className="object-cover" />
                                </div>
                            ))}
                        </div>

                        {/* Circly Pages */}

                        <div className='flex flex-row gap-2 justify-center'>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                            <div className='h-3 w-3 rounded-full bg-accent'></div>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                            <div className='h-3 w-3 rounded-full bg-gray-300'></div>
                        </div>

                        {/* Extra Info Tab */}

                        <div className='w-full flex flex-col gap-4'>
                            {/* Tab */}
                            <div className='flex flex-row *:p-2 *:w-full *:border-b w-full'>
                                <button className='hover:text-white hover:bg-accent border-b-accent text-accent'>Overview</button>
                                <button className='hover:text-white hover:bg-accent'>Package Content</button>
                                <button className='hover:text-white hover:bg-accent'>Releases</button>
                                <button className='hover:text-white hover:bg-accent'>Reviews</button>
                                <button className='hover:text-white hover:bg-accent'>Publisher Info</button>
                            </div>

                            {/* Content */}
                            <div className='flex flex-col gap-4'>
                                <p>{product.product_description}</p>
                                <hr />
                                <p><b>Key Features</b></p>
                                <ul className='list-disc *:ml-4'>
                                    <li>Low-poly</li>
                                    <li>Completely modular</li>
                                    <li>Fully Rigged</li>
                                    <li>Apple Blendshapes</li>
                                    <li>Adjustable Body Parts</li>
                                    <li>Easy Color Change</li>
                                    <li>Plenty of unique hairstyles</li>
                                    <li>Advanced materials</li>
                                </ul>
                            </div>
                        </div>

                        {/* More from SELLER */}

                        <div className='flex flex-col gap-8'>
                            {/* More from SELLER */}
                            <div className='flex flex-row justify-between'>
                                <h2 className='font-bold text-2xl text-center lg:text-left'>More from Seller</h2>
                                <Button variant={'red_link'}>See More</Button>
                            </div>

                            {/* More from SELLER container... */}

                            <div className='grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'>
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.5}
                                    reviews={215}
                                    author="ArtySlayer"
                                    price="Free"
                                    imageSrc="/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg"
                                    // Add parameters to link, like the ID of the product or some shit
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.1}
                                    reviews={152}
                                    author="Baldo64"
                                    price="Free"
                                    imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.7}
                                    reviews={611}
                                    author="Manufactura K4"
                                    price="Free"
                                    imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.7}
                                    reviews={611}
                                    author="Manufactura K4"
                                    price="Free"
                                    imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                    link='/product-detail'
                                />
                            </div>
                        </div>

                        {/* You might like */}

                        <div className='flex flex-col gap-8'>
                            {/* You might like */}
                            <div className='flex flex-row justify-between'>
                                <h2 className='font-bold text-2xl text-center lg:text-left'>You Might Like</h2>
                                <Button variant={'red_link'}>See More</Button>
                            </div>

                            {/* You might like container... */}

                            <div className='grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'>
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.5}
                                    reviews={215}
                                    author="ArtySlayer"
                                    price="Free"
                                    imageSrc="/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg"
                                    // Add parameters to link, like the ID of the product or some shit
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.1}
                                    reviews={152}
                                    author="Baldo64"
                                    price="Free"
                                    imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.7}
                                    reviews={611}
                                    author="Manufactura K4"
                                    price="Free"
                                    imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                    link='/product-detail'
                                />
                                <ProductCard
                                    title="ROCK & BOULDERS 2"
                                    subtitle="Rock and Boulders 2"
                                    rating={4.7}
                                    reviews={611}
                                    author="Manufactura K4"
                                    price="Free"
                                    imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                    link='/product-detail'
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className='w-full flex flex-col gap-4'>
                        {/* Product Name */}
                        <h1 className='font-bold text-4xl'>{product.product_name}</h1>

                        {/* Product Creator and Reviews Summary */}
                        <div className='flex flex-row justify-between'>
                            <p>{seller.user_fullname}</p>

                            {/* Ratings */}
                            <div className='flex flex-row justify-between gap-2'>
                                {/* TODO: temporary stars lang muna toh */}
                                <div className='flex flex-row'>
                                    <p>⭐</p>
                                    <p>⭐</p>
                                    <p>⭐</p>
                                    <p>⭐</p>
                                    <p>⭐</p>
                                </div>
                                {/* Ratings Ratio and Count */}
                                <div className='flex flex-row gap-1'>
                                    <p>5.0</p>
                                    <p>(43)</p>
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div className=''>
                            <h1 className='font-bold text-3xl'>${product.price}</h1>
                        </div>

                        {/* Buttons */}
                        <div className='flex flex-row justify-between gap-8'>
                            <Button variant={'red_default'} className='w-full'>Add to Cart</Button>
                            <Heart color='#E11D48' className='h-full aspect-square w-max' />
                        </div>

                    </div>

                </div>

            </main>
        </Suspense>
    )
}

export default page
