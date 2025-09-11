'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HeroSection } from '@/components/blocks/hero-section-1';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/home');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <HeroSection />
    </div>
  );
}
