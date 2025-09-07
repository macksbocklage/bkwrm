'use client';

import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';

interface TestEpubReaderProps {
  filePath: string;
  onClose: () => void;
  onProgressUpdate?: (progress: number) => void;
  bookTitle?: string;
  bookAuthor?: string;
}

export default function TestEpubReader({ 
  filePath, 
  onClose, 
  onProgressUpdate,
  bookTitle,
  bookAuthor 
}: TestEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [progress, setProgress] = useState(0);

  // Calculate progress based on location
  useEffect(() => {
    if (typeof location === 'number' && onProgressUpdate) {
      const newProgress = Math.round(location * 100);
      setProgress(newProgress);
      onProgressUpdate(newProgress);
    }
  }, [location, onProgressUpdate]);

  console.log('TestEpubReader filePath:', filePath);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {bookTitle || 'EPUB Reader'}
            </h1>
            {bookAuthor && (
              <p className="text-sm text-black">by {bookAuthor}</p>
            )}
            <p className="text-xs text-black">File: {filePath}</p>
          </div>
          <div className="flex items-center gap-4">
            {progress > 0 && (
              <div className="text-sm text-black">
                Progress: {progress}%
              </div>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <ReactReader
          url={filePath}
          location={location}
          locationChanged={setLocation}
          loadingView={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p>Loading EPUB...</p>
                <p className="text-sm text-black">File: {filePath}</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
