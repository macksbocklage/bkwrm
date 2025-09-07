# Highlighting Troubleshooting Guide

## Quick Debugging Steps

### 1. Check Database Setup
First, make sure the highlights table exists and is properly configured:

```sql
-- Run this in your Supabase SQL editor to check the table
SELECT * FROM information_schema.tables WHERE table_name = 'highlights';
```

If the table doesn't exist, run the `highlights-schema-fresh.sql` script.

### 2. Check Browser Console
Open your browser's developer tools (F12) and look for:
- Console logs showing "Setting up highlight functionality in EPUB content"
- Any error messages when selecting text
- Network requests to `/api/highlights` endpoints

### 3. Test with Debug Component
The debug component in the bottom-right corner will show:
- Book ID (should not be "Not provided")
- Number of highlights loaded
- Any loading or error states

### 4. Test Highlight Creation
Use the "Create Test Highlight" button in the debug component to test if the API is working.

## Common Issues and Solutions

### Issue 1: "Book ID: Not provided"
**Problem**: The bookId is not being passed to the TestEpubReader component.

**Solution**: Check that the reader page is passing the bookId:
```tsx
// In src/app/reader/[bookId]/page.tsx
<TestEpubReader 
  filePath={book.file_url} 
  onClose={handleClose}
  onProgressUpdate={handleProgressUpdate}
  bookTitle={book.title}
  bookAuthor={book.author}
  bookId={book.id} // Make sure this line exists
/>
```

### Issue 2: Text Selection Not Working
**Problem**: Text selection events are not being captured.

**Solutions**:
1. Make sure you're selecting text within the EPUB content area (not the header)
2. Check if the EPUB content is loaded (you should see "Setting up highlight functionality" in console)
3. Try selecting text after the EPUB has fully loaded

### Issue 3: Highlights Not Appearing
**Problem**: Highlights are created but not visually displayed.

**Solutions**:
1. Check if highlights are being created (look in the debug component)
2. The HighlightRenderer might not be finding the text to wrap
3. Try refreshing the page to see if highlights appear

### Issue 4: API Errors
**Problem**: Network requests to create highlights are failing.

**Solutions**:
1. Check the Network tab in developer tools for failed requests
2. Verify your Supabase environment variables are correct
3. Check if the highlights table has the correct RLS policies

### Issue 5: Database Connection Issues
**Problem**: Cannot connect to Supabase or highlights table.

**Solutions**:
1. Verify your `.env.local` file has the correct Supabase credentials
2. Check if the highlights table exists in your Supabase dashboard
3. Ensure RLS policies allow your user to insert highlights

## Step-by-Step Testing

1. **Open a book** in the EPUB reader
2. **Check the debug panel** in the bottom-right corner
3. **Verify Book ID** is shown (not "Not provided")
4. **Try selecting text** in the EPUB content
5. **Check console logs** for any error messages
6. **Use the test button** to create a test highlight
7. **Check if highlights appear** in the debug panel

## Manual Testing

If automatic highlighting isn't working, you can test the API directly:

```javascript
// Open browser console and run this:
fetch('/api/highlights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    book_id: 'your-book-id-here',
    text: 'Test highlight',
    start_cfi: 'test-start',
    end_cfi: 'test-end',
    color: '#ffff00'
  })
}).then(r => r.json()).then(console.log);
```

## Still Not Working?

If highlighting still doesn't work after following these steps:

1. **Check the browser console** for any JavaScript errors
2. **Verify the database** has the highlights table with correct structure
3. **Test the API endpoints** directly using the browser's Network tab
4. **Check if the EPUB file** is loading correctly
5. **Try with a different EPUB file** to see if it's file-specific

The debug component should help identify exactly where the issue is occurring.
