'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import { useHighlights } from '@/hooks/useHighlights';
import HighlightRenderer from './HighlightRenderer';
import HighlightToolbar from './HighlightToolbar';
import BookChatbot from './BookChatbot';
import { Highlight } from '@/lib/types';
import { extractEpubText } from '@/lib/epubTextExtractor';
import { motion } from 'framer-motion';

interface TestEpubReaderProps {
  filePath: string;
  onClose: () => void;
  onProgressUpdate?: (progress: number, location?: string) => void;
  bookTitle?: string;
  bookAuthor?: string;
  bookId?: string;
  initialLocation?: string | number;
}

export default function TestEpubReader({ 
  filePath, 
  onClose, 
  onProgressUpdate,
  bookTitle,
  bookAuthor,
  bookId,
  initialLocation
}: TestEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(initialLocation || 0);
  const [progress, setProgress] = useState(0);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [bookContent, setBookContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const renditionRef = useRef<any>(null);
  const lastHighlightText = useRef<string>('');
  const lastHighlightTime = useRef<number>(0);
  const lastSavedLocation = useRef<string | number>(initialLocation || 0);
  const progressSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const {
    highlights,
    loading: highlightsLoading,
    error: highlightsError,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    loadHighlights
  } = useHighlights();

  // Load highlights when bookId changes
  useEffect(() => {
    if (bookId) {
      loadHighlights(bookId);
    }
  }, [bookId, loadHighlights]);

  // Refresh EPUB layout when chatbot visibility changes
  useEffect(() => {
    if (renditionRef.current) {
      // Add a small delay to ensure CSS transition completes
      const timeoutId = setTimeout(() => {
        try {
          // Dispatch a window resize event to trigger layout recalculation
          // This is less invasive than calling rendition.resize() directly
          window.dispatchEvent(new Event('resize'));
          console.log('EPUB layout refreshed using window resize event');
        } catch (error) {
          console.error('Error refreshing EPUB layout:', error);
          // Fallback to direct resize if event dispatch fails
          renditionRef.current?.resize();
        }
      }, 350); // Slightly longer than the 300ms CSS transition
      
      return () => clearTimeout(timeoutId);
    }
  }, [isChatbotVisible]);

  // Cleanup global event listeners on unmount
  useEffect(() => {
    return () => {
      if (renditionRef.current && (renditionRef.current as any)._highlightCleanup) {
        (renditionRef.current as any)._highlightCleanup();
      }
    };
  }, []);

  // Extract book content for chatbot context
  useEffect(() => {
    const extractContent = async () => {
      if (!filePath || isLoadingContent || bookContent) return; // Don't re-extract if we already have content
      
      setIsLoadingContent(true);
      try {
        const extractedContent = await extractEpubText(filePath);
        setBookContent(extractedContent.fullText);
        console.log('📚 Book content extracted for AI chatbot');
      } catch (error) {
        console.error('Failed to extract book content:', error);
        // Don't set error state, just log - chatbot can still work without full context
      } finally {
        setIsLoadingContent(false);
      }
    };

    extractContent();
  }, [filePath]); // Remove isLoadingContent from dependencies to prevent loops
  // Debounced progress saving function
  const saveProgress = useCallback(async (currentLocation: string | number, currentProgress: number) => {
    if (!bookId || !onProgressUpdate) return;
    
    // Check if location has actually changed significantly
    // For CFI strings, compare as strings; for numbers, compare as numbers
    let locationChanged = false;
    if (typeof currentLocation === 'string' && typeof lastSavedLocation.current === 'string') {
      locationChanged = currentLocation !== lastSavedLocation.current;
    } else if (typeof currentLocation === 'number' && typeof lastSavedLocation.current === 'number') {
      locationChanged = Math.abs(currentLocation - lastSavedLocation.current) > 0.01;
    } else {
      // Different types, consider it changed
      locationChanged = true;
    }
    
    if (!locationChanged) {
      console.log('Location change too small, skipping save');
      return;
    }
    
    // Clear any existing timeout
    if (progressSaveTimeout.current) {
      clearTimeout(progressSaveTimeout.current);
    }
    
    // Set a new timeout to save progress after user stops navigating
    progressSaveTimeout.current = setTimeout(async () => {
      try {
        console.log('Saving progress:', { location: currentLocation, progress: currentProgress });
        await onProgressUpdate(currentProgress, currentLocation.toString());
        lastSavedLocation.current = currentLocation;
        console.log('Progress saved successfully');
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }, 2000); // Reduced to 2 seconds for more responsive saving
  }, [bookId, onProgressUpdate]);

  // Periodic progress save every 30 seconds
  useEffect(() => {
    if (!bookId || !onProgressUpdate) return;
    
    const interval = setInterval(() => {
      if (location !== lastSavedLocation.current) {
        console.log('Periodic save triggered');
        saveProgress(location, progress);
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [bookId, onProgressUpdate, location, progress, saveProgress]);

  // Enhanced location change handler
  const handleLocationChange = useCallback((epubcifi: string | number) => {
    console.log('Location changed to:', epubcifi);
    setLocation(epubcifi);
    
    // Calculate progress if it's a number
    if (typeof epubcifi === 'number') {
      const newProgress = Math.round(epubcifi * 100);
      setProgress(newProgress);
      
      // Save progress (the saveProgress function will handle debouncing and change detection)
      saveProgress(epubcifi, newProgress);
    } else {
      // For CFI strings, try to extract progress from the rendition if available
      let currentProgress = progress;
      if (renditionRef.current && renditionRef.current.location) {
        // Try to get progress from the rendition
        const renditionProgress = renditionRef.current.location.percentage;
        if (renditionProgress !== undefined) {
          currentProgress = Math.round(renditionProgress * 100);
          setProgress(currentProgress);
        }
      }
      
      // Save progress with current progress value
      saveProgress(epubcifi, currentProgress);
    }
    
    // Also save immediately for significant location changes (like chapter navigation)
    if (typeof epubcifi === 'string' && epubcifi.includes('chapter')) {
      console.log('Chapter navigation detected, saving immediately');
      if (onProgressUpdate && bookId) {
        onProgressUpdate(progress, epubcifi.toString());
      }
    }
  }, [saveProgress, progress, onProgressUpdate, bookId]);

  // Save progress on component unmount or when user navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (progressSaveTimeout.current) {
        clearTimeout(progressSaveTimeout.current);
      }
      // Force immediate save on page unload only if there's a pending save
      if (bookId && onProgressUpdate && location !== lastSavedLocation.current) {
        try {
          await onProgressUpdate(progress, location.toString());
        } catch (error) {
          console.error('Failed to save progress on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only save on unmount if there's a pending save
      if (progressSaveTimeout.current) {
        handleBeforeUnload();
      }
    };
  }, [bookId, onProgressUpdate, location, progress]);

  // Re-render highlights when location changes (user navigates pages)
  useEffect(() => {
    if (highlights.length > 0) {
      console.log('Location changed, checking if highlights need re-rendering');
      // Small delay to ensure the new content is loaded
      setTimeout(() => {
        // The HighlightRenderer component will handle re-rendering
        // We don't need to manually clear highlights here as it causes blinking
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          // Just trigger a re-check by the HighlightRenderer
          // The component will detect if highlights need to be re-rendered
        }
      }, 500);
    }
  }, [location, highlights]);

  // Add global selection change listener
  useEffect(() => {
    const handleGlobalSelectionChange = () => {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        const selection = iframe.contentDocument.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          console.log('Global selection change detected:', selection.toString().trim());
        }
      }
    };

    document.addEventListener('selectionchange', handleGlobalSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleGlobalSelectionChange);
    };
  }, []);



  // Simplified and robust text selection handler
  const handleTextSelection = async () => {
    if (!bookId || !renditionRef.current) {
      return;
    }

    // Strategy 1: Look for selection in all potential locations
    let selection: Selection | null = null;
    let selectedText = '';
    let selectionSource = '';
    
    // Check main window first
    const mainSelection = window.getSelection();
    if (mainSelection && mainSelection.toString().trim().length > 0) {
      selection = mainSelection;
      selectedText = mainSelection.toString().trim();
      selectionSource = 'main-window';
    }
    
    // Check all iframes (react-reader typically uses iframe)
    if (!selectedText) {
      const allIframes = document.querySelectorAll('iframe');
      
      for (let i = 0; i < allIframes.length; i++) {
        const iframe = allIframes[i] as HTMLIFrameElement;
        try {
          if (iframe.contentDocument) {
            const iframeSelection = iframe.contentDocument.getSelection();
            
            if (iframeSelection && iframeSelection.toString().trim().length > 0) {
              selection = iframeSelection;
              selectedText = iframeSelection.toString().trim();
              selectionSource = `iframe-${i}`;
              break;
            }
          }
        } catch (error) {
          // Silently handle cross-origin iframe access errors
        }
      }
    }
    
    if (!selectedText || selectedText.length < 3) {
      return; // Silently return if no valid selection
    }

    console.log(`🎯 Creating highlight from ${selectionSource}:`, selectedText.substring(0, 50) + '...');

    // Prevent duplicate highlights (reduced to 500ms for easier testing)
    const now = Date.now();
    if (lastHighlightText.current === selectedText && (now - lastHighlightTime.current) < 500) {
      console.log('⚠️ Duplicate highlight prevented (too soon after last highlight):', selectedText);
      return;
    }

    console.log('🎨 Creating highlight for text:', selectedText);
    setIsSelecting(true);
    
    // Update last highlight info
    lastHighlightText.current = selectedText;
    lastHighlightTime.current = now;

    try {
      // Create a more robust CFI-like identifier
      const currentLocation = renditionRef.current.location?.start?.cfi || location.toString();
      const timestamp = Date.now();
      const startCfi = `${currentLocation}[${selectedText.substring(0, Math.min(20, selectedText.length))}]_${timestamp}`;
      const endCfi = `${currentLocation}[${selectedText.substring(Math.max(0, selectedText.length - 20))}]_${timestamp}`;

      console.log('Creating highlight with data:', {
        book_id: bookId,
        text: selectedText,
        start_cfi: startCfi,
        end_cfi: endCfi
      });

      const highlightData = {
        book_id: bookId,
        text: selectedText,
        start_cfi: startCfi,
        end_cfi: endCfi,
        color: '#ffff00'
      };

      console.log('💾 About to call createHighlight with data:', highlightData);
      
      const result = await createHighlight(highlightData);
      
      console.log('💾 createHighlight result:', result);
      
      if (result) {
        console.log('✅ Highlight created successfully:', result);
        // Show success feedback
        setTimeout(() => {
          console.log('🎯 Highlight rendering should be triggered');
        }, 100);
      } else {
        console.error('❌ createHighlight returned falsy result:', result);
      }
    } catch (error) {
      console.error('💥 Error creating highlight:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        selectedText,
        bookId,
        location
      });
    } finally {
      console.log('🧹 Cleaning up selection...');
      setIsSelecting(false);
      // Clear the selection
      if (selection) {
        try {
          selection.removeAllRanges();
          console.log('✅ Selection cleared');
        } catch (clearError) {
          console.error('⚠️ Error clearing selection:', clearError);
        }
      }
    }
  };


  // Handle highlight click
  const handleHighlightClick = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
  };

  // Handle highlight color update
  const handleHighlightColorUpdate = async (highlightId: string, color: string) => {
    await updateHighlight(highlightId, { color });
    setSelectedHighlight(null);
  };

  // Handle highlight delete
  const handleHighlightDelete = async (highlightId: string) => {
    try {
      await deleteHighlight(highlightId);
      setSelectedHighlight(null);
    } catch (error) {
      console.error('❌ Error deleting highlight:', error);
    }
  };

  // Enhanced close handler that saves progress before closing
  const handleClose = useCallback(async () => {
    // Clear any pending timeout
    if (progressSaveTimeout.current) {
      clearTimeout(progressSaveTimeout.current);
    }
    
    // Force immediate save before closing
    if (bookId && onProgressUpdate && location !== lastSavedLocation.current) {
      try {
        console.log('Saving progress before closing...');
        await onProgressUpdate(progress, location.toString());
        console.log('Progress saved successfully before closing');
      } catch (error) {
        console.error('Failed to save progress before closing:', error);
      }
    }
    
    // Call the original onClose handler
    onClose();
  }, [bookId, onProgressUpdate, location, progress, onClose]);

  console.log('TestEpubReader filePath:', filePath);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-editors-note text-xl font-bold">
              {bookTitle || 'EPUB Reader'}
            </h1>
            {bookAuthor && (
              <p className="text-sm text-black font-inter tracking-tighter">by {bookAuthor}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {progress > 0 && (
              <div className="text-sm text-black">
                Progress: {progress}%
              </div>
            )}
            <motion.button 
              onClick={handleClose}
              className="px-4 py-2 rounded-md transition-colors flex items-center gap-2 font-editors-note bg-gray-200 text-black hover:bg-gray-300 border border-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative flex">
        {/* Main Reader Area */}
        <div className={`flex-1 relative transition-all duration-300 ${isChatbotVisible ? 'mr-96' : ''}`}>
        <ReactReader
          url={filePath}
          location={location}
          locationChanged={handleLocationChange}
          getRendition={(rendition) => {
            renditionRef.current = rendition;
            
            // Set up progress tracking when rendition is ready
            // Note: The location hook might not be available in all versions of react-reader
            // We'll rely on the locationChanged callback instead
            
            // Set up text selection handling
            
            rendition.hooks.content.register((contents: any) => {
              const doc = contents.document;
              
              // Enhanced selection handling with debouncing to prevent highlight blinking
              let selectionTimeout: NodeJS.Timeout | null = null;
              let lastProcessedSelection = '';
              
              const handleSelection = (eventType: string, event?: Event) => {
                // Skip processing if click was on a highlight overlay
                if (event && event.target) {
                  const target = event.target as HTMLElement;
                  if (target.classList.contains('epub-highlight-overlay') || 
                      target.closest('.epub-highlight-overlay')) {
                    return; // Silent skip to prevent blinking
                  }
                }
                
                // Get current selection
                const selection = doc.getSelection();
                const selectedText = selection ? selection.toString().trim() : '';
                
                // Only process if there's meaningful new text selection
                if (selectedText.length > 2 && selectedText !== lastProcessedSelection) {
                  lastProcessedSelection = selectedText;
                  
                  // Clear any existing timeout
                  if (selectionTimeout) {
                    clearTimeout(selectionTimeout);
                  }
                  
                  // Process selection with single delayed call to avoid multiple triggers
                  selectionTimeout = setTimeout(() => {
                    handleTextSelection();
                    // Clear the processed selection after a delay to allow re-highlighting same text later
                    setTimeout(() => { lastProcessedSelection = ''; }, 2000);
                  }, 150);
                } else if (selectedText.length === 0) {
                  // Clear processed selection when user clicks without selecting
                  lastProcessedSelection = '';
                }
              };
              
              // Add event listeners for text selection
              doc.addEventListener('mouseup', (e: any) => {
                handleSelection('mouseup', e);
              });
              
              doc.addEventListener('selectionchange', () => {
                handleSelection('selectionchange');
              });
              
              // Also listen on the window for cases where selection bubbles up
              doc.defaultView?.addEventListener?.('mouseup', (e: any) => {
                handleSelection('iframe-window-mouseup', e);
              });
              
              // Add styles for highlighting
              const style = doc.createElement('style');
              style.textContent = `
                .epub-highlight {
                  background-color: #ffff00 !important;
                  padding: 2px 0 !important;
                  border-radius: 2px !important;
                  cursor: pointer !important;
                  transition: all 0.2s ease !important;
                }
                .epub-highlight:hover {
                  opacity: 0.8 !important;
                  transform: scale(1.02) !important;
                }
                .epub-temp-highlight {
                  background-color: rgba(255, 255, 0, 0.5) !important;
                  padding: 2px 0 !important;
                  border-radius: 2px !important;
                  transition: all 0.2s ease !important;
                  animation: highlightPulse 0.5s ease-in-out !important;
                }
                @keyframes highlightPulse {
                  0% { background-color: rgba(255, 255, 0, 0.2) !important; }
                  50% { background-color: rgba(255, 255, 0, 0.7) !important; }
                  100% { background-color: rgba(255, 255, 0, 0.5) !important; }
                }
                .epub-selection {
                  background-color: rgba(255, 255, 0, 0.3) !important;
                  border-radius: 2px !important;
                }
                /* Make text selectable */
                body {
                  -webkit-user-select: text !important;
                  -moz-user-select: text !important;
                  -ms-user-select: text !important;
                  user-select: text !important;
                }
              `;
              doc.head.appendChild(style);
            });
            
            // Add fallback global event listeners as backup
            
            let globalLastProcessedSelection = '';
            let globalSelectionTimeout: NodeJS.Timeout | null = null;
            
            const globalMouseUpHandler = (e: MouseEvent) => {
              // Skip processing if click was on a highlight overlay
              const target = e.target as HTMLElement;
              if (target && (target.classList.contains('epub-highlight-overlay') || 
                           target.closest('.epub-highlight-overlay'))) {
                return; // Silent skip to prevent blinking
              }
              
              const selection = window.getSelection();
              const selectedText = selection ? selection.toString().trim() : '';
              
              // Only process if there's new meaningful selection  
              if (selectedText.length > 2 && selectedText !== globalLastProcessedSelection) {
                globalLastProcessedSelection = selectedText;
                
                if (globalSelectionTimeout) {
                  clearTimeout(globalSelectionTimeout);
                }
                
                globalSelectionTimeout = setTimeout(() => {
                  handleTextSelection();
                  setTimeout(() => { globalLastProcessedSelection = ''; }, 2000);
                }, 100);
              } else if (selectedText.length === 0) {
                globalLastProcessedSelection = '';
              }
            };
            
            const globalSelectionHandler = () => {
              // Use same logic as mouseup to prevent duplicate processing
              const selection = window.getSelection();
              const selectedText = selection ? selection.toString().trim() : '';
              
              if (selectedText.length > 2 && selectedText !== globalLastProcessedSelection) {
                globalLastProcessedSelection = selectedText;
                
                if (globalSelectionTimeout) {
                  clearTimeout(globalSelectionTimeout);
                }
                
                globalSelectionTimeout = setTimeout(() => {
                  handleTextSelection();
                  setTimeout(() => { globalLastProcessedSelection = ''; }, 2000);
                }, 100);
              }
            };
            
            // Add to document and window
            document.addEventListener('mouseup', globalMouseUpHandler);
            document.addEventListener('selectionchange', globalSelectionHandler);
            window.addEventListener('mouseup', globalMouseUpHandler);
            
            // Cleanup function to remove global listeners when component unmounts
            const cleanup = () => {
              document.removeEventListener('mouseup', globalMouseUpHandler);
              document.removeEventListener('selectionchange', globalSelectionHandler);
              window.removeEventListener('mouseup', globalMouseUpHandler);
            };
            
            // Store cleanup function for later use
            (rendition as any)._highlightCleanup = cleanup;
            
            // Add debug function to window for manual testing
            (window as any).testHighlight = () => {
              console.log('🧪 Manual highlight test triggered');
              handleTextSelection();
            };
          }}
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
        
        {/* Highlight Renderer */}
        {bookId && (
          <HighlightRenderer
            highlights={highlights}
            onHighlightClick={handleHighlightClick}
            onHighlightDelete={handleHighlightDelete}
          />
        )}
        
        {/* Highlight Toolbar */}
        <HighlightToolbar
          highlight={selectedHighlight}
          onClose={() => setSelectedHighlight(null)}
          onUpdateColor={handleHighlightColorUpdate}
          onDelete={handleHighlightDelete}
        />
        
        {/* Debug Information */}
        <div className="absolute top-4 left-4 bg-gray-100 text-gray-800 px-3 py-1 rounded text-xs space-y-1">
          <div>Book ID: {bookId || 'Not provided'}</div>
          <div>Highlights: {highlights.length}</div>
          <div>Location: {location.toString()}</div>
          <div>Progress: {progress}%</div>
          <div>Last Saved: {lastSavedLocation.current.toString()}</div>
          <div>Selecting: {isSelecting ? 'Yes' : 'No'}</div>
          <div>Rendition: {renditionRef.current ? 'Ready' : 'Not ready'}</div>
        </div>
        
        {/* Highlight Status */}
        {highlightsLoading && (
          <div className="absolute top-16 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
            Loading highlights...
          </div>
        )}
        
        {highlightsError && (
          <div className="absolute top-16 left-4 bg-red-100 text-red-800 px-3 py-1 rounded text-sm">
            Error loading highlights: {highlightsError}
          </div>
        )}
        
        {isSelecting && (
          <div className="absolute top-16 left-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
            Creating highlight...
          </div>
        )}
        
        {/* Content Loading Indicator */}
        {isLoadingContent && (
          <div className="absolute top-28 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
            Preparing AI context...
          </div>
        )}
        
        </div>

        {/* AI Chatbot */}
        {bookId && (
          <BookChatbot
            bookId={bookId}
            bookTitle={bookTitle}
            bookContent={bookContent || undefined}
            isVisible={isChatbotVisible}
            onToggle={() => setIsChatbotVisible(!isChatbotVisible)}
          />
        )}
      </div>
    </div>
  );
}
