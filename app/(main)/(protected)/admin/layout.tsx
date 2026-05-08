import { ReactNode } from 'react'
import NavBarLoader from '@/components/main-components/navbar/NavBarLoader'
import NavBar from '@/components/main-components/navbar/NavBar'
import AdminMainLayout from '@/components/admin/AdminMainLayout'
import { Suspense } from 'react'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='h-full w-full flex flex-col items-center'>
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>
            <Suspense>
                <AdminMainLayout children={children} />
            </Suspense>
        </div>
    )
}

export default layout