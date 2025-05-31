export interface Category {
  category_name: string;
  description: string | null;
  thumbnail: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  title: string | null;
  description: string | null;
  score: number | null;
  icon: string | null;
  time_type: string | null;
  metadata: Record<string, any> | null;
  tags: string[] | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DailyRecommendation {
  id: number;
  date: string | null;
  menu: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string | null;
}
