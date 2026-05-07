import { ReactNode } from 'react'

const CardStat = ({ header, subHeader, icon }: { header: string, subHeader: string, icon: ReactNode }) => {
  return (
    <div className='rounded-lg border border-muted p-6 flex flex-row gap-8 justify-between w-full'>
      <div className='flex flex-col justify-center'>
        <h3 className='text-xl font-bold'>{header}</h3>
        <p className='text-sm'>{subHeader}</p>
      </div>

      <div className='rounded-md items-center justify-center flex aspect-square'>
        {icon}
      </div>
    </div>
  )
}

export default CardStat
