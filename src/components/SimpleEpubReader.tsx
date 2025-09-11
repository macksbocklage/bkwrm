'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactReader } from 'react-reader';
import { ChevronLeft, ChevronRight, Menu, Settings, BookOpen } from 'lucide-react';

interface SimpleEpubReaderProps {
  filePath: string;
  onClose: () => void;
}

// Animation variants
const sidebarVariants = {
  hidden: {
    x: -320,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 15,
      mass: 0.6
    }
  },
  exit: {
    x: -320,
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 10,
      mass: 0.5
    }
  }
};

const _overlayVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export default function SimpleEpubReader({ filePath, onClose }: SimpleEpubReaderProps) {
  const [_isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [location, setLocation] = useState<string | number>(0);
  const [toc, setToc] = useState<unknown[]>([]);
  const [metadata, setMetadata] = useState<unknown>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('SimpleEpubReader received filePath:', filePath);
    console.log('Full URL would be:', `${window.location.origin}${filePath}`);
  }, [filePath]);
  

  const handleLocationChange = (epubcifi: string | number) => {
    setLocation(epubcifi);
  };

  const _handleTocChange = (toc: unknown[]) => {
    setToc(toc);
  };

  const _handleMetadata = (metadata: unknown) => {
    setMetadata(metadata);
    setIsLoading(false);
  };

  const _handleError = (error: unknown) => {
    console.error('EPUB Error:', error);
    setError(error instanceof Error ? error.message : 'Failed to load EPUB');
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
      <motion.div 
        className="fixed inset-0 bg-black flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 20,
          mass: 0.8
        }}
      >
        <motion.div 
          className="text-white text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 15,
            mass: 0.6
          }}
        >
          <motion.h2 
            className="text-xl font-bold mb-4 text-red-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Error Loading EPUB
          </motion.h2>
          <motion.p 
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {error}
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
            <motion.button
              onClick={onClose}
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-white z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.header 
        className="bg-gray-100 border-b border-gray-300 p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => setShowToc(!showToc)}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h1 className="font-semibold text-lg">
              {(metadata as { title?: string })?.title || 'Loading...'}
            </h1>
            <p className="text-sm text-black">
              by {(metadata as { creator?: string })?.creator || 'Unknown Author'}
            </p>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.header>

      <div className="flex flex-1">
        {/* Table of Contents Sidebar */}
        <AnimatePresence>
          {showToc && (
            <motion.div 
              className="w-80 bg-gray-50 border-r border-gray-300 overflow-y-auto"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-4">
                <motion.h3 
                  className="font-semibold mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Table of Contents
                </motion.h3>
                <div className="space-y-1">
                  {toc.map((item, index) => (
                    <motion.button
                      key={index}
                      onClick={() => goToChapter((item as { href: string }).href)}
                      className="block w-full text-left p-2 hover:bg-gray-200 rounded-md transition-colors"
                      style={{ paddingLeft: `${((item as { level?: number }).level || 0) * 16 + 8}px` }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                      whileHover={{ x: 4 }}
                    >
                      {(item as { label: string }).label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              className="w-80 bg-gray-50 border-r border-gray-300 p-4"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.h3 
                className="font-semibold mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Settings
              </motion.h3>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
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
                  <span className="text-sm text-black">{fontSize}px</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Reading Area */}
        <motion.div 
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Navigation Controls */}
          <motion.div 
            className="bg-gray-100 border-b border-gray-300 p-2 flex justify-center space-x-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={() => navigateChapter('prev')}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => navigateChapter('next')}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Reader Content */}
          <div className="flex-1 overflow-hidden">
            <ReactReader
              url={filePath}
              location={location}
              locationChanged={handleLocationChange}
              getRendition={(rendition) => {
                rendition.hooks.content.register((contents: { document: Document }) => {
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
                <motion.div 
                  className="flex flex-col items-center justify-center h-full text-black"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 15,
            mass: 0.6
          }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-black" />
                  </motion.div>
                  <motion.p 
                    className="text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    Loading EPUB...
                  </motion.p>
                  <motion.p 
                    className="text-sm text-black"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    File: {filePath}
                  </motion.p>
                </motion.div>
              }
              epubOptions={{
                allowScriptedContent: true,
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
