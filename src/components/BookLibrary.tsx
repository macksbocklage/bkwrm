'use client';

import { useState } from 'react';
import { Book } from '@/lib/types';
import { useBooks } from '@/hooks/useBooks';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Trash2, 
  Download,
  Search,
  Grid,
  List
} from 'lucide-react';

interface BookLibraryProps {
  onBookSelect: (book: Book) => void;
}

export default function BookLibrary({ onBookSelect }: BookLibraryProps) {
  const { books, loading, error, deleteBook, updateBook } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleUpdateProgress = async (bookId: string, progress: number) => {
    await updateBook(bookId, { 
      reading_progress: progress,
      last_read_at: new Date().toISOString()
    });
  };

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
        <span className="ml-2 text-blue-600">Loading books...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400 mb-4">Error: {error}</p>
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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-4">Your Library</h2>
        
        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-black border border-gray-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-black border border-gray-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No books match your search.' : 'No books in your library yet.'}
          </p>
          <p className="text-gray-700 text-sm mt-2">
            {searchTerm ? 'Try a different search term.' : 'Upload your first EPUB book to get started.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
              }`}
            >
              {viewMode === 'grid' ? (
                // Grid view
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate" title={book.author}>
                        {book.author}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(book.id)}
                      disabled={deletingId === book.id}
                      className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{formatFileSize(book.file_size)}</span>
                      <span>{formatDate(book.uploaded_at)}</span>
                    </div>
                    
                    {book.reading_progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{book.reading_progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all"
                            style={{ width: `${book.reading_progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => onBookSelect(book)}
                    className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Book
                  </button>
                </div>
              ) : (
                // List view
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" title={book.title}>
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 truncate" title={book.author}>
                          {book.author}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
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
                    <button
                      onClick={() => onBookSelect(book)}
                      className="bg-white text-black py-1 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm border border-gray-200"
                    >
                      Read
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      disabled={deletingId === book.id}
                      className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
