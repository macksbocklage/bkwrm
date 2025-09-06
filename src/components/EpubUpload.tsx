'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface EpubUploadProps {
  onFileSelect: (file: File) => void;
}

export default function EpubUpload({ onFileSelect }: EpubUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert('Please select a valid EPUB file');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert('Please select a valid EPUB file');
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-white bg-gray-800'
            : 'border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub,application/epub+zip"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-8 h-8 text-green-400" />
              <span className="text-white font-medium">{selectedFile.name}</span>
              <button
                onClick={clearFile}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white font-medium mb-2">
                Upload an EPUB file
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Drag and drop your EPUB file here, or click to browse
              </p>
              <button
                onClick={openFileDialog}
                className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Choose File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
