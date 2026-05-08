import { ReactNode } from 'react'

const ExtendedCardStat = ({header, subHeader, icon, miniCards} : {header : string, subHeader : string, icon : ReactNode, miniCards : Array<ReactNode>}) => {
  return (
    <div className='rounded-lg bg-primary-foreground border border-muted p-6 flex flex-col gap-8 justify-between w-full'>
        <div className="flex flex-row gap-4">
          <div className='rounded-md items-center justify-center flex bg-foreground aspect-square'>
              {icon}
          </div>
          <div className='flex flex-col justify-center'>
              <h3 className='text-xl font-bold'>{header}</h3>
              <p className='text-sm'>{subHeader}</p>
          </div>
        </div>

        <div className='flex flex-row gap-4 w-full'>
          {miniCards}
        </div>

    </div>
  )
}

export default ExtendedCardStat
