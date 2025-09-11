import { SignIn } from '@clerk/nextjs';

// Force dynamic rendering to prevent prerendering issues with Clerk
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <SignIn />
    </div>
  );
}
