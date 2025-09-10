'use client';

import { useState, useEffect, useCallback } from 'react';
import { Highlight, CreateHighlightData, UpdateHighlightData } from '@/lib/types';

interface UseHighlightsReturn {
  highlights: Highlight[];
  loading: boolean;
  error: string | null;
  createHighlight: (data: CreateHighlightData) => Promise<Highlight | null>;
  updateHighlight: (id: string, data: UpdateHighlightData) => Promise<Highlight | null>;
  deleteHighlight: (id: string) => Promise<boolean>;
  loadHighlights: (bookId: string) => Promise<void>;
}

export function useHighlights(): UseHighlightsReturn {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHighlights = useCallback(async (bookId: string) => {
    if (!bookId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/highlights?bookId=${bookId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load highlights');
      }
      
      const data = await response.json();
      setHighlights(data.highlights || []);
    } catch (err) {
      console.error('Error loading highlights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load highlights');
    } finally {
      setLoading(false);
    }
  }, []);

  const createHighlight = useCallback(async (data: CreateHighlightData): Promise<Highlight | null> => {
    setError(null);
    
    try {
      console.log('Creating highlight with data:', data);
      
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Highlight API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Highlight API error:', errorData);
        throw new Error(errorData.error || 'Failed to create highlight');
      }
      
      const result = await response.json();
      console.log('Highlight API success:', result);
      const newHighlight = result.highlight;
      
      // Add to local state
      setHighlights(prev => [...prev, newHighlight]);
      
      return newHighlight;
    } catch (err) {
      console.error('Error creating highlight:', err);
      setError(err instanceof Error ? err.message : 'Failed to create highlight');
      return null;
    }
  }, []);

  const updateHighlight = useCallback(async (id: string, data: UpdateHighlightData): Promise<Highlight | null> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/highlights/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update highlight');
      }
      
      const result = await response.json();
      const updatedHighlight = result.highlight;
      
      // Update local state
      setHighlights(prev => 
        prev.map(h => h.id === id ? updatedHighlight : h)
      );
      
      return updatedHighlight;
    } catch (err) {
      console.error('Error updating highlight:', err);
      setError(err instanceof Error ? err.message : 'Failed to update highlight');
      return null;
    }
  }, []);

  const deleteHighlight = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/highlights/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        let errorData = {};
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          errorData = { error: 'Invalid response format', rawResponse: responseText };
        }
        console.error('❌ Delete failed with status', response.status, ':', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete highlight`);
      }
      
      // Remove from local state
      setHighlights(prev => prev.filter(h => h.id !== id));
      
      return true;
    } catch (err) {
      console.error('❌ Error deleting highlight:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete highlight');
      return false;
    }
  }, []);

  return {
    highlights,
    loading,
    error,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    loadHighlights,
  };
}
