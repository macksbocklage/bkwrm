'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import { useHighlights } from '@/hooks/useHighlights';
import HighlightRenderer from './HighlightRenderer';
import HighlightToolbar from './HighlightToolbar';
import { Highlight } from '@/lib/types';

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

  // Debounced progress saving function
  const saveProgress = useCallback(async (currentLocation: string | number, currentProgress: number) => {
    if (!bookId || !onProgressUpdate) return;
    
    // Check if location has actually changed significantly
    const locationChanged = Math.abs(Number(currentLocation) - Number(lastSavedLocation.current)) > 0.05;
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
    }, 3000); // Increased to 3 seconds of inactivity
  }, [bookId, onProgressUpdate]);

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
      // For CFI strings, we still want to save the location
      saveProgress(epubcifi, progress);
    }
  }, [saveProgress, progress]);

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



  // Robust text selection handler with multiple fallback methods
  const handleTextSelection = async () => {
    console.log('Text selection triggered');
    
    if (!bookId || !renditionRef.current) {
      console.log('Missing bookId or rendition:', { bookId, rendition: !!renditionRef.current });
      return;
    }

    // Try multiple methods to get selection
    let selection: Selection | null = null;
    let selectedText = '';
    
    // Method 1: Try iframe selection first
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      selection = iframe.contentDocument.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        selectedText = selection.toString().trim();
        console.log('Found selection in iframe:', selectedText);
      }
    }
    
    // Method 2: Try main window selection as fallback
    if (!selectedText) {
      const mainSelection = window.getSelection();
      if (mainSelection && mainSelection.toString().trim().length > 0) {
        selection = mainSelection;
        selectedText = mainSelection.toString().trim();
        console.log('Found selection in main window:', selectedText);
      }
    }
    
    // Method 3: Try to find selection in any iframe
    if (!selectedText) {
      const allIframes = document.querySelectorAll('iframe');
      for (const iframe of allIframes) {
        if (iframe.contentDocument) {
          const iframeSelection = iframe.contentDocument.getSelection();
          if (iframeSelection && iframeSelection.toString().trim().length > 0) {
            selection = iframeSelection;
            selectedText = iframeSelection.toString().trim();
            console.log('Found selection in iframe:', iframe.src, selectedText);
            break;
          }
        }
      }
    }
    
    if (!selectedText || selectedText.length < 3) {
      console.log('No valid text selected:', { selectedText, length: selectedText.length });
      return;
    }

    // Prevent duplicate highlights
    const now = Date.now();
    if (lastHighlightText.current === selectedText && (now - lastHighlightTime.current) < 2000) {
      console.log('Duplicate highlight prevented:', selectedText);
      return;
    }

    console.log('Creating highlight for text:', selectedText);
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

      const result = await createHighlight(highlightData);
      
      if (result) {
        console.log('Highlight created successfully:', result);
        // Show success feedback
        setTimeout(() => {
          console.log('Highlight rendering should be triggered');
        }, 100);
      } else {
        console.error('Failed to create highlight');
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
    } finally {
      setIsSelecting(false);
      // Clear the selection
      if (selection) {
        selection.removeAllRanges();
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
    await deleteHighlight(highlightId);
    setSelectedHighlight(null);
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
            <p className="text-xs text-black font-inter tracking-tighter">File: {filePath}</p>
          </div>
          <div className="flex items-center gap-4">
            {progress > 0 && (
              <div className="text-sm text-black">
                Progress: {progress}%
              </div>
            )}
            <button 
              onClick={handleClose}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <ReactReader
          url={filePath}
          location={location}
          locationChanged={handleLocationChange}
          getRendition={(rendition) => {
            renditionRef.current = rendition;
            
            // Set up text selection handling
            rendition.hooks.content.register((contents: any) => {
              const doc = contents.document;
              
              console.log('Setting up highlight functionality in EPUB content');
              console.log('Document:', doc);
              console.log('Document body:', doc.body);
              console.log('Document location:', doc.location);
              console.log('Document URL:', doc.URL);
              console.log('Is iframe document:', doc !== document);
              
              // Check if this is an iframe document
              if (doc !== document) {
                console.log('This is an iframe document - EPUB content is in iframe');
              } else {
                console.log('This is the main document - EPUB content is rendered directly');
              }
              
              // Add single event listener for text selection with debouncing
              let selectionTimeout: NodeJS.Timeout | null = null;
              const handleSelection = () => {
                console.log('Selection event triggered');
                // Clear any existing timeout
                if (selectionTimeout) {
                  clearTimeout(selectionTimeout);
                }
                // Use multiple timeouts to catch selection at different stages
                selectionTimeout = setTimeout(handleTextSelection, 100);
                setTimeout(handleTextSelection, 300);
                setTimeout(handleTextSelection, 600);
              };
              
              doc.addEventListener('mouseup', (e: any) => {
                console.log('Mouseup event in EPUB content', e);
                console.log('Event target:', e.target);
                handleSelection();
              });
              
              // Add selectionchange event for debugging
              doc.addEventListener('selectionchange', () => {
                const selection = doc.getSelection();
                console.log('Selection change event in EPUB');
                if (selection && selection.toString().trim().length > 0) {
                  console.log('Text selected in EPUB:', selection.toString().trim());
                }
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
              
              console.log('Highlight styles and event listeners added');
            });
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
        
      </div>
    </div>
  );
}
