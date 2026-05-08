import React from 'react'
// TODO: For every string in array map as an option
const FilterBy = ({filterOptions} : {filterOptions : Array<string>}) => {
  return (
    <select name="Filter By Users" aria-placeholder='Filter By' className='border-muted outline-none focus:border-foreground focus:ring-foreground h-full hover:border hover:border-foreground bg-primary-foreground rounded-md'>
        <option value="Filter By">Filter By</option>
        <option value="Filter By">Filter By</option>
        <option value="Filter By">Filter By</option>
    </select>
  )
}

export default FilterBy
