const page = () => {
  return (
    <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'> 
      <div className='flex flex-col gap-2'>
        <h1 className='font-bold text-3xl'>Security Settings</h1>
        <p className='text-muted-foreground'>Your account is protected by Multi-Factor Authentication by default.</p>
      </div>
      <hr />

      <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex flex-col gap-4 w-full lg:w-1/4'>
            <h1 className='font-bold text-2xl'>Account Security</h1>
            <p className='text-muted-foreground'>Multi-Factor Authentication is enabled by default for all accounts.</p>
          </div>
          <div className='flex flex-col gap-4 w-full lg:w-3/4'>
            <p className='text-muted-foreground'>MFA is required for all logins. No further setup needed!</p>
          </div>
      </div>
      
    </div>
  )
}

export default page
