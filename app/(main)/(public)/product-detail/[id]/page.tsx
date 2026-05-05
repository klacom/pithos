"use client";

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { toast } from 'sonner';
import { addToCart, addToFavorites } from './actions';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Page = () => {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    // Gallery State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const images = [
        "/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg",
        "/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg",
        "/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg",
        "/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
    ];

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentImageIndex((prevIndex) => {
            let nextIndex = prevIndex + newDirection;
            if (nextIndex < 0) nextIndex = images.length - 1;
            if (nextIndex >= images.length) nextIndex = 0;
            return nextIndex;
        });
    };

    const handleAddToCart = async () => {
        if (!productId) return;
        const result = await addToCart(productId);
        if (result.success) {
            toast.success("Added to cart!");
        } else {
            toast.error(result.error || "Failed to add to cart");
        }
    };

    const handleAddToFavorites = async () => {
        if (!productId) return;
        const result = await addToFavorites(productId);
        if (result.success) {
            toast.success(result.action === 'added' ? "Added to favorites!" : "Removed from favorites!");
        } else {
            toast.error(result.error || "Failed to update favorites");
        }
    };

    const handleBuyNow = async () => {
        if (!productId) return;
        const result = await addToCart(productId);
        if (result.success) {
            toast.success("Added to cart! Redirecting to checkout...");
            router.push('/shopping-cart/checkout');
        } else {
            toast.error(result.error || "Failed to process Buy Now");
        }
    };

    return (
        <main className='flex flex-col gap-8 px-4 md:px-20 lg:px-40 xl:px-60 2xl:px-80 w-full mb-4'>
            <Button variant={'red_ghost'} className='self-start' onClick={() => window.history.back()}>
                <ArrowLeft size={16} />
                Go Back
            </Button>

            <div className='grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8 w-full'>
                <div className='w-full flex flex-col gap-8'>
                    {/* Main Picture with Animation */}
                    <div className='relative w-full h-[300px] md:h-[550px] overflow-hidden rounded-lg group bg-black'>
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentImageIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="absolute inset-0"
                            >
                                <Image 
                                    fill 
                                    src={images[currentImageIndex]} 
                                    alt='Product view' 
                                    className='object-contain' 
                                    priority 
                                />
                            </motion.div>
                        </AnimatePresence>
                        
                        {/* Page Numbers */}
                        <p className='absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 p-2 px-4 rounded-2xl text-white text-xs md:text-sm font-medium'>
                            {currentImageIndex + 1} / {images.length}
                        </p>
                        
                        {/* Arrows */}
                        <button 
                            onClick={() => paginate(-1)}
                            className='absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100'
                        >
                            <ArrowLeft color='white' size={24} />
                        </button>
                        <button 
                            onClick={() => paginate(1)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100'
                        >
                            <ArrowRight color='white' size={24} />
                        </button>
                    </div>

                    {/* Thumbnails */}
                    <div className='flex flex-row gap-2 overflow-x-auto pb-2 scrollbar-hide'>
                        {images.map((src, index) => (
                            <div 
                                key={index} 
                                onClick={() => {
                                    setDirection(index > currentImageIndex ? 1 : -1);
                                    setCurrentImageIndex(index);
                                }}
                                className={`h-[80px] md:h-[100px] aspect-square relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index ? 'border-accent ring-2 ring-accent/20' : 'border-transparent hover:border-accent/50'}`}
                            >
                                <Image fill src={src} alt={`Thumbnail ${index + 1}`} className='object-cover' />
                            </div>
                        ))}
                    </div>

                    {/* Indicators */}
                    <div className='flex flex-row gap-2 justify-center'>
                        {images.map((_, i) => (
                            <div 
                                key={i} 
                                onClick={() => {
                                    setDirection(i > currentImageIndex ? 1 : -1);
                                    setCurrentImageIndex(i);
                                }}
                                className={`h-2 w-2 rounded-full cursor-pointer transition-all ${i === currentImageIndex ? 'bg-accent w-4' : 'bg-gray-300'}`}
                            ></div>
                        ))}
                    </div>

                    {/* Extra Info */}
                    <div className='w-full flex flex-col gap-4'>
                        <div className='flex flex-row *:p-2 *:w-full *:border-b w-full text-sm md:text-base'>
                            <button className='hover:text-white hover:bg-accent border-b-accent text-accent transition-colors font-medium'>Overview</button>
                            <button className='hover:text-white hover:bg-accent transition-colors'>Package Content</button>
                            <button className='hover:text-white hover:bg-accent transition-colors'>Releases</button>
                            <button className='hover:text-white hover:bg-accent transition-colors'>Reviews</button>
                            <button className='hover:text-white hover:bg-accent transition-colors'>Publisher Info</button>
                        </div>

                        <div className='flex flex-col gap-4 py-4'>
                            <p className='text-muted-foreground leading-relaxed'>
                               3D models of stellar sci-fi characters with many customization options! ARKit blendshapes, Epic Skeleton rig, and many color options. Assets are made with top-notch quality in mind.
                            </p>
                            <hr />
                            <p className='font-bold text-lg'>Key Features</p>
                            <ul className='list-disc *:ml-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground'>
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

                    {/* More from Seller */}
                    <div className='flex flex-col gap-8'>
                        <div className='flex flex-row justify-between items-center border-l-4 border-accent pl-4'>
                            <h2 className='font-bold text-2xl'>More from Seller</h2>
                            <Button variant={'red_link'}>See More</Button>
                        </div>
                        <div className='grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                            <ProductCard
                                title="ROCK & BOULDERS 2"
                                subtitle="Rock and Boulders 2"
                                rating={4.5}
                                reviews={215}
                                author="ArtySlayer"
                                price="Free"
                                imageSrc="/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg"
                                link='/product-detail/rock-and-boulders-2'
                            />
                            <ProductCard
                                title="FANTASY CHARACTERS"
                                subtitle="Fantasy Characters Pack"
                                rating={4.1}
                                reviews={152}
                                author="Lark Bolotaolo"
                                price="$45.00"
                                imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                link='/product-detail/fantasy-characters-pack'
                            />
                            <ProductCard
                                title="SCIFI ENVIRONMENT"
                                subtitle="Sci-Fi Environment"
                                rating={4.7}
                                reviews={611}
                                author="Manufactura K4"
                                price="$25.00"
                                imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                link='/product-detail/scifi-environment'
                            />
                            <ProductCard
                                title="NATURE PACK"
                                subtitle="Ultimate Nature Pack"
                                rating={4.8}
                                reviews={89}
                                author="ForestMaster"
                                price="$15.00"
                                imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                link='/product-detail/ultimate-nature-pack'
                            />
                        </div>
                    </div>

                    {/* You might like */}
                    <div className='flex flex-col gap-8 mb-12'>
                        <div className='flex flex-row justify-between items-center border-l-4 border-accent pl-4'>
                            <h2 className='font-bold text-2xl'>You Might Like</h2>
                            <Button variant={'red_link'}>See More</Button>
                        </div>
                        <div className='grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                            <ProductCard
                                title="CYBERPUNK CITY"
                                subtitle="Cyberpunk City Kit"
                                rating={4.9}
                                reviews={1024}
                                author="NeonStudio"
                                price="$89.00"
                                imageSrc="/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg"
                                link='/product-detail/cyberpunk-city-kit'
                            />
                            <ProductCard
                                title="MEDIEVAL WEAPONS"
                                subtitle="Medieval Weapons Pack"
                                rating={4.6}
                                reviews={342}
                                author="SmithyForge"
                                price="$29.00"
                                imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                link='/product-detail/medieval-weapons-pack'
                            />
                            <ProductCard
                                title="STYLIZED TREES"
                                subtitle="Stylized Trees"
                                rating={4.4}
                                reviews={56}
                                author="Artisan"
                                price="Free"
                                imageSrc="/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg"
                                link='/product-detail/stylized-trees'
                            />
                            <ProductCard
                                title="SPACE SHIP"
                                subtitle="Modular Space Ship"
                                rating={4.7}
                                reviews={128}
                                author="AstroBuilder"
                                price="$55.00"
                                imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
                                link='/product-detail/modular-space-ship'
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Actions */}
                <div className='w-full flex flex-col gap-6 lg:sticky lg:top-24 h-fit'>
                    <div className='flex flex-col gap-2'>
                        <h1 className='font-bold text-2xl md:text-3xl leading-tight'>Stellar Sci-Fi Pack: Male and Female Characters</h1> 
                        <div className='flex flex-row items-center justify-between text-sm text-muted-foreground'>
                            <p className='hover:text-accent cursor-pointer transition-colors'>Lark Bolotaolo</p>
                            <div className='flex items-center gap-2'>
                                <div className='flex text-yellow-400'>
                                    {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                                </div>
                                <p className='font-medium text-foreground'>5.0 <span className='text-muted-foreground font-normal'>(43)</span></p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-primary/5 p-6 rounded-xl border border-primary/10 flex flex-col gap-6'>
                        <div className='flex flex-col gap-1'>
                            <p className='text-sm text-muted-foreground font-medium uppercase tracking-wider'>Price</p>
                            <h2 className='font-bold text-4xl text-primary'>$67.00</h2>
                        </div>

                        <div className='flex flex-col gap-3'>
                            <div className='flex flex-row gap-3 w-full'>
                                <Button 
                                    variant={'red_default'} 
                                    className='flex-1 h-14 gap-2 text-lg font-semibold shadow-lg shadow-accent/20 active:scale-95 transition-all'
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart size={22} />
                                    Add to Cart
                                </Button>
                                <Button 
                                    variant={'outline'} 
                                    className='h-14 w-14 p-0 border-accent/30 hover:bg-accent/10 group active:scale-95 transition-all'
                                    onClick={handleAddToFavorites}
                                >
                                    <Heart className='text-accent group-hover:fill-accent transition-all' size={26} />
                                </Button>
                            </div>
                            <Button 
                                variant={'default'} 
                                className='w-full h-14 gap-2 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all'
                                onClick={handleBuyNow}
                            >
                                <Zap size={22} className="fill-current" />
                                Buy Now
                            </Button>
                        </div>
                        
                        <p className='text-[10px] text-center text-muted-foreground leading-tight px-4'>
                            By clicking 'Buy Now' or 'Add to Cart', you agree to our Terms of Service and Licensing Agreements.
                        </p>
                    </div>

                    <div className='flex flex-col gap-4 text-sm bg-muted/30 p-4 rounded-lg'>
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>License</span>
                            <span className='font-medium'>Standard</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Format</span>
                            <span className='font-medium'>.FBX, .OBJ</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Size</span>
                            <span className='font-medium'>1.2 GB</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Page;
