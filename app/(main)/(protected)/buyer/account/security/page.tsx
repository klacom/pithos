import MfaSetup from '@/components/MfaSetup'

const page = () => {
  return (
    <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'> 
      <div className='flex flex-col gap-2'>
        <h1 className='font-bold text-3xl'>Security Settings</h1>
        <p className='text-muted-foreground'>Secure your buyer account with Multi-Factor Authentication.</p>
      </div>
      <hr />

      <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex flex-col gap-4 w-full lg:w-1/4'>
            <h1 className='font-bold text-2xl'>Account Security</h1>
            <p className='text-muted-foreground'>Protect your account with additional security layers.</p>
          </div>
          <div className='flex flex-col gap-4 w-full lg:w-3/4'>
            <MfaSetup />
          </div>
      </div>
      
    </div>
  )
}

export default page
