export interface CleaningSession {
  id: number;
  room_type: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  checklist_items?: ChecklistItem[];
  photos?: Photo[];
}

export interface ChecklistItem {
  id: number;
  session_id: number;
  item_id: number;
  category: string;
  text: string;
  is_completed: boolean;
  completed_at: string | null;
  photos?: Photo[];
}

export interface Photo {
  id: number;
  session_id: number;
  item_id: number;
  photo_url: string;
  uploaded_at: string;
}
