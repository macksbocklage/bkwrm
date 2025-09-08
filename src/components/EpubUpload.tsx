'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';

interface EpubUploadProps {
  onFileSelect: (file: File) => void;
}

// Animation variants
const uploadAreaVariants = {
  idle: {
    scale: 1,
    borderColor: "#6b7280",
    backgroundColor: "transparent"
  },
  dragActive: {
    scale: 1.02,
    borderColor: "#ffffff",
    backgroundColor: "#1f2937"
  },
  dragLeave: {
    scale: 1,
    borderColor: "#6b7280",
    backgroundColor: "transparent"
  }
};

const fileInfoVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9
  }
};

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
      <motion.div
        className="relative border-2 border-dashed rounded-lg p-8 text-center"
        variants={uploadAreaVariants}
        animate={dragActive ? "dragActive" : "idle"}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 20,
          mass: 0.8
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub,application/epub+zip"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div 
              key="file-selected"
              className="space-y-4"
              variants={fileInfoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                mass: 0.6
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <FileText className="w-8 h-8 text-green-400" />
                </motion.div>
                <span className="text-black font-medium">{selectedFile.name}</span>
                <motion.button
                  onClick={clearFile}
                  className="text-black hover:text-black transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              <motion.p 
                className="text-sm text-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </motion.p>
            </motion.div>
          ) : (
            <motion.div 
              key="upload-prompt"
              className="space-y-4"
              variants={fileInfoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                mass: 0.6
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Upload className="w-12 h-12 text-black mx-auto" />
              </motion.div>
              <div>
                <motion.p 
                  className="text-black font-medium font-inter tracking-tighter mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Upload an EPUB File
                </motion.p>
                <motion.p 
                  className="text-sm font-inter tracking-tighter text-black mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  Drag and drop your EPUB file here, or click to browse
                </motion.p>
                <motion.button
                  onClick={openFileDialog}
                  className="bg-white text-black font-inter tracking-tighter px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Choose File
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
