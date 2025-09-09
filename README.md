# BKWRM - Your Personal Reading Library

A modern, full-featured EPUB reading application built with Next.js, featuring a beautiful interface, highlighting capabilities, and seamless cloud storage integration.

![BKWRM](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Clerk](https://img.shields.io/badge/Clerk-Authentication-purple?style=for-the-badge)

## ✨ Features

### 📚 **Book Management**
- **Upload EPUB files** with drag-and-drop interface
- **Automatic metadata extraction** (title, author, cover image)
- **Personal library** with search and filtering
- **Reading progress tracking** with precise location restoration
- **Cloud storage** with user-specific file organization

### 📖 **Advanced Reading Experience**
- **Beautiful EPUB reader** with customizable font sizes
- **Table of contents** navigation
- **Reading settings** panel
- **Smooth animations** and transitions
- **Responsive design** for all devices

### 🎨 **Highlighting System**
- **Text highlighting** with multiple colors
- **Persistent highlights** that survive page navigation
- **Highlight management** (view, edit, delete)
- **Smart text detection** for accurate highlighting

### 🔐 **Authentication & Security**
- **Clerk authentication** with social login options
- **User-specific data** with Row Level Security (RLS)
- **Secure file storage** with access controls
- **Session management** and automatic sign-out

### 🎭 **Modern UI/UX**
- **Custom typography** with EditorsNote font family
- **Framer Motion animations** for smooth interactions
- **Dark/light theme** support
- **Grid and list view** options
- **Loading states** and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL commands from `add-current-location-migration.sql` in your Supabase SQL editor
   - This creates the necessary tables and RLS policies

5. **Set up Clerk**
   - Create a Clerk account and application
   - Configure social login providers (optional)
   - Add your domain to allowed origins

6. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── books/               # Book CRUD operations
│   │   ├── highlights/          # Highlight management
│   │   └── upload/              # File upload handling
│   ├── home/                    # Main dashboard
│   ├── reader/[bookId]/         # EPUB reader page
│   └── sign-in/                 # Authentication pages
├── components/                   # React components
│   ├── BookLibrary.tsx          # Book library with search/filter
│   ├── SimpleEpubReader.tsx     # Main EPUB reader
│   ├── HighlightRenderer.tsx    # Highlight management
│   ├── EpubUpload.tsx           # File upload component
│   └── PageTransition.tsx       # Animation wrapper
├── hooks/                       # Custom React hooks
│   ├── useBooks.ts              # Book management logic
│   └── useHighlights.ts         # Highlight management logic
└── lib/                         # Utilities and configuration
    ├── supabase.ts              # Supabase client setup
    ├── types.ts                 # TypeScript interfaces
    └── utils.ts                 # Helper functions
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.0** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - PostgreSQL database and file storage
- **Clerk** - Authentication and user management
- **Next.js API Routes** - Server-side logic

### EPUB Processing
- **react-reader** - EPUB rendering library
- **JSZip** - EPUB file parsing
- **CFI (Canonical Fragment Identifier)** - Precise location tracking

## 📖 Usage

### Uploading Books
1. Sign in to your account
2. Click the upload button in the library
3. Drag and drop an EPUB file or click to browse
4. The book will be automatically processed and added to your library

### Reading Books
1. Click on any book in your library
2. The reader will open with the book loaded
3. Use the table of contents to navigate chapters
4. Adjust font size and other settings as needed
5. Your reading progress is automatically saved

### Highlighting Text
1. Select text while reading
2. Choose a highlight color
3. Highlights are automatically saved and will persist
4. View and manage highlights in the highlights panel

## 🔧 API Endpoints

### Books
- `GET /api/books` - Get all books for authenticated user
- `GET /api/books/[id]` - Get specific book details
- `PATCH /api/books/[id]` - Update book progress or metadata
- `DELETE /api/books` - Delete a book (requires bookId query param)

### Highlights
- `GET /api/highlights` - Get all highlights for authenticated user
- `POST /api/highlights` - Create a new highlight
- `PATCH /api/highlights/[id]` - Update a highlight
- `DELETE /api/highlights/[id]` - Delete a highlight

### File Management
- `POST /api/upload` - Upload EPUB file and create book record
- `GET /api/books/[id]/file` - Download book file
- `POST /api/books/[id]/cover/upload` - Upload custom cover image

## 🎨 Customization

### Fonts
The application uses the custom EditorsNote font family. Font files are located in `public/fonts/` and can be replaced with your preferred fonts.

### Styling
The app uses Tailwind CSS for styling. Key design tokens can be customized in the `tailwind.config.js` file.

### Animations
Framer Motion animations can be customized in individual components. The app uses spring-based animations for smooth interactions.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Row Level Security (RLS)** ensures users only access their own data
- **File upload validation** prevents malicious file uploads
- **Authentication required** for all operations
- **User-specific file storage** prevents unauthorized access
- **Automatic cleanup** when books are deleted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [react-reader](https://github.com/gerhardsletten/react-reader) for EPUB rendering
- [Clerk](https://clerk.com) for authentication
- [Supabase](https://supabase.com) for database and storage
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide](https://lucide.dev) for icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Happy Reading! 📚✨**
