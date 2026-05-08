import React from 'react'

const MiniCard = ({title, header} : {title : string, header : string}) => {
  return (
    <div className='bg-background p-3 px-4 rounded-md border border-muted w-full'>
      <p className='text-xs font-light'>{title}</p>
      <h1 className='text-xl font-bold'>{header}</h1>
    </div>
  )
}

export default MiniCard
