import React from 'react'
import { cn } from '@/lib/utils'

const BurgerBtn = ({open, setOpen, isHeader = false} : {open : boolean, setOpen : (open : boolean) => void, isHeader?: boolean}) => {
  return (
    <button
        onClick={() => setOpen(!open)}
        className={cn(
            "w-10 h-10 flex flex-col justify-center items-center gap-1 z-30 transition-all",
            isHeader ? "relative" : "fixed top-4 right-4"
        )}
        >   
        <span className={cn("w-8 h-1 bg-accent transition-all", open && 'rotate-45 translate-y-2 bg-white')} />
        <span className={cn("w-8 h-1 bg-accent transition-all", open && 'opacity-0 bg-white')} />
        <span className={cn("w-8 h-1 bg-accent transition-all", open && '-rotate-45 -translate-y-2 bg-white')} />
    </button>
  )
}

export default BurgerBtn