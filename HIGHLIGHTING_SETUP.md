# EPUB Text Highlighting Setup

This document explains how to set up the text highlighting feature for the EPUB reader.

## Database Setup

1. **Run the highlights schema migration:**
   ```sql
   -- Copy and paste the contents of highlights-schema.sql into your Supabase SQL editor
   ```

2. **Verify the highlights table was created:**
   - Go to your Supabase dashboard
   - Navigate to Table Editor
   - You should see a new `highlights` table with the following columns:
     - `id` (UUID, Primary Key)
     - `user_id` (TEXT)
     - `book_id` (UUID, Foreign Key to books table)
     - `text` (TEXT)
     - `start_cfi` (TEXT)
     - `end_cfi` (TEXT)
     - `color` (TEXT, default: '#ffff00')
     - `created_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

## Features Implemented

### Text Selection & Highlighting
- **Automatic highlighting**: Select any text in the EPUB reader to automatically create a highlight
- **Visual feedback**: Highlights appear with a yellow background by default
- **Persistent storage**: Highlights are saved to the database and restored when you return to the book

### Highlight Management
- **Color customization**: Click on any highlight to open a toolbar with color options
- **Delete highlights**: Right-click or use the toolbar to delete highlights
- **Highlight toolbar**: Interactive UI for managing highlight properties

### User Experience
- **Real-time updates**: Highlights appear immediately after selection
- **Cross-session persistence**: Highlights remain when you close and reopen the book
- **Responsive design**: Works on different screen sizes
- **Error handling**: Graceful error messages for failed operations

## How to Use

1. **Open a book** in the EPUB reader
2. **Select text** by clicking and dragging over the text you want to highlight
3. **Highlight appears** automatically with a yellow background
4. **Click on a highlight** to open the management toolbar
5. **Change colors** using the color picker in the toolbar
6. **Delete highlights** using the delete button or right-click context menu

## Technical Details

### API Endpoints
- `GET /api/highlights?bookId=xxx` - Get all highlights for a book
- `POST /api/highlights` - Create a new highlight
- `PUT /api/highlights/[id]` - Update a highlight
- `DELETE /api/highlights/[id]` - Delete a highlight

### Database Schema
The highlights are stored with:
- User-specific access (RLS policies)
- Book association (foreign key to books table)
- Text content and location (CFI identifiers)
- Color customization
- Timestamps for creation and updates

### Security
- Row Level Security (RLS) ensures users only see their own highlights
- Input validation on all API endpoints
- User authentication required for all operations

## Troubleshooting

### Highlights not appearing
1. Check if the bookId is being passed correctly to the TestEpubReader component
2. Verify the highlights table exists in your database
3. Check the browser console for any error messages

### Database errors
1. Ensure the highlights table was created successfully
2. Check that RLS policies are properly configured
3. Verify your Supabase environment variables are correct

### Text selection not working
1. Make sure you're selecting text within the EPUB content area
2. Check that the mouseup event listener is properly attached
3. Verify the react-reader library is working correctly

## Next Steps

The highlighting system is now fully functional! Users can:
- Select and highlight text in any EPUB book
- Customize highlight colors
- Manage their highlights with the toolbar
- Have their highlights persist across sessions

The system is ready for production use and can be extended with additional features like:
- Highlight notes/annotations
- Highlight sharing
- Highlight export
- Advanced search within highlights
