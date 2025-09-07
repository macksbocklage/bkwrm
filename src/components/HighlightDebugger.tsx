'use client';

import React, { useState, useEffect } from 'react';
import { useHighlights } from '@/hooks/useHighlights';

interface HighlightDebuggerProps {
  bookId?: string;
}

export default function HighlightDebugger({ bookId }: HighlightDebuggerProps) {
  const { highlights, loading, error, createHighlight, loadHighlights } = useHighlights();
  const [testText, setTestText] = useState('This is a test highlight');

  useEffect(() => {
    if (bookId) {
      loadHighlights(bookId);
    }
  }, [bookId, loadHighlights]);

  const handleTestHighlight = async () => {
    if (!bookId) {
      alert('No book ID provided');
      return;
    }

    const testHighlight = {
      book_id: bookId,
      text: testText,
      start_cfi: 'test-cfi-start',
      end_cfi: 'test-cfi-end',
      color: '#ff0000'
    };

    console.log('Creating test highlight:', testHighlight);
    const result = await createHighlight(testHighlight);
    console.log('Test highlight result:', result);
  };

  const handleTestDatabase = async () => {
    try {
      console.log('Testing highlights database...');
      const response = await fetch('/api/test-highlights');
      const data = await response.json();
      console.log('Database test result:', data);
      alert(`Database test result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Database test error:', error);
      alert(`Database test error: ${error}`);
    }
  };

  const handleTestSelection = () => {
    // Check main window selection
    const mainSelection = window.getSelection();
    console.log('Main window selection:', mainSelection);
    console.log('Main window selected text:', mainSelection?.toString());
    
    // Check for different iframe selectors
    const iframeSelectors = [
      'iframe[src*="blob:"]',
      'iframe',
      'iframe[src]',
      '.react-reader iframe',
      '[data-testid="reader"] iframe'
    ];
    
    let iframe: HTMLIFrameElement | null = null;
    let iframeSelector = '';
    
    for (const selector of iframeSelectors) {
      const found = document.querySelector(selector) as HTMLIFrameElement;
      if (found) {
        iframe = found;
        iframeSelector = selector;
        break;
      }
    }
    
    console.log('Iframe search results:');
    console.log('- Selector used:', iframeSelector);
    console.log('- Found iframe:', iframe);
    console.log('- Iframe src:', iframe?.src);
    console.log('- Iframe contentDocument:', iframe?.contentDocument);
    
    // Also check for any iframes in the document
    const allIframes = document.querySelectorAll('iframe');
    console.log('All iframes found:', allIframes.length);
    allIframes.forEach((iframe, index) => {
      console.log(`Iframe ${index}:`, {
        src: iframe.src,
        contentDocument: iframe.contentDocument,
        readyState: iframe.readyState
      });
    });
    
    if (iframe && iframe.contentDocument) {
      const iframeSelection = iframe.contentDocument.getSelection();
      console.log('Iframe selection:', iframeSelection);
      console.log('Iframe selected text:', iframeSelection?.toString());
      console.log('Iframe selection range count:', iframeSelection?.rangeCount);
      
      if (iframeSelection && iframeSelection.rangeCount > 0) {
        const range = iframeSelection.getRangeAt(0);
        console.log('Iframe selection range:', range);
        console.log('Iframe range text:', range.toString());
      }
      
      alert(`Selection test:\nMain: ${mainSelection?.toString() || 'No selection'}\nIframe (${iframeSelector}): ${iframeSelection?.toString() || 'No selection'}`);
    } else {
      alert(`Selection test:\nMain: ${mainSelection?.toString() || 'No selection'}\nIframe: Not found (checked ${iframeSelectors.length} selectors)\nFound ${allIframes.length} total iframes`);
    }
  };

  const handleForceRenderHighlights = () => {
    console.log('Force rendering highlights...');
    // This will trigger the HighlightRenderer to re-render
    loadHighlights(bookId || '');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold mb-2">Highlight Debugger</h3>
      
      <div className="space-y-2 text-sm">
        <div>Book ID: {bookId || 'Not provided'}</div>
        <div>Highlights Count: {highlights.length}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
      </div>

      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="Test highlight text"
        />
        <button
          onClick={handleTestHighlight}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mb-2"
        >
          Create Test Highlight
        </button>
        <button
          onClick={handleTestDatabase}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mb-2"
        >
          Test Database
        </button>
        <button
          onClick={handleTestSelection}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 mb-2"
        >
          Test Selection
        </button>
        <button
          onClick={handleForceRenderHighlights}
          className="w-full bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
        >
          Force Render Highlights
        </button>
      </div>

      {highlights.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Existing Highlights:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="text-xs bg-gray-100 p-2 rounded">
                <div className="font-medium">{highlight.text}</div>
                <div className="text-gray-600">Color: {highlight.color}</div>
                <div className="text-gray-600">Created: {new Date(highlight.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
