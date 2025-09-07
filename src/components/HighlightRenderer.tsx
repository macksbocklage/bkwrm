'use client';

import React, { useEffect, useRef } from 'react';
import { Highlight } from '@/lib/types';

interface HighlightRendererProps {
  highlights: Highlight[];
  onHighlightClick?: (highlight: Highlight) => void;
  onHighlightDelete?: (highlightId: string) => void;
}

export default function HighlightRenderer({ 
  highlights, 
  onHighlightClick, 
  onHighlightDelete 
}: HighlightRendererProps) {
  const renderedHighlights = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear previously rendered highlights
    renderedHighlights.current.clear();
    
    // Remove all existing highlight elements from iframe
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      const existingHighlights = iframe.contentDocument.querySelectorAll('.epub-highlight, .epub-highlight-overlay');
      existingHighlights.forEach(el => el.remove());
    }

    // Render new highlights with a delay to ensure content is loaded
    setTimeout(() => {
      highlights.forEach(highlight => {
        renderHighlight(highlight);
      });
    }, 100);
  }, [highlights]);

  // Add MutationObserver to detect content changes and re-render highlights
  useEffect(() => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return;

    const observer = new MutationObserver((mutations) => {
      let shouldReRender = false;
      
      mutations.forEach((mutation) => {
        // Check if highlights were removed
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.classList?.contains('epub-highlight') || 
                  element.querySelector?.('.epub-highlight')) {
                shouldReRender = true;
              }
            }
          });
        }
      });

      if (shouldReRender) {
        console.log('Content changed, re-rendering highlights');
        setTimeout(() => {
          highlights.forEach(highlight => {
            if (!renderedHighlights.current.has(highlight.id)) {
              renderHighlight(highlight);
            }
          });
        }, 100);
      }
    });

    observer.observe(iframe.contentDocument.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    return () => {
      observer.disconnect();
    };
  }, [highlights]);

  // Periodic re-rendering to ensure highlights stay visible
  useEffect(() => {
    if (highlights.length === 0) return;

    const interval = setInterval(() => {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument) return;

      // Check if any highlights are missing
      const existingHighlights = iframe.contentDocument.querySelectorAll('.epub-highlight, .epub-highlight-overlay');
      const existingIds = new Set(Array.from(existingHighlights).map(el => el.getAttribute('data-highlight-id')));
      
      const missingHighlights = highlights.filter(h => !existingIds.has(h.id));
      
      if (missingHighlights.length > 0) {
        console.log('Found missing highlights, re-rendering:', missingHighlights.length);
        missingHighlights.forEach(highlight => {
          renderHighlight(highlight);
        });
      }
    }, 500); // Check every 500ms for faster response

    return () => {
      clearInterval(interval);
    };
  }, [highlights]);

  // Force re-render highlights when iframe content changes
  useEffect(() => {
    if (highlights.length === 0) return;

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe) return;

    const observer = new MutationObserver(() => {
      console.log('Content changed, re-rendering highlights');
      setTimeout(() => {
        highlights.forEach(highlight => {
          renderHighlight(highlight);
        });
      }, 100);
    });

    if (iframe.contentDocument) {
      observer.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [highlights]);

  // Force re-render highlights when content changes
  useEffect(() => {
    if (highlights.length === 0) return;

    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return;

    // Re-render all highlights after a short delay
    const timeout = setTimeout(() => {
      console.log('Force re-rendering all highlights');
      highlights.forEach(highlight => {
        renderHighlight(highlight);
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [highlights]);

  const renderHighlight = (highlight: Highlight) => {
    try {
      // Find the rendition iframe
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument) return;

      const doc = iframe.contentDocument;
      console.log('Rendering highlight:', highlight.text);

      // Check if highlight already exists
      const existingHighlight = doc.querySelector(`[data-highlight-id="${highlight.id}"]`);
      if (existingHighlight) {
        console.log('Highlight already exists:', highlight.id);
        return;
      }

      // Use a more robust text search approach
      const bodyText = doc.body.textContent || '';
      const highlightIndex = bodyText.indexOf(highlight.text);

      if (highlightIndex === -1) {
        // Try case-insensitive search
        const lowerBodyText = bodyText.toLowerCase();
        const lowerHighlightText = highlight.text.toLowerCase();
        const lowerIndex = lowerBodyText.indexOf(lowerHighlightText);
        
        if (lowerIndex === -1) {
          console.warn('Could not find text to highlight:', highlight.text);
          return;
        }
        
        console.log('Found text with case-insensitive search at index:', lowerIndex);
      }

      const actualIndex = highlightIndex !== -1 ? highlightIndex : bodyText.toLowerCase().indexOf(highlight.text.toLowerCase());
      console.log('Found text to highlight at index:', actualIndex);

      // Create an overlay highlight that doesn't modify the original text
      const highlightOverlay = doc.createElement('div');
      highlightOverlay.className = 'epub-highlight-overlay';
      highlightOverlay.style.position = 'absolute';
      highlightOverlay.style.backgroundColor = '#ffff00';
      highlightOverlay.style.opacity = '0.3';
      highlightOverlay.style.pointerEvents = 'auto';
      highlightOverlay.style.cursor = 'pointer';
      highlightOverlay.style.zIndex = '10';
      highlightOverlay.style.borderRadius = '2px';
      highlightOverlay.style.mixBlendMode = 'multiply';
      highlightOverlay.setAttribute('data-highlight-id', highlight.id);
      highlightOverlay.setAttribute('data-highlight-text', highlight.text);

      // Find the text position and create overlay
      const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      let found = false;
      let currentIndex = 0;

      while (node = walker.nextNode()) {
        const textContent = node.textContent || '';
        const textLength = textContent.length;
        
        if (currentIndex <= actualIndex && actualIndex < currentIndex + textLength) {
          const localIndex = actualIndex - currentIndex;
          
          // Get the text node's position
          const range = doc.createRange();
          try {
            range.setStart(node, localIndex);
            range.setEnd(node, localIndex + highlight.text.length);
            
            const rect = range.getBoundingClientRect();
            const bodyRect = doc.body.getBoundingClientRect();
            
            // Only create overlay if we have valid dimensions
            if (rect.width > 0 && rect.height > 0) {
              // Position the overlay
              highlightOverlay.style.left = `${rect.left - bodyRect.left}px`;
              highlightOverlay.style.top = `${rect.top - bodyRect.top}px`;
              highlightOverlay.style.width = `${rect.width}px`;
              highlightOverlay.style.height = `${rect.height}px`;
              
              // Add to body
              doc.body.appendChild(highlightOverlay);
              
              highlightOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onHighlightClick?.(highlight);
              });

              highlightOverlay.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('Delete this highlight?')) {
                  onHighlightDelete?.(highlight.id);
                }
              });
              
              renderedHighlights.current.add(highlight.id);
              found = true;
              console.log('Successfully rendered highlight overlay:', highlight.id);
              break;
            }
          } catch (rangeError) {
            console.warn('Error creating range for highlight:', rangeError);
            // Continue to next text node
          }
        }
        
        currentIndex += textLength;
      }

      if (!found) {
        console.warn('Could not find text to highlight:', highlight.text);
        // Try multiple retry attempts with different delays
        setTimeout(() => {
          console.log('Retrying highlight render for:', highlight.text);
          renderHighlight(highlight);
        }, 500);
        
        setTimeout(() => {
          console.log('Second retry for highlight:', highlight.text);
          renderHighlight(highlight);
        }, 1500);
        
        setTimeout(() => {
          console.log('Final retry for highlight:', highlight.text);
          renderHighlight(highlight);
        }, 3000);
      }
    } catch (error) {
      console.warn('Error rendering highlight:', error);
    }
  };

  const findElementByCFI = (doc: Document, cfi: string): Element | null => {
    try {
      // CFI parsing is complex, this is a simplified version
      // In a real implementation, you'd use a proper CFI parser
      const cfiParts = cfi.split('/');
      if (cfiParts.length < 2) return null;
      
      // Look for elements with data-cfi attributes or try to match by position
      const elements = doc.querySelectorAll('*');
      for (const element of elements) {
        if (element.getAttribute('data-cfi') === cfi) {
          return element;
        }
      }
      
      // Fallback: try to find by text content (not ideal but works for basic cases)
      const textNodes = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = textNodes.nextNode()) {
        if (node.textContent?.includes(highlight.text)) {
          return node.parentElement;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error finding element by CFI:', error);
      return null;
    }
  };

  return null; // This component doesn't render anything visible
}
