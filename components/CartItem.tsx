import Image from "next/image"
import { Trash2 } from "@deemlol/next-icons";
import { Heart } from "@deemlol/next-icons";
import { Button } from "./ui/button";

const CartItem = ({checkBoxAndOtherGap} : {checkBoxAndOtherGap : Number}) => {
  return (
    <div className={`flex flex-row gap-2 md:gap-${checkBoxAndOtherGap} items-center justify-between`}>
        <input type="checkbox" name="" id="" className="rounded"/>

        {/* Image Thumbnail */}

        
        <Image src={'/sample-pics/96d4a866c211c472cbef2b19a1de1828.jpg'} width={64} height={64} alt="" className="rounded-md aspect-square object-cover"/>
        

        {/* Typography */}

        <div>
          <h3 className="text-sm md:text-md lg:text-xl font-medium line-clamp-1">Stellar Sci-Fi Pack: Male and Female Character</h3>
          {/* TODO: also make this an href to lark's seller page. */}
          <p className="text-sm font-light">Lark Bolotaolo</p>
        </div>

        {/* Cost */}
        {/* TODO: maybe add deductions or discount? */}

        <div className="flex flex-row items-center">
          <h4 className="font-medium text-sm md:text-md lg:text-lg">$67.00</h4>
        </div>

        {/* Remove Cart and Add to Wishlist */}

        <div className="*:p-2 flex flex-col md:flex-row items-center">
          {/* TODO: Make this a show more (three) dots that shows more when clicked and then it shows the elements */}
          <Button variant={"red_ghost"} size={'lg'}>
            <Trash2 />
          </Button>
          {/* <Button variant={'ghost'}>
            <Heart />
          </Button> */}
        </div>

    </div>
  )
}

export default CartItem
