'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Trash2 } from 'lucide-react';
import { Highlight } from '@/lib/types';

interface HighlightToolbarProps {
  highlight: Highlight | null;
  onClose: () => void;
  onUpdateColor: (highlightId: string, color: string) => void;
  onDelete: (highlightId: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#00bfff' },
  { name: 'Pink', value: '#ff69b4' },
  { name: 'Orange', value: '#ffa500' },
  { name: 'Purple', value: '#da70d6' },
];

export default function HighlightToolbar({ 
  highlight, 
  onClose, 
  onUpdateColor, 
  onDelete 
}: HighlightToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!highlight) return null;

  const handleColorChange = (color: string) => {
    onUpdateColor(highlight.id, color);
    setShowColorPicker(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(highlight.id);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm"
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 15,
          mass: 0.6
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Highlight Options</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">Selected text:</p>
          <p className="text-sm bg-gray-50 p-2 rounded border italic">
            "{highlight.text}"
          </p>
        </div>

        <div className="space-y-3">
          {/* Color Picker */}
          <div>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <Palette className="w-4 h-4" />
              <span className="text-sm">Change Color</span>
              <div 
                className="w-4 h-4 rounded border border-gray-300 ml-auto"
                style={{ backgroundColor: highlight.color }}
              />
            </button>
            
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  className="mt-2 p-2 bg-gray-50 rounded border"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        className={`p-2 rounded border-2 transition-all ${
                          highlight.color === color.value 
                            ? 'border-gray-400 scale-105' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 w-full p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete Highlight</span>
            </button>
          ) : (
            <div className="border border-red-200 rounded p-3 bg-red-50">
              <p className="text-sm text-red-800 mb-3">
                Are you sure you want to delete this highlight?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
