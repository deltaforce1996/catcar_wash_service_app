// Promotion API Types
export interface PromotionUser {
  id: string;
  user: {
    id: string;
    fullname: string;
    email: string;
  };
}

export interface PromotionResponseApi {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_users: PromotionUser[];
}

export interface CreatePromotionPayload {
  name: string;
  description?: string;
  discount_percent: number;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  user_ids?: string[];
}

export interface UpdatePromotionPayload {
  name?: string;
  description?: string;
  discount_percent?: number;
  start_date?: string; // ISO datetime string
  end_date?: string; // ISO datetime string
  is_active?: boolean;
  user_ids?: string[];
}

export interface SearchPromotionsRequest {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "updated_at" | "name" | "start_date" | "end_date" | "discount_percent";
  sort_order?: "asc" | "desc";
}

export interface PaginatedPromotionResponse {
  items: PromotionResponseApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
