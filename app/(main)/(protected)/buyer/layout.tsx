import NavBarBuyer from '@/components/buyer/NavBarBuyer'
import React, { ReactNode } from 'react'
import BuyerMainLayout from '@/components/BuyerMainLayout'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='h-full w-full flex flex-col items-center'>
            <NavBarBuyer />
            <BuyerMainLayout children={children} />
        </div>
    )
}

export default layout