'use client';

import { useState, useEffect, useCallback } from 'react';
import { Book, CreateBookData, UpdateBookData } from '@/lib/types';

interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  uploadBook: (file: File) => Promise<Book | null>;
  deleteBook: (bookId: string) => Promise<boolean>;
  updateBook: (bookId: string, data: UpdateBookData) => Promise<boolean>;
  refreshBooks: () => Promise<void>;
  extractCover: (bookId: string) => Promise<boolean>;
  uploadCover: (bookId: string, file: File) => Promise<boolean>;
}

export function useBooks(): UseBooksReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books from API
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/books');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Books API error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch books (${response.status})`);
      }
      
      const data = await response.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload a new book
  const uploadBook = useCallback(async (file: File): Promise<Book | null> => {
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload API error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to upload book (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.success && data.book) {
        // Add the new book to the beginning of the list
        setBooks(prev => [data.book, ...prev]);
        return data.book;
      }
      
      return null;
    } catch (err) {
      console.error('Error uploading book:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload book');
      return null;
    }
  }, []);

  // Delete a book
  const deleteBook = useCallback(async (bookId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/books?bookId=${bookId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete book');
      }
      
      // Remove the book from the local state
      setBooks(prev => prev.filter(book => book.id !== bookId));
      return true;
    } catch (err) {
      console.error('Error deleting book:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete book');
      return false;
    }
  }, []);

  // Update book progress or last read time
  const updateBook = useCallback(async (bookId: string, data: UpdateBookData): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update book');
      }
      
      const responseData = await response.json();
      
      // Update the book in the local state
      setBooks(prev => 
        prev.map(book => 
          book.id === bookId ? responseData.book : book
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating book:', err);
      setError(err instanceof Error ? err.message : 'Failed to update book');
      return false;
    }
  }, []);

  // Extract cover image for a book
  const extractCover = useCallback(async (bookId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/books/${bookId}/cover`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract cover');
      }
      
      const data = await response.json();
      
      if (data.success && data.coverImageUrl) {
        // Update the book in the local state
        setBooks(prev => 
          prev.map(book => 
            book.id === bookId ? { ...book, cover_image_url: data.coverImageUrl } : book
          )
        );
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error extracting cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract cover');
      return false;
    }
  }, []);

  // Upload a new cover image for a book
  const uploadCover = useCallback(async (bookId: string, file: File): Promise<boolean> => {
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await fetch(`/api/books/${bookId}/cover/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload cover');
      }
      
      const data = await response.json();
      
      if (data.success && data.coverImageUrl) {
        // Update the book in the local state
        setBooks(prev => 
          prev.map(book => 
            book.id === bookId ? { ...book, cover_image_url: data.coverImageUrl } : book
          )
        );
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error uploading cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload cover');
      return false;
    }
  }, []);

  // Refresh books (useful for manual refresh)
  const refreshBooks = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  // Load books on mount
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    uploadBook,
    deleteBook,
    updateBook,
    refreshBooks,
    extractCover,
    uploadCover,
  };
}
