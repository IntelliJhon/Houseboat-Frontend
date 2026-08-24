import api from './api';

let memoryCache: any[] | null = null;
const CACHE_KEY = 'b4boat_cached_listings';

export const listingsCache = {
  // Get cached listings instantly from memory or sessionStorage
  getInitialListings: (): any[] => {
    if (memoryCache && memoryCache.length > 0) {
      return memoryCache;
    }
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('SessionStorage cache read error:', e);
    }
    return [];
  },

  // Fetch fresh listings with Stale-While-Revalidate
  fetchListingsFresh: async (onFreshData?: (data: any[]) => void): Promise<any[]> => {
    try {
      const response = await api.get('/v1/listings');
      const dbVessels = response.data?.data?.listings || [];

      const mapped = dbVessels.map((dbBoat: any) => ({
        id: dbBoat.id,
        name: dbBoat.name,
        location: dbBoat.location || 'Alleppey',
        pricePerNight: dbBoat.pricePerNight,
        rating: dbBoat.averageRating || 4.8,
        reviewsCount: dbBoat.reviewCount || 12,
        category: dbBoat.category || 'Premium',
        bedrooms: dbBoat.bedrooms,
        capacity: dbBoat.capacity,
        images: dbBoat.images?.length > 0 ? dbBoat.images : ['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80'],
        amenities: dbBoat.amenities || [],
        bookings: dbBoat.bookings || [],
      }));

      memoryCache = mapped;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
      } catch (e) {
        // quota exceeded guard
      }

      if (onFreshData) {
        onFreshData(mapped);
      }

      return mapped;
    } catch (err) {
      console.error('Failed to fetch fresh listings:', err);
      return memoryCache || [];
    }
  },

  // Get destination count map instantly
  getDestinationCounts: (vessels: any[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    vessels.forEach((item: any) => {
      const loc = item.location || 'Alleppey';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return counts;
  }
};
