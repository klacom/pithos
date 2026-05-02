import { ReactNode } from 'react'
import SuspendedNav from '@/components/SuspendedNav'
import SellerMainLayout from '@/components/SellerMainLayout'
type Props = {children: ReactNode}

export default function Layout({ children }: Props) {
  return (
    <div className="h-full w-full flex flex-col items-center">
      <SuspendedNav />
      <SellerMainLayout>
        {children}
      </SellerMainLayout>
    </div>
  )
}