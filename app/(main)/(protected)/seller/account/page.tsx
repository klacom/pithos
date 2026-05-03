import { Card } from '@/components/ui/card'
import OnboardingBtn from '@/components/OnboardingBtn'
import { PayPal } from '@deemlol/next-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const page = () => {
  return (
    <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'> 
      <div className='flex flex-col gap-2'>
        <h1 className='font-bold text-3xl'>Account Settings</h1>
        <p className='text-muted-foreground'>Manage your seller profile, store details, and payment methods.</p>
      </div>
      <hr />

      {/* Store Profile Section */}
      <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex flex-col gap-4 w-full lg:w-1/4'>
            <h1 className='font-bold text-2xl'>Store Profile</h1>
            <p className='text-muted-foreground'>Update your stores public information and how buyers see you.</p>
          </div>
          <div className='flex flex-col gap-4 w-full lg:w-3/4'>
            <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='store-name'>Store Name</Label>
                <Input id='store-name' placeholder='Your awesome store name' defaultValue="Lark's Digital Assets" />
              </div>
              
              <div className='flex flex-col gap-2'>
                <Label htmlFor='seller-email'>Contact Email</Label>
                <Input id='seller-email' type='email' placeholder='Email for buyers to reach you' defaultValue="larkirk@gmail.com" />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='store-bio'>Store Bio / Description</Label>
                <Textarea id='store-bio' placeholder='Tell buyers about what you create...' rows={4} defaultValue="Creating high quality 2D and 3D assets for indie game developers." />
              </div>

              <div className='flex justify-end'>
                <Button variant='red_default'>Save Changes</Button>
              </div>
            </Card>
          </div>
      </div>

      <hr />

      {/* Payment Methods Section */}
      <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex flex-col gap-4 w-full lg:w-1/4'>
            <h1 className='font-bold text-2xl'>Payment Methods</h1>
            <p className='text-muted-foreground'>Provide a better customer service by setting up a hassle-free online payment method.</p>
          </div>
          <div className='flex flex-col gap-6 w-full lg:w-3/4'>

            <Card className='w-full p-6 bg-primary-foreground border border-muted rounded-lg flex flex-col gap-4'>
              <h2 className='font-semibold flex gap-2 text-xl items-center'><PayPal/>PayPal</h2>
              <ul className='list-disc p-4 px-8 text-muted-foreground'>
                <li>Help drive conversion by offering customers a seamless checkout experience with no setup monthly fees.</li>
                <li>A single integrated payment system ensures you stay updated with the latest payment methods.</li>
                <li>Accept major credit/debit cards and alternative local payment methods through the PayPal wallet.</li>
              </ul>
              <div>
                <OnboardingBtn content='Connect With PayPal'  />
              </div>
            </Card>

            <Card className='w-full p-6 bg-primary-foreground border border-muted rounded-lg flex flex-col gap-4'>
              <h2 className='font-semibold flex gap-2 text-xl items-center'>GCash</h2>
              <ul className='list-disc p-4 px-8 text-muted-foreground'>
                <li>Enable local buyers to pay securely through GCash, the leading mobile wallet in the Philippines.</li>
                <li>Fast and real-time reflection of successful payments to your seller account.</li>
                <li>Provide a seamless QR or mobile number checkout experience for mobile users.</li>
              </ul>
              <div>
                <Button variant={'outline'} disabled>
                    Connect With GCash (Coming Soon)
                </Button>
              </div>
            </Card>

          </div>
      </div>
      
      {/* Security Section */}
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
