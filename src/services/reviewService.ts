import api from './api';

export interface CreateReviewInput {
  bookingId: string;
  overallRating: number;
  cleanlinessRating?: number;
  hospitalityRating?: number;
  foodRating?: number;
  comfortRating?: number;
  valueForMoneyRating?: number;
  title: string;
  review: string;
  pros?: string;
  cons?: string;
  wouldRecommend?: boolean;
  anonymous?: boolean;
  images?: string[];
}

export interface ReviewItem {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  houseboatId: string;
  houseboatName: string;
  hostId: string;
  overallRating: number;
  cleanlinessRating: number;
  hospitalityRating: number;
  foodRating: number;
  comfortRating: number;
  valueForMoneyRating: number;
  title: string;
  review: string;
  pros: string | null;
  cons: string | null;
  wouldRecommend: boolean;
  anonymous: boolean;
  status: 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REPORTED' | 'REMOVED';
  helpfulCount: number;
  reportedCount: number;
  hostReply: string | null;
  hostRepliedAt: string | null;
  travelDate: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  isHelpfulByCurrentUser?: boolean;
  isEditable?: boolean;
}

export interface RatingBreakdownSummary {
  overallAverage: number;
  totalReviews: number;
  categoryAverages: {
    cleanliness: number;
    hospitality: number;
    food: number;
    comfort: number;
    valueForMoney: number;
  };
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendationPercentage: number;
}

export interface HouseboatReviewsResponse {
  reviews: ReviewItem[];
  total: number;
  breakdown: RatingBreakdownSummary;
}

export const reviewService = {
  async getFeaturedReviews(limit = 6): Promise<ReviewItem[]> {
    const res = await api.get('/v1/reviews/featured', { params: { limit } });
    return res.data.data.reviews;
  },

  async getHouseboatReviews(
    houseboatId: string,
    params?: { sortBy?: string; page?: number; limit?: number }
  ): Promise<HouseboatReviewsResponse> {
    const res = await api.get(`/v1/reviews/houseboat/${houseboatId}`, { params });
    return res.data.data;
  },

  async getCustomerReviews(): Promise<ReviewItem[]> {
    const res = await api.get('/v1/reviews/customer');
    return res.data.data.reviews;
  },

  async getHostReviews(): Promise<ReviewItem[]> {
    const res = await api.get('/v1/reviews/host');
    return res.data.data.reviews;
  },

  async getAdminReviews(params?: { status?: string; minRating?: number; page?: number }): Promise<{ reviews: ReviewItem[]; total: number }> {
    const res = await api.get('/v1/reviews/admin', { params });
    return res.data.data;
  },

  async createReview(input: CreateReviewInput): Promise<ReviewItem> {
    const res = await api.post('/v1/reviews', input);
    return res.data.data;
  },

  async updateReview(id: string, input: Partial<CreateReviewInput>): Promise<ReviewItem> {
    const res = await api.patch(`/v1/reviews/${id}`, input);
    return res.data.data;
  },

  async addHostReply(id: string, reply: string): Promise<ReviewItem> {
    const res = await api.post(`/v1/reviews/${id}/reply`, { reply });
    return res.data.data;
  },

  async toggleHelpful(id: string): Promise<{ helpfulCount: number; isHelpful: boolean }> {
    const res = await api.post(`/v1/reviews/${id}/helpful`);
    return res.data.data;
  },

  async reportReview(id: string, reason: string, description?: string): Promise<void> {
    await api.post(`/v1/reviews/${id}/report`, { reason, description });
  },

  async updateReviewStatus(id: string, status: string): Promise<ReviewItem> {
    const res = await api.patch(`/v1/reviews/${id}/status`, { status });
    return res.data.data;
  },

  async deleteReview(id: string): Promise<void> {
    await api.delete(`/v1/reviews/${id}`);
  },
};
