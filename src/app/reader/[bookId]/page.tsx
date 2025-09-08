'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TestEpubReader from '@/components/TestEpubReader';
import PageTransition from '@/components/PageTransition';
import { Book } from '@/lib/types';
import { useBooks } from '@/hooks/useBooks';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateBook } = useBooks();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookId = params.bookId as string;
        console.log('Fetching book with ID:', bookId);
        
        if (!bookId) {
          setError('Invalid book ID');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/books/${bookId}`);
        console.log('Book API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Book API error:', errorData);
          
          if (response.status === 404) {
            setError('Book not found');
          } else {
            setError(`Failed to load book: ${errorData.details || errorData.error || 'Unknown error'}`);
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Book data received:', data);
        
        if (data.book) {
          console.log('Book file URL:', data.book.file_url);
          // Use the proxy endpoint instead of direct file URL
          const proxyUrl = `/api/books/${params.bookId}/file`;
          console.log('Using proxy URL:', proxyUrl);
        }
        
        setBook(data.book);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book');
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [params.bookId]);

  const handleClose = () => {
    router.push('/home');
  };

  const handleProgressUpdate = async (progress: number, location?: string) => {
    if (book) {
      const updateData: any = { 
        reading_progress: progress,
        last_read_at: new Date().toISOString()
      };
      
      if (location) {
        updateData.current_location = location;
      }
      
      await updateBook(book.id, updateData);
    }
  };

  if (isLoading) {
    return (
      <PageTransition className="bg-white min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-black flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 20,
            mass: 0.8
          }}
        >
          <motion.div 
            className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>Loading Book...</span>
        </motion.div>
      </PageTransition>
    );
  }

  if (error || !book) {
    return (
      <PageTransition className="bg-white min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-black text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 20,
            mass: 0.8
          }}
        >
          <motion.h2 
            className="text-xl font-bold mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {error || 'Book Not Found'}
          </motion.h2>
          <motion.button
            onClick={handleClose}
            className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Return to Home
          </motion.button>
        </motion.div>
      </PageTransition>
    );
  }

  return (
    <TestEpubReader 
      filePath={book.file_url} 
      onClose={handleClose}
      onProgressUpdate={handleProgressUpdate}
      bookTitle={book.title}
      bookAuthor={book.author}
      bookId={book.id}
      initialLocation={book.current_location}
    />
  );
}
