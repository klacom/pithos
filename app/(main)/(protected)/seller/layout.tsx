import { ReactNode } from 'react'
import NavBarLoader from '@/components/NavBarLoader'
import NavBar from '@/components/NavBar'
import { Suspense } from 'react'
import SellerMainLayout from '@/components/SellerMainLayout'
type Props = { children: ReactNode }

export default function Layout({ children }: Props) {
    return (
        <div className="h-full w-full flex flex-col items-center">
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>
            <SellerMainLayout>
                {children}
            </SellerMainLayout>
        </div>
    )
}