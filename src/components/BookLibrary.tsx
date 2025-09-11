'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/lib/types';
import { useBooks } from '@/hooks/useBooks';
import EpubUpload from '@/components/EpubUpload';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Trash2, 
  Search,
  Grid,
  List,
  MoreVertical,
  Image,
  Upload
} from 'lucide-react';

interface BookLibraryProps {
  onBookSelect: (book: Book) => void;
  showUpload: boolean;
  onToggleUpload: () => void;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadError: string | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const bookCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1
  },
  hover: {
    y: -4,
    scale: 1.02
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20
  }
};

const _menuVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    x: 20,
    y: -20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    x: 0,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: 20,
    y: -20
  }
};

export default function BookLibrary({ 
  onBookSelect, 
  showUpload, 
  onToggleUpload, 
  onFileSelect, 
  isUploading, 
  uploadError 
}: BookLibraryProps) {
  const { books, loading, error, deleteBook, updateBook, uploadCover } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);
  const [pendingCoverUpload, setPendingCoverUpload] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    setDeletingId(bookId);
    const success = await deleteBook(bookId);
    setDeletingId(null);
    
    if (success) {
      // Book was deleted successfully
    }
  };

  const _handleUpdateProgress = async (bookId: string, progress: number) => {
    await updateBook(bookId, { 
      reading_progress: progress,
      last_read_at: new Date().toISOString()
    });
  };

  const handleChangeCover = (bookId: string) => {
    // Store the book ID for the file upload and close menu
    setPendingCoverUpload(bookId);
    setOpenMenuId(null);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Find the book ID from the pending upload
    const bookId = pendingCoverUpload;
    if (!bookId) return;

    // If no file selected, clear pending upload
    if (!file) {
      setPendingCoverUpload(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File too large. Please select an image smaller than 5MB.');
      return;
    }

    setUploadingCoverId(bookId);
    const success = await uploadCover(bookId, file);
    setUploadingCoverId(null);
    setPendingCoverUpload(null);

    if (success) {
      // Cover uploaded successfully
    } else {
      alert('Failed to upload cover image. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleMenu = (bookId: string) => {
    if (openMenuId === bookId) {
      // If clicking the same menu button, close it
      setOpenMenuId(null);
    } else {
      // If clicking a different menu button, switch to that one
      setOpenMenuId(bookId);
    }
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isMenuClick = menuRef.current && menuRef.current.contains(target);
      const isButtonClick = buttonRef.current && buttonRef.current.contains(target);
      
      if (!isMenuClick && !isButtonClick) {
        closeMenu();
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Trigger file input when there's a pending cover upload
  useEffect(() => {
    if (pendingCoverUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [pendingCoverUpload]);


  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-black">Loading Books...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-black mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Hidden file input for cover uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl text-black mb-4 font-inter tracking-tighter">Recently Read</h2>
        
        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
            <input
              type="text"
              placeholder="Search Books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-black placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <motion.button
              onClick={onToggleUpload}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 font-editors-note ${
                showUpload 
                  ? 'bg-white text-black border border-gray-200' 
                  : 'bg-gray-100 text-black hover:bg-gray-200 border border-transparent'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4" />
              {showUpload ? 'View Library' : 'Upload'}
            </motion.button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-black border border-gray-200' 
                  : 'bg-gray-100 text-black hover:bg-gray-200 border border-transparent'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-black border border-gray-200' 
                  : 'bg-gray-100 text-black hover:bg-gray-200 border border-transparent'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <AnimatePresence mode="wait">
        {showUpload && (
          <motion.div 
            key="upload"
            className="mb-8 bg-white rounded-lg p-8 border border-gray-200"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: -20, 
              scale: 0.95,
              transition: { duration: 0.1 }
            }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 15,
              mass: 0.6
            }}
          >
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h3 className="text-2xl font-semibold mb-2 font-editors-note">Upload Your EPUB</h3>
              <p className="text-black font-inter tracking-tighter">Select an EPUB file to begin reading with our enhanced reader experience.</p>
            </motion.div>

            <AnimatePresence>
              {uploadError && (
                <motion.div 
                  className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-red-800">{uploadError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <EpubUpload onFileSelect={onFileSelect} />

            <AnimatePresence>
              {isUploading && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-flex items-center text-black">
                    <motion.div 
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Uploading and processing your EPUB...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <BookOpen className="w-16 h-16 text-black mx-auto mb-4" />
          </motion.div>
          <motion.p 
            className="text-black text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {searchTerm ? 'No books match your search.' : 'No books in your library yet.'}
          </motion.p>
          <motion.p 
            className="text-black text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {searchTerm ? 'Try a different search term.' : 'Upload your first EPUB book to get started.'}
          </motion.p>
        </motion.div>
      ) : (
        <motion.div 
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                variants={bookCardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  mass: 0.8
                }}
                className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
                  viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
                }`}
              >
              {viewMode === 'grid' ? (
                // Grid view
                <div className="space-y-3">
                  {/* Book Cover */}
                  <div className="aspect-[2/3] bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`${book.title} cover`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to book icon if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${book.cover_image_url ? 'hidden' : ''} flex flex-col items-center justify-center text-gray-400`}>
                      <BookOpen className="w-12 h-12 mb-2" />
                      <span className="text-xs text-center px-2">No Cover</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black truncate font-inter" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="text-sm text-black truncate font-inter tracking-tighter" title={book.author}>
                        {book.author}
                      </p>
                    </div>
                    <div className="relative">
                      <motion.button
                        ref={buttonRef}
                        onClick={() => toggleMenu(book.id)}
                        className="text-black hover:text-gray-600 transition-colors p-1"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        animate={openMenuId === book.id ? { rotate: 90 } : { rotate: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>
                      
                      <AnimatePresence mode="wait">
                        {openMenuId === book.id && (
                          <motion.div 
                            ref={menuRef}
                            className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]"
                            initial={{ 
                              opacity: 0, 
                              scale: 0.8,
                              x: 20,
                              y: -20
                            }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              x: 0,
                              y: 0
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.8,
                              x: 20,
                              y: -20,
                              transition: {
                                duration: 0.2,
                                ease: "easeInOut"
                              }
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 35,
                              mass: 1.2
                            }}
                          >
                            <motion.button
                              onClick={() => handleChangeCover(book.id)}
                              disabled={uploadingCoverId === book.id || deletingId === book.id}
                              className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                              whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                delay: 0.1, 
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                                mass: 0.8
                              }}
                            >
                              <motion.div
                              initial={{ opacity: 0, x: 15, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ 
                                delay: 0.02, 
                                duration: 0.1
                              }}
                              >
                                <Image className="w-4 h-4" />
                              </motion.div>
                              {uploadingCoverId === book.id ? 'Uploading...' : 'Change Cover'}
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(book.id)}
                              disabled={deletingId === book.id || uploadingCoverId === book.id}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                              whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                delay: 0.2, 
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                                mass: 0.8
                              }}
                            >
                              <motion.div
                              initial={{ opacity: 0, x: 15, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ 
                                delay: 0.02, 
                                duration: 0.1
                              }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.div>
                              {deletingId === book.id ? 'Deleting...' : 'Delete Book'}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-black">
                      <span>{formatFileSize(book.file_size)}</span>
                      <span>{formatDate(book.uploaded_at)}</span>
                    </div>
                    
                    {book.reading_progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-black">
                          <span>Progress</span>
                          <span>{book.reading_progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <motion.div 
                            className="bg-blue-500 h-1 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${book.reading_progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <motion.button
                    onClick={() => onBookSelect(book)}
                    className="w-full bg-white text-black font-inter tracking-tighter py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BookOpen className="w-4 h-4" />
                    Read
                  </motion.button>
                </div>
              ) : (
                // List view
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {/* Book Cover - Small */}
                      <div className="w-12 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={`${book.title} cover`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${book.cover_image_url ? 'hidden' : ''} flex items-center justify-center text-gray-400`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black truncate font-inter" title={book.title}>
                          {book.title}
                        </h3>
                        <p className="text-sm text-black truncate font-inter tracking-tighter" title={book.author}>
                          {book.author}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-black">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {formatFileSize(book.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(book.uploaded_at)}
                      </span>
                      {book.reading_progress > 0 && (
                        <span>{book.reading_progress}% read</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => onBookSelect(book)}
                      className="bg-white font-inter tracking-tighter text-black py-1 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm border border-gray-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Read
                    </motion.button>
                    <div className="relative">
                      <motion.button
                        ref={buttonRef}
                        onClick={() => toggleMenu(book.id)}
                        className="text-black hover:text-gray-600 transition-colors p-1"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        animate={openMenuId === book.id ? { rotate: 90 } : { rotate: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>
                      
                      <AnimatePresence mode="wait">
                        {openMenuId === book.id && (
                          <motion.div 
                            ref={menuRef}
                            className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]"
                            initial={{ 
                              opacity: 0, 
                              scale: 0.8,
                              x: 20,
                              y: -20
                            }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              x: 0,
                              y: 0
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.8,
                              x: 20,
                              y: -20,
                              transition: {
                                duration: 0.2,
                                ease: "easeInOut"
                              }
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 35,
                              mass: 1.2
                            }}
                          >
                            <motion.button
                              onClick={() => handleChangeCover(book.id)}
                              disabled={uploadingCoverId === book.id || deletingId === book.id}
                              className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                              whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                delay: 0.1, 
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                                mass: 0.8
                              }}
                            >
                              <motion.div
                              initial={{ opacity: 0, x: 15, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ 
                                delay: 0.02, 
                                duration: 0.1
                              }}
                              >
                                <Image className="w-4 h-4" />
                              </motion.div>
                              {uploadingCoverId === book.id ? 'Uploading...' : 'Change Cover'}
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(book.id)}
                              disabled={deletingId === book.id || uploadingCoverId === book.id}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                              whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                delay: 0.2, 
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                                mass: 0.8
                              }}
                            >
                              <motion.div
                              initial={{ opacity: 0, x: 15, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ 
                                delay: 0.02, 
                                duration: 0.1
                              }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.div>
                              {deletingId === book.id ? 'Deleting...' : 'Delete Book'}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
