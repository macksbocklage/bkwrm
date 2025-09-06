'use client';

import React, { useState } from 'react';
import { ReactReader } from 'react-reader';
import { ChevronLeft, ChevronRight, Menu, Settings, BookOpen, X } from 'lucide-react';

interface SimpleEpubReaderProps {
  filePath: string;
  onClose: () => void;
}

export default function SimpleEpubReader({ filePath, onClose }: SimpleEpubReaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [location, setLocation] = useState<string | number>(0);
  const [toc, setToc] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('SimpleEpubReader received filePath:', filePath);
    console.log('Full URL would be:', `${window.location.origin}${filePath}`);
  }, [filePath]);
  

  const handleLocationChange = (epubcifi: string | number) => {
    setLocation(epubcifi);
  };

  const handleTocChange = (toc: any[]) => {
    setToc(toc);
  };

  const handleMetadata = (metadata: any) => {
    setMetadata(metadata);
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('EPUB Error:', error);
    setError(error.message || 'Failed to load EPUB');
    setIsLoading(false);
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    // For now, we'll implement basic navigation
    // The react-reader library handles this internally
    console.log(`Navigate ${direction}`);
  };

  const goToChapter = (href: string) => {
    // Set location to navigate to specific chapter
    setLocation(href);
    setShowToc(false);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-bold mb-4 text-red-400">Error Loading EPUB</h2>
          <p className="mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-100 border-b border-gray-300 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-lg">
              {metadata?.title || 'Loading...'}
            </h1>
            <p className="text-sm text-gray-600">
              by {metadata?.creator || 'Unknown Author'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Table of Contents Sidebar */}
        {showToc && (
          <div className="w-80 bg-gray-50 border-r border-gray-300 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Table of Contents</h3>
              <div className="space-y-1">
                {toc.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => goToChapter(item.href)}
                    className="block w-full text-left p-2 hover:bg-gray-200 rounded-md transition-colors"
                    style={{ paddingLeft: `${(item.level || 0) * 16 + 8}px` }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-gray-50 border-r border-gray-300 p-4">
            <h3 className="font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{fontSize}px</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Reading Area */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Controls */}
          <div className="bg-gray-100 border-b border-gray-300 p-2 flex justify-center space-x-4">
            <button
              onClick={() => navigateChapter('prev')}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateChapter('next')}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Reader Content */}
          <div className="flex-1 overflow-hidden">
            <ReactReader
              url={filePath}
              location={location}
              locationChanged={handleLocationChange}
              getRendition={(rendition) => {
                rendition.hooks.content.register((contents) => {
                  // Create a style element instead of using addStylesheet
                  const style = document.createElement('style');
                  style.textContent = `
                    body {
                      font-family: 'Georgia', serif !important;
                      font-size: ${fontSize}px !important;
                      line-height: 1.6 !important;
                      color: #333 !important;
                      background: #fff !important;
                      padding: 2rem !important;
                      max-width: 800px !important;
                      margin: 0 auto !important;
                    }
                    h1, h2, h3, h4, h5, h6 {
                      color: #2c3e50 !important;
                      margin-top: 2rem !important;
                      margin-bottom: 1rem !important;
                    }
                    p {
                      margin-bottom: 1rem !important;
                    }
                  `;
                  contents.document.head.appendChild(style);
                });
              }}
              loadingView={
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <BookOpen className="w-12 h-12 animate-pulse mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Loading EPUB...</p>
                  <p className="text-sm text-gray-400">File: {filePath}</p>
                </div>
              }
              epubOptions={{
                allowScriptedContent: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
