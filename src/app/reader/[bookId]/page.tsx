'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TestEpubReader from '@/components/TestEpubReader';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bookId = params.bookId as string;
    if (bookId) {
      // Construct the file path for the uploaded EPUB
      const path = `/uploads/${bookId}.epub`;
      console.log('Setting file path:', path);
      setFilePath(path);
      setIsLoading(false);
    }
  }, [params.bookId]);

  const handleClose = () => {
    router.push('/home');
  };

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!filePath) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-4">Book not found</h2>
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

  return <TestEpubReader filePath={filePath} onClose={handleClose} />;
}
