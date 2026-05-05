import React, { ReactNode } from 'react'
import BuyerMainLayout from '@/components/BuyerMainLayout'
import NavBar from '@/components/NavBar'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='h-full w-full flex flex-col items-center'>
            <NavBar role="buyer"/>
            <BuyerMainLayout children={children} />
        </div>
    )
}

export default layout