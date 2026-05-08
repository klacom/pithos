import React, { ReactNode, Suspense } from 'react'
import BuyerMainLayout from '@/components/buyer/BuyerMainLayout'
import NavBarLoader from '@/components/main-components/navbar/NavBarLoader'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='h-full w-full flex flex-col items-center'>
            <Suspense>
                <NavBarLoader />
            </Suspense>
            <Suspense>
                <BuyerMainLayout children={children} />
            </Suspense>
        </div>
    )
}

export default layout