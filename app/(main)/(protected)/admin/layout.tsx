import { ReactNode } from 'react'
import NavBarLoader from '@/components/NavBarLoader'
import NavBar from '@/components/NavBar'
import AdminMainLayout from '@/components/admin/AdminMainLayout'
import { Suspense } from 'react'

const layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className='h-full w-full flex flex-col items-center'>
            <Suspense fallback={<NavBar role={null} />}>
                <NavBarLoader />
            </Suspense>
            <AdminMainLayout children={children} />
        </div>
    )
}

export default layout