'use client';

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <main className="font-sans flex-1 flex flex-col justify-center items-center text-black gap-4">
        <h1 className="text-4xl font-bold">BKWRM</h1>
        <p className="text-base">Your Personal Reading Library</p>
        
        <div className="flex gap-4">
          <div className="bg-white text-black p-2 rounded-md hover:bg-gray-300 transition-all">
            <SignInButton 
              mode="modal" 
              forceRedirectUrl="/home"
            >
              Sign In
            </SignInButton>
          </div>
          <div className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-all">
            <SignUpButton 
              mode="modal" 
              forceRedirectUrl="/home"
            >
              Sign Up
            </SignUpButton>
          </div>
        </div>
      </main>
      <footer className="font-sans flex justify-center items-center text-black">
                
      </footer>
    </div>
  );
}
