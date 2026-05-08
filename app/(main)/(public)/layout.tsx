import { ReactNode } from 'react'
import { Suspense } from 'react'
import NavBarLoader from '@/components/main-components/navbar/NavBarLoader'
import NavBar from '@/components/main-components/navbar/NavBar'
import Footer from '@/components/main-components/footer/Footer'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='flex-1 w-full flex flex-col gap-4 items-center'>
            <Suspense>
                <NavBarLoader />
            </Suspense>
            <main>
                <Suspense>
                    {children}
                </Suspense>
            </main>
            <Suspense>
                <Footer />
            </Suspense>
        </div>
    )
}

export default layout