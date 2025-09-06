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
}
