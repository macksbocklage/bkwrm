'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestEpubReader from '@/components/TestEpubReader';
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

  const handleProgressUpdate = async (progress: number) => {
    if (book) {
      await updateBook(book.id, { 
        reading_progress: progress,
        last_read_at: new Date().toISOString()
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span>Loading book...</span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-4">{error || 'Book not found'}</h2>
          <button
            onClick={handleClose}
            className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <TestEpubReader 
      filePath={book.file_url} 
      onClose={handleClose}
      onProgressUpdate={handleProgressUpdate}
      bookTitle={book.title}
      bookAuthor={book.author}
    />
  );
}
