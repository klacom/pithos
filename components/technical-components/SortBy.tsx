import React from 'react'
// TODO: For every string in array map as an option
const SortBy = ({sortOptions} : {sortOptions : Array<string>}) => {
  return (
    <select name="Filter By Users" aria-placeholder='Filter By' className='border-muted outline-none focus:border-foreground focus:ring-foreground h-full hover:border hover:border-foreground bg-primary-foreground rounded-md'>
        <option value="Sort By">Sort By</option>
        <option value="Sort By">Sort By</option>
        <option value="Sort By">Sort By</option>
    </select>
  )
}

export default SortBy
