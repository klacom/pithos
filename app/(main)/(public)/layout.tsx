import { ReactNode } from 'react'
import { Suspense } from 'react'
import NavBarLoader from '@/components/navbar/NavBarLoader'
import NavBar from '@/components/navbar/NavBar'

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
        </div>
    )
}

export default layout