import SocialAuthButton from './SocialAuthButton';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type provider = "google" | "facebook" | "github";

type providerType = {
    name: provider;
    label: string;
    icon: string;
    size: number;
}

const providers : providerType[] = [
    {
        name: "google",
        label: "Continue with Google",
        icon: "/soc-med-icons/google.svg",
        size: 24,
    }
]

const SocialAuthButtons = () => {
    const supabase = createClient();
    const handleOAuthLogin = async( provider : provider )=>{
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    }

  return (
    <div className='space-y-2'>
      {providers.map((provider:providerType)=>(
        <SocialAuthButton key={provider.name} action={()=>handleOAuthLogin(provider.name)}>
            <Image 
                src={provider.icon}
                width={provider.size}
                height={provider.size}
                alt={provider.name}
            />
            {provider.label}
        </SocialAuthButton>
      ))}
    </div>
  )
}

export default SocialAuthButtons
