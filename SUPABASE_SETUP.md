# Supabase Integration Setup

This document explains how to set up Supabase for the BKWRM application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created

## Setup Steps

### 1. Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project dashboard under Settings > API.

### 2. Database Setup

Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL commands

This will create:
- The `books` table with proper schema
- Row Level Security (RLS) policies
- Storage bucket for books
- Storage policies for file access

### 3. Storage Configuration

The schema creates a `books` storage bucket with the following structure:
- Files are stored in user-specific folders: `{user_id}/{file_id}.epub`
- RLS policies ensure users can only access their own files
- Files are not public by default (requires authentication)

### 4. Authentication Integration

The app uses Clerk for authentication, but Supabase handles:
- File storage with user-specific access
- Database queries with RLS policies
- User identification via Clerk's `userId`

## Features Implemented

### Book Management
- Upload EPUB files to Supabase Storage
- Extract metadata (title, author) from EPUB files
- Store book information in Supabase database
- View book library with search and filtering
- Delete books (removes both file and database record)

### Reading Progress
- Track reading progress (0-100%)
- Update last read timestamp
- Display progress in book library
- Persist progress across sessions

### User Experience
- Dark theme UI
- Grid and list view for books
- Search functionality
- File size and upload date display
- Loading states and error handling

## API Endpoints

- `POST /api/upload` - Upload EPUB file and create book record
- `GET /api/books` - Get all books for authenticated user
- `GET /api/books/[id]` - Get specific book details
- `PATCH /api/books/[id]` - Update book progress or last read time
- `DELETE /api/books` - Delete book (requires bookId query param)

## File Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   └── types.ts             # TypeScript interfaces
├── hooks/
│   └── useBooks.ts          # React hook for book management
├── components/
│   ├── BookLibrary.tsx      # Book library component
│   └── TestEpubReader.tsx   # EPUB reader component
└── app/
    ├── api/
    │   ├── upload/route.ts  # File upload endpoint
    │   └── books/           # Book CRUD endpoints
    ├── home/page.tsx        # Main dashboard
    └── reader/[bookId]/     # Book reader page
```

## Security Features

- Row Level Security (RLS) ensures users only see their own books
- File uploads are validated for EPUB format
- User authentication required for all operations
- File paths are user-specific to prevent unauthorized access
- Automatic cleanup when books are deleted

## Next Steps

1. Set up your Supabase project
2. Update environment variables
3. Run the database schema
4. Test the application with a sample EPUB file

The application is now ready to store and manage user books in Supabase!
