'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EpubUpload from '@/components/EpubUpload';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center font-geist-sans">
        <div className="text-black text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h1>
          <a href="/" className="text-blue-600 hover:underline">Sign in</a>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to reader page
        router.push(`/reader/${result.fileId}`);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-geist-sans">
      <header className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-black">BKWRM</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-black">
          <h2 className="text-3xl font-bold mb-4">Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!</h2>
          <p className="text-gray-700 mb-8">Upload an EPUB file to start reading with our intelligent reader.</p>
          
          <div className="bg-gray-100 rounded-lg p-8 border border-gray-300">
            <div className="text-center mb-8">
              {/* Removed BookOpen icon */}
              <h3 className="text-2xl font-semibold mb-2">Upload Your EPUB</h3>
              <p className="text-gray-600">Select an EPUB file to begin reading with our enhanced reader experience.</p>
            </div>

            {uploadError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-800">{uploadError}</p>
              </div>
            )}

            <EpubUpload onFileSelect={handleFileSelect} />

            {isUploading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center text-blue-600">
                  {/* Removed Upload icon */}
                  <span>Uploading and processing your EPUB...</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
              <h4 className="text-lg font-semibold mb-2">Smart Reading</h4>
              <p className="text-gray-600 text-sm">AI-powered explanations and insights as you read.</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
              <h4 className="text-lg font-semibold mb-2">Highlight & Annotate</h4>
              <p className="text-gray-600 text-sm">Highlight passages and get contextual explanations.</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
              <h4 className="text-lg font-semibold mb-2">Author Persona</h4>
              <p className="text-gray-600 text-sm">Interact with the book as if the author is explaining it to you.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
