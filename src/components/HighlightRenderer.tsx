'use client';

import React, { useEffect, useRef, useCallback } from 'react';
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
  const failedHighlights = useRef<Set<string>>(new Set());
  const retryAttempts = useRef<Map<string, number>>(new Map());
  const isRenderingRef = useRef<boolean>(false);

  const renderHighlight = useCallback((highlight: Highlight) => {
    try {
      // Find the rendition iframe
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument) return;

      const doc = iframe.contentDocument;
      
      // Check if highlight already exists
      const existingHighlight = doc.querySelector(`[data-highlight-id="${highlight.id}"]`);
      if (existingHighlight) {
        renderedHighlights.current.add(highlight.id);
        return;
      }

      // Check if this highlight has already failed
      if (failedHighlights.current.has(highlight.id)) {
        return;
      }

      // Use a more robust text search approach
      const bodyText = doc.body.textContent || '';
      let actualIndex = bodyText.indexOf(highlight.text);

      if (actualIndex === -1) {
        // Try case-insensitive search
        const lowerBodyText = bodyText.toLowerCase();
        const lowerHighlightText = highlight.text.toLowerCase();
        actualIndex = lowerBodyText.indexOf(lowerHighlightText);
        
        if (actualIndex === -1) {
          // Mark as failed and increment retry count
          const attempts = retryAttempts.current.get(highlight.id) || 0;
          retryAttempts.current.set(highlight.id, attempts + 1);
          
          if (attempts >= 1) { // Only show warning after second attempt
            failedHighlights.current.add(highlight.id);
          }
          return;
        }
      }

      // Create an overlay highlight that doesn't modify the original text
      const highlightOverlay = doc.createElement('div');
      highlightOverlay.className = 'epub-highlight-overlay';
      highlightOverlay.style.position = 'absolute';
      highlightOverlay.style.backgroundColor = highlight.color || '#ffff00';
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
            range.setEnd(node, Math.min(localIndex + highlight.text.length, textContent.length));
            
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
              break;
            }
          } catch {
            // Continue to next text node
          }
        }
        
        currentIndex += textLength;
      }

      if (!found) {
        // Mark as failed but allow one retry
        const attempts = retryAttempts.current.get(highlight.id) || 0;
        retryAttempts.current.set(highlight.id, attempts + 1);
        
        if (attempts < 1) {
          // Only retry once, with a longer delay
          setTimeout(() => {
            renderHighlight(highlight);
          }, 1000);
        } else {
          failedHighlights.current.add(highlight.id);
        }
      }
    } catch {
      failedHighlights.current.add(highlight.id);
    }
  }, [onHighlightClick, onHighlightDelete]);

  const renderAllHighlights = useCallback(() => {
    if (isRenderingRef.current) return;
    
    isRenderingRef.current = true;
    
    try {
      highlights.forEach(highlight => {
        // Skip highlights that have already failed multiple times
        const attempts = retryAttempts.current.get(highlight.id) || 0;
        if (attempts >= 2) return; // Max 2 attempts per page load
        
        renderHighlight(highlight);
      });
    } finally {
      isRenderingRef.current = false;
    }
  }, [highlights, renderHighlight]);

  const renderMissingHighlights = useCallback(() => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return;

    const existingHighlights = iframe.contentDocument.querySelectorAll('.epub-highlight-overlay');
    const existingIds = new Set(Array.from(existingHighlights).map(el => el.getAttribute('data-highlight-id')));
    
    const missingHighlights = highlights.filter(h => 
      !existingIds.has(h.id) && 
      !failedHighlights.current.has(h.id) &&
      (retryAttempts.current.get(h.id) || 0) < 2
    );
    
    if (missingHighlights.length > 0) {
      missingHighlights.forEach(highlight => {
        renderHighlight(highlight);
      });
    }
  }, [highlights, renderHighlight]);

  // Consolidated rendering effect
  useEffect(() => {
    // Prevent multiple simultaneous renders
    if (isRenderingRef.current) return;
    
    // Clear tracking for new highlight set
    renderedHighlights.current.clear();
    failedHighlights.current.clear();
    retryAttempts.current.clear();
    
    // Remove all existing highlight elements from iframe
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return;

    const existingHighlights = iframe.contentDocument.querySelectorAll('.epub-highlight, .epub-highlight-overlay');
    existingHighlights.forEach(el => el.remove());

    // Render highlights with a delay to ensure content is loaded
    const timeoutId = setTimeout(() => {
      renderAllHighlights();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [highlights, renderAllHighlights]);

  // Single MutationObserver for content changes
  useEffect(() => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return;

    const observer = new MutationObserver((mutations) => {
      let shouldReRender = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.classList?.contains('epub-highlight-overlay')) {
                shouldReRender = true;
              }
            }
          });
        }
      });

      if (shouldReRender && !isRenderingRef.current) {
        setTimeout(() => {
          renderMissingHighlights();
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
  }, [highlights, renderMissingHighlights]);

  return null; // This component doesn't render anything visible
}
