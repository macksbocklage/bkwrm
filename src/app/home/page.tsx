'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EpubUpload from '@/components/EpubUpload';
import BookLibrary from '@/components/BookLibrary';
import { useBooks } from '@/hooks/useBooks';
import { Book } from '@/lib/types';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { uploadBook } = useBooks();

  if (!isSignedIn) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center font-geist-sans">
        <div className="text-gray-900 text-center">
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
      const book = await uploadBook(file);

      if (book) {
        // Redirect to reader page with the book ID
        router.push(`/reader/${book.id}`);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBookSelect = (book: Book) => {
    router.push(`/reader/${book.id}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-geist-sans">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">BKWRM</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
              >
                {showUpload ? 'View Library' : 'Upload Book'}
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-gray-900">
          <h2 className="text-3xl font-bold mb-4">Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!</h2>
          <p className="text-gray-600 mb-8">Manage your EPUB library and enjoy intelligent reading.</p>
          
          {showUpload ? (
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-center mb-8">
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span>Uploading and processing your EPUB...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <BookLibrary onBookSelect={handleBookSelect} />
          )}
        </div>
      </main>
    </div>
  );
}
