"use client"

import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
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

type Review = {
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    buyer_id?: string;
    buyer_name?: string;
};

type RelatedProduct = {
    id: string;
    title: string;
    subtitle: string;
    rating: number;
    reviews: number;
    author: string;
    price: string;
    imageSrc: string;
    link: string;
};

const page = () => {

    const { product_id } = useParams();

    console.log("Product ID: ", product_id);

    const [product, setProduct] = useState<any>(null)
    const [images, setImages] = useState<string[]>([])
    const [seller, setSeller] = useState<any>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [activeTab, setActiveTab] = useState("Overview");
    const [moreFromSeller, setMoreFromSeller] = useState<RelatedProduct[]>([]);
    const [youMightLike, setYouMightLike] = useState<RelatedProduct[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Parse product description to extract sections
    const parseProductDescription = (desc: string | null) => {
        if (!desc) return { category: "", tags: [], body: "" };

        const lines = desc.split('\n');
        let category = "";
        let tags = "";
        let body = desc;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("Category:")) {
                category = lines[i].replace("Category:", "").trim();
            } else if (lines[i].startsWith("Tags:")) {
                tags = lines[i].replace("Tags:", "").trim();
            }
        }

        return { category, tags: tags.split(",").map(t => t.trim()).filter(Boolean), body };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/product/${product_id}`)
                const data = await res.json()

                if (!res.ok) {
                    console.error(data.error)
                    return
                }

                setProduct(data.product);
                setImages(data.images);
                setSeller(data.user);

                // Fetch reviews
                const reviewRes = await fetch(`/api/product/${product_id}/reviews`)
                if (reviewRes.ok) {
                    const reviewData = await reviewRes.json();
                    setReviews(reviewData.reviews || []);
                    setAvgRating(reviewData.avgRating || 0);
                    setReviewCount(reviewData.reviewCount || 0);
                }

                // Fetch more from seller
                const sellerProductsRes = await fetch(`/api/seller/${data.product.seller_owner_id}/products?exclude=${product_id}&limit=4`)
                if (sellerProductsRes.ok) {
                    const sellerProducts = await sellerProductsRes.json();
                    setMoreFromSeller(sellerProducts.products || []);
                }

                // Fetch you might like (random other products)
                const suggestedRes = await fetch(`/api/products/suggested?exclude=${product_id}&limit=4`)
                if (suggestedRes.ok) {
                    const suggested = await suggestedRes.json();
                    setYouMightLike(suggested.products || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        }

        if (product_id) {
            fetchData()
        }
    }, [product_id])

    if (!product) return <div className='flex items-center justify-center min-h-screen'>Loading...</div>

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    className={i <= Math.round(rating) ? 'fill-accent text-accent' : 'text-gray-400'}
                />
            );
        }
        return stars;
    };

    const formatPrice = (price: number) => {
        return price === 0 ? "Free" : `$${price.toFixed(2)}`;
    };

    const currentImage = images[currentImageIndex] || images[0];

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const tabs = ["Overview", "Package Content", "Releases", "Reviews", "Publisher Info"];

    const renderTabContent = () => {
        switch (activeTab) {
            case "Overview":
                return (
                    <div className='flex flex-col gap-4'>
                        <p>{product.product_description}</p>
                        <hr />
                        <p><b>Details</b></p>
                        <ul className='list-disc *:ml-4 space-y-2'>
                            <li>Product Name: {product.product_name}</li>
                            <li>Price: {formatPrice(product.price)}</li>
                            <li>Created: {new Date(product.created_at).toLocaleDateString()}</li>
                            <li>Status: {product.product_status || 'Published'}</li>
                        </ul>
                    </div>
                );
            case "Package Content":
                return (
                    <div className='flex flex-col gap-4'>
                        <p className='text-gray-400'>Package information is not yet available.</p>
                        <p>This product is available as a digital asset download.</p>
                    </div>
                );
            case "Releases":
                return (
                    <div className='flex flex-col gap-4'>
                        <p className='text-gray-400'>Release history coming soon.</p>
                    </div>
                );
            case "Reviews":
                return (
                    <div className='flex flex-col gap-6'>
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.id} className='border-b pb-4'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <div className='flex gap-1'>
                                            {renderStars(review.rating)}
                                        </div>
                                        <span className='font-semibold'>{review.rating}/5</span>
                                    </div>
                                    <p className='text-sm text-gray-400'>{new Date(review.created_at).toLocaleDateString()}</p>
                                    <p className='mt-2'>{review.review_text || 'No review text provided'}</p>
                                </div>
                            ))
                        ) : (
                            <p className='text-gray-400'>No reviews yet. Be the first to review this product!</p>
                        )}
                    </div>
                );
            case "Publisher Info":
                return (
                    <div className='flex flex-col gap-4'>
                        <h3 className='font-bold text-lg'>{seller?.user_fullname || 'Unknown Publisher'}</h3>
                        <p className='text-sm text-gray-400'>{seller?.user_email || ''}</p>
                        <hr />
                        <p><b>Publisher Details</b></p>
                        <p>Email: {seller?.user_email || 'Not provided'}</p>
                        <p>Joined: {seller?.created_at ? new Date(seller.created_at).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                );
            default:
                return null;
        }
    };

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

                            {/* BG Blurred */}
                            <Image fill src={currentImage} alt='Blurred Version of Main' className='object-cover blur-md' />

                            {/* Darken */}
                            <div className='bg-black opacity-50 w-full h-full'></div>

                            {/* Main Pic */}
                            <Image fill src={currentImage} alt='Main' className='object-contain' />

                            {/* Page Numbers */}
                            <p className='absolute bottom-0 left-1/2 transform -translate-x-1/2 drop-shadow-sm mb-2 bg-[#00000033] p-2 px-4 rounded-2xl text-white'>
                                {currentImageIndex + 1} / {images.length}
                            </p>

                            {/* Left Arrow */}
                            <button
                                onClick={handlePrevImage}
                                className='absolute left-0 top-0 bottom-0 justify-self-center self-center ml-2 hover:bg-black/20 transition z-10'
                            >
                                <ArrowLeft color='white' size={24} />
                            </button>

                            {/* Right Arrow */}
                            <button
                                onClick={handleNextImage}
                                className='absolute right-0 top-0 bottom-0 justify-self-center self-center mr-2 hover:bg-black/20 transition z-10'
                            >
                                <ArrowRight color='white' size={24} />
                            </button>

                        </div>

                        {/* Thumbnails */}

                        <div className='flex gap-2 overflow-x-auto'>
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`h-[100px] w-[100px] relative rounded-md overflow-hidden flex-shrink-0 border-2 ${currentImageIndex === i ? 'border-accent' : 'border-transparent'
                                        }`}
                                >
                                    <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>

                        {/* Circular Page Indicators */}

                        <div className='flex flex-row gap-2 justify-center'>
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`h-3 w-3 rounded-full transition ${currentImageIndex === i ? 'bg-accent' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Extra Info Tabs */}

                        <div className='w-full flex flex-col gap-4'>
                            {/* Tabs */}
                            <div className='flex flex-row *:p-2 *:w-full *:border-b w-full overflow-x-auto'>
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap ${activeTab === tab
                                                ? 'border-b-accent text-accent'
                                                : 'hover:text-white hover:bg-accent/10'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className='flex flex-col gap-4'>
                                {renderTabContent()}
                            </div>
                        </div>

                        {/* More from SELLER */}

                        <div className='flex flex-col gap-8'>
                            {/* More from SELLER */}
                            <div className='flex flex-row justify-between'>
                                <h2 className='font-bold text-2xl text-center lg:text-left'>More from {seller?.user_fullname || 'Seller'}</h2>
                                <Button variant={'red_link'}>See More</Button>
                            </div>

                            {/* More from SELLER container */}

                            {moreFromSeller.length > 0 ? (
                                <div className='grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'>
                                    {moreFromSeller.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            title={product.title}
                                            subtitle={product.subtitle}
                                            rating={product.rating}
                                            reviews={product.reviews}
                                            author={product.author}
                                            price={product.price}
                                            imageSrc={product.imageSrc}
                                            link={product.link}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-400'>No other products from this seller.</p>
                            )}
                        </div>

                        {/* You might like */}

                        <div className='flex flex-col gap-8'>
                            {/* You might like */}
                            <div className='flex flex-row justify-between'>
                                <h2 className='font-bold text-2xl text-center lg:text-left'>You Might Like</h2>
                                <Button variant={'red_link'}>See More</Button>
                            </div>

                            {/* You might like container */}

                            {youMightLike.length > 0 ? (
                                <div className='grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'>
                                    {youMightLike.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            title={product.title}
                                            subtitle={product.subtitle}
                                            rating={product.rating}
                                            reviews={product.reviews}
                                            author={product.author}
                                            price={product.price}
                                            imageSrc={product.imageSrc}
                                            link={product.link}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-400'>Loading recommendations...</p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className='w-full flex flex-col gap-4 sticky top-20 h-fit'>
                        {/* Product Name */}
                        <h1 className='font-bold text-4xl'>{product.product_name}</h1>

                        {/* Product Creator and Reviews Summary */}
                        <div className='flex flex-col gap-2'>
                            <p className='text-gray-400'>{seller?.user_fullname || 'Unknown Publisher'}</p>

                            {/* Ratings */}
                            <div className='flex flex-row items-center gap-3'>
                                <div className='flex flex-row gap-1'>
                                    {renderStars(avgRating)}
                                </div>
                                {/* Ratings Ratio and Count */}
                                <div className='flex flex-row gap-1'>
                                    <p className='font-semibold'>{avgRating.toFixed(1)}</p>
                                    <p className='text-gray-400'>({reviewCount})</p>
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div className=''>
                            <h1 className='font-bold text-3xl'>{formatPrice(product.price)}</h1>
                        </div>

                        {/* Buttons */}
                        <div className='flex flex-row justify-between gap-4'>
                            <Button variant={'red_default'} className='w-full'>Add to Cart</Button>
                            <button className='p-2 hover:bg-accent/10 rounded-lg transition'>
                                <Heart color='#E11D48' className='h-6 w-6' fill='#E11D48' />
                            </button>
                        </div>

                    </div>

                </div>

            </main>
        </Suspense>
    )
}

export default page