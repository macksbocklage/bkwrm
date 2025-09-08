export interface Book {
  id: string
  user_id: string
  title: string
  author: string
  file_url: string
  file_size: number
  original_filename: string
  uploaded_at: string
  last_read_at?: string
  reading_progress: number
  current_location?: string  // CFI location for precise position restoration
  cover_image_url?: string
}

export interface CreateBookData {
  user_id: string
  title: string
  author: string
  file_url: string
  file_size: number
  original_filename: string
}

export interface UpdateBookData {
  last_read_at?: string
  reading_progress?: number
  current_location?: string
}

export interface Highlight {
  id: string
  user_id: string
  book_id: string
  text: string
  start_cfi: string
  end_cfi: string
  color: string
  created_at: string
  updated_at: string
}

export interface CreateHighlightData {
  book_id: string
  text: string
  start_cfi: string
  end_cfi: string
  color?: string
}

export interface UpdateHighlightData {
  text?: string
  color?: string
}
