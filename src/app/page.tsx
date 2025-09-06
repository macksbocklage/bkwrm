'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Image from "next/image";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="bg-black min-h-screen flex flex-col justify-between">
      <main className="font-sans flex-1 flex flex-col justify-center items-center text-white gap-4">
        <h1 className="text-4xl font-bold">Boilerplate</h1>
        <p className="text-base">This is a boilerplate for a Next.js project</p>
        
        {isSignedIn ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!</p>
            <UserButton afterSignOutUrl="/" />
          </div>
        ) : (
          <div className="flex gap-4">
            <SignInButton 
              mode="modal" 
              forceRedirectUrl="/home"
              className="bg-white text-black p-2 rounded-md hover:bg-gray-300 transition-all"
            >
              Sign in
            </SignInButton>
            <SignUpButton 
              mode="modal" 
              forceRedirectUrl="/home"
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-all"
            >
              Sign up
            </SignUpButton>
          </div>
        )}
      </main>
      <footer className="font-sans flex justify-center items-center text-white">
                
      </footer>
    </div>
  );
}
