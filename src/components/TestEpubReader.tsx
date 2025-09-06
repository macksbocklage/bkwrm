'use client';

import React, { useState } from 'react';
import { ReactReader } from 'react-reader';

interface TestEpubReaderProps {
  filePath: string;
  onClose: () => void;
}

export default function TestEpubReader({ filePath, onClose }: TestEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);

  console.log('TestEpubReader filePath:', filePath);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-bold">Test EPUB Reader</h1>
        <p className="text-sm text-gray-600">File: {filePath}</p>
        <button 
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
        >
          Close
        </button>
      </div>
      
      <div className="flex-1">
        <ReactReader
          url={filePath}
          location={location}
          locationChanged={setLocation}
          loadingView={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading EPUB...</p>
                <p className="text-sm text-gray-500">File: {filePath}</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
