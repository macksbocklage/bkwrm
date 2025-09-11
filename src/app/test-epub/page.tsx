'use client';

import { useState } from 'react';

export default function TestEpubPage() {
  const [fileUrl, setFileUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testFileAccess = async () => {
    if (!fileUrl) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      console.log('File access test:', {
        url: fileUrl,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        alert(`File is accessible! Status: ${response.status}`);
      } else {
        alert(`File access failed! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('File access error:', error);
      alert(`File access error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">EPUB File Access Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            File URL:
          </label>
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Paste the file URL here"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={testFileAccess}
          disabled={isLoading || !fileUrl}
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test File Access'}
        </button>
        
        <div className="text-sm text-gray-600">
          <p>1. Copy the file URL from the console logs</p>
          <p>2. Paste it in the input above</p>
          <p>3. Click &quot;Test File Access&quot; to see if the file is accessible</p>
        </div>
      </div>
    </div>
  );
}
