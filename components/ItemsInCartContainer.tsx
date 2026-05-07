import CartItem from "./CartItem";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

const ItemsInCartContainer = () => {
  const checkBoxAndOtherGap = 8;
  return (
    <Card className="p-8 flex flex-col gap-4">
        {/* TODO: Click checkbox here - check all checkboxes or uncheck all checkboxes */}
        
        {/* Header */}

        <div className={`flex flex-row gap-2 md:gap-${checkBoxAndOtherGap} items-center`}>
            <input type="checkbox" name="" id="" className="rounded"/>
            <h2 className="text-xl md:text-2xl font-semibold">2 items in your cart</h2>
        </div>

        {/* Items */}

        <div className="flex flex-col gap-4">
          <CartItem checkBoxAndOtherGap={checkBoxAndOtherGap} />
          <CartItem checkBoxAndOtherGap={checkBoxAndOtherGap} />
        </div>

        {/* Extra Info */}

        <div className="flex flex-row justify-between items-center">
          <Button variant={'ghost'}>Clear Cart</Button>
          <h2 className="font-semibold text-sm md:text-md">Subtotal (2) items: $134.00</h2>
        </div>

    </Card>
  )
}

export default ItemsInCartContainer
