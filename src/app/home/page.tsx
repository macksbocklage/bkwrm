'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import EpubUpload from '@/components/EpubUpload';
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
          <h1 className="text-2xl font-bold mb-4 font-editors-note">Please Sign In to Access the Dashboard</h1>
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
              <motion.button
                onClick={() => setShowUpload(!showUpload)}
                className="bg-white text-black font-editors-note px-4 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showUpload ? 'View Library' : 'upload'}
              </motion.button>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
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
          
          <AnimatePresence mode="wait">
            {showUpload ? (
              <motion.div 
                key="upload"
                className="bg-white rounded-lg p-8 border border-gray-200"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  mass: 0.6
                }}
              >
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <h3 className="text-2xl font-semibold mb-2 font-editors-note">Upload Your EPUB</h3>
                  <p className="text-black">Select an EPUB file to begin reading with our enhanced reader experience.</p>
                </motion.div>

                <AnimatePresence>
                  {uploadError && (
                    <motion.div 
                      className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-red-800">{uploadError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <EpubUpload onFileSelect={handleFileSelect} />

                <AnimatePresence>
                  {isUploading && (
                    <motion.div 
                      className="mt-6 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="inline-flex items-center text-black">
                        <motion.div 
                          className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Uploading and processing your EPUB...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  mass: 0.6
                }}
              >
                <BookLibrary onBookSelect={handleBookSelect} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </PageTransition>
  );
}
