'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import BookLibrary from '@/components/BookLibrary';
import PageTransition from '@/components/PageTransition';
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
        <div className="text-black text-center">
          <h1 className="text-2xl font-bold mb-4 font-editors-note">Loading...</h1>
          <a href="/" className="text-black hover:underline">Sign In</a>
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
    <PageTransition className="bg-white min-h-screen font-geist-sans">
      <motion.header 
        className="border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 1
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1 
              className="text-xl font-semibold text-black font-editors-note"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              BKWRM
            </motion.h1>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <UserButton afterSignOutUrl="/" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="text-"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.h2 
            className="text-3xl mb-4 font-editors-note"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Welcome Home, {user?.firstName ? <strong>{user.firstName}</strong> : user?.emailAddresses[0].emailAddress}.
          </motion.h2>
          <motion.p 
            className="text-black mb-8 font-inter tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            What will we read today?
          </motion.p>
          
          <BookLibrary 
            onBookSelect={handleBookSelect}
            showUpload={showUpload}
            onToggleUpload={() => setShowUpload(!showUpload)}
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
            uploadError={uploadError}
          />
        </motion.div>
      </main>
    </PageTransition>
  );
}
