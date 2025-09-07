'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Image from "next/image";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <main className="font-sans flex-1 flex flex-col justify-center items-center text-black gap-4">
        <h1 className="text-4xl font-bold">BKWRM</h1>
        <p className="text-base">Your Personal Reading Library</p>
        
        {isSignedIn ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!</p>
            <UserButton afterSignOutUrl="/" />
          </div>
        ) : (
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
        )}
      </main>
      <footer className="font-sans flex justify-center items-center text-black">
                
      </footer>
    </div>
  );
}
