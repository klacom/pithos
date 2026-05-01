import NavBar from '@/components/NavBar'
import { ReactNode } from 'react'
import { Suspense } from 'react'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='flex-1 w-full flex flex-col gap-4 items-center'>
            <Suspense>
                <NavBar />
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