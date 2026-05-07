import { ReactNode } from 'react'
import NavBarLoader from '@/components/navbar/NavBarLoader'
import NavBar from '@/components/navbar/NavBar'
import { Suspense } from 'react'
import SellerMainLayout from '@/components/SellerMainLayout'
type Props = { children: ReactNode }

export default function Layout({ children }: Props) {
    return (
        <div className="h-full w-full flex flex-col items-center">
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>
            <Suspense>
                <SellerMainLayout>
                    {children}
                </SellerMainLayout>
            </Suspense>
        </div>
    )
}