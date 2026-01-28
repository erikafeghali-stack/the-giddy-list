import { GuideTopicType, TopicSchedule, AgeRange, CollectionCategory } from './types';

// Topic schedule by day of week (0 = Sunday, 6 = Saturday)
export const TOPIC_SCHEDULE: Record<number, TopicSchedule> = {
  0: { type: 'age', params: ['0-2', '3-5'] },      // Sunday: Toddler & Preschool
  1: { type: 'category', params: ['toys'] },       // Monday: Toys
  2: { type: 'occasion', params: ['birthday'] },   // Tuesday: Birthday
  3: { type: 'age', params: ['6-8', '9-12'] },     // Wednesday: School Age
  4: { type: 'category', params: ['books'] },      // Thursday: Books
  5: { type: 'seasonal', params: ['current'] },    // Friday: Seasonal
  6: { type: 'age', params: ['13-18'] },           // Saturday: Teens
};

// Age range display names
export const AGE_RANGE_NAMES: Record<AgeRange, string> = {
  '0-2': 'Baby & Toddler (0-2)',
  '3-5': 'Preschool (3-5)',
  '6-8': 'Early Elementary (6-8)',
  '9-12': 'Tweens (9-12)',
  '13-18': 'Teens (13-18)',
};

// Category display names
export const CATEGORY_NAMES: Record<CollectionCategory, string> = {
  'toys': 'Toys & Games',
  'clothing': 'Clothing & Accessories',
  'books': 'Books & Reading',
  'gear': 'Baby Gear & Equipment',
  'room-decor': 'Room Decor',
  'outdoor': 'Outdoor & Active Play',
  'arts-crafts': 'Arts & Crafts',
  'electronics': 'Electronics & Tech',
  'sports': 'Sports & Fitness',
  'other': 'Other',
};

// Occasion templates
export const OCCASION_TEMPLATES = {
  birthday: 'Birthday Gift Guide',
  christmas: 'Christmas Gift Guide',
  hanukkah: 'Hanukkah Gift Guide',
  'back-to-school': 'Back to School Gift Guide',
  'easter': 'Easter Gift Guide',
  'valentines': "Valentine's Day Gift Guide",
  'mothers-day': "Mother's Day Gift Guide",
  'fathers-day': "Father's Day Gift Guide",
  'graduation': 'Graduation Gift Guide',
};

// Seasonal content based on month
export function getCurrentSeason(): string {
  const month = new Date().getMonth();

  if (month >= 10 || month === 0) return 'winter-holidays';
  if (month >= 1 && month <= 2) return 'spring';
  if (month >= 3 && month <= 4) return 'summer-prep';
  if (month >= 5 && month <= 6) return 'summer';
  if (month >= 7 && month <= 8) return 'back-to-school';
  return 'fall';
}

// Get seasonal topic params
export function getSeasonalParams(): string[] {
  const season = getCurrentSeason();

  const seasonOccasions: Record<string, string[]> = {
    'winter-holidays': ['christmas', 'hanukkah'],
    'spring': ['easter', 'spring-outdoor'],
    'summer-prep': ['graduation', 'summer-prep'],
    'summer': ['outdoor', 'travel'],
    'back-to-school': ['back-to-school'],
    'fall': ['fall-indoor', 'halloween'],
  };

  return seasonOccasions[season] || ['general'];
}

// Get today's topic based on day of week
export function getTodaysTopic(): TopicSchedule {
  const dayOfWeek = new Date().getDay();
  const topic = TOPIC_SCHEDULE[dayOfWeek];

  // Handle seasonal params for Friday
  if (topic.type === 'seasonal' && topic.params[0] === 'current') {
    return {
      ...topic,
      params: getSeasonalParams(),
    };
  }

  return topic;
}

// Generate a guide topic for a specific configuration
export function generateGuideTopic(type: GuideTopicType, params: string[]): {
  title: string;
  slug: string;
  occasion: string | null;
  ageRange: AgeRange | null;
  category: CollectionCategory | null;
} {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  switch (type) {
    case 'age': {
      const ageRange = params[0] as AgeRange;
      const ageName = AGE_RANGE_NAMES[ageRange] || ageRange;
      return {
        title: `Best Gifts for ${ageName}`,
        slug: `gifts-for-${ageRange.replace('-', '-to-')}-year-olds-${timestamp}`,
        occasion: null,
        ageRange,
        category: null,
      };
    }

    case 'category': {
      const category = params[0] as CollectionCategory;
      const categoryName = CATEGORY_NAMES[category] || category;
      return {
        title: `Best ${categoryName} for Kids`,
        slug: `best-${category}-for-kids-${timestamp}`,
        occasion: null,
        ageRange: null,
        category,
      };
    }

    case 'occasion': {
      const occasion = params[0];
      const occasionTitle = OCCASION_TEMPLATES[occasion as keyof typeof OCCASION_TEMPLATES] || `${occasion} Gift Guide`;
      return {
        title: occasionTitle,
        slug: `${occasion}-gift-guide-${timestamp}`,
        occasion,
        ageRange: null,
        category: null,
      };
    }

    case 'seasonal': {
      const season = params[0];
      // Handle seasonal as an occasion variant
      const occasionTitle = OCCASION_TEMPLATES[season as keyof typeof OCCASION_TEMPLATES] || `${season.replace('-', ' ')} Gift Guide`;
      return {
        title: occasionTitle,
        slug: `${season}-gift-guide-${timestamp}`,
        occasion: season,
        ageRange: null,
        category: null,
      };
    }

    default:
      return {
        title: 'Gift Guide',
        slug: `gift-guide-${timestamp}`,
        occasion: null,
        ageRange: null,
        category: null,
      };
  }
}

// Get suggested topics for the next 7 days
export function getUpcomingTopics(): Array<TopicSchedule & { dayName: string; date: string }> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const topics: Array<TopicSchedule & { dayName: string; date: string }> = [];

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    const topic = TOPIC_SCHEDULE[dayOfWeek];

    // Handle seasonal params
    const resolvedParams =
      topic.type === 'seasonal' && topic.params[0] === 'current'
        ? getSeasonalParams()
        : topic.params;

    topics.push({
      ...topic,
      params: resolvedParams,
      dayName: days[dayOfWeek],
      date: date.toISOString().slice(0, 10),
    });
  }

  return topics;
}

// Check if a similar guide was recently generated
export function shouldGenerateGuide(
  existingGuides: Array<{ slug: string; created_at: string }>,
  newSlugBase: string,
  minDaysBetween: number = 7
): boolean {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDaysBetween);

  // Check if any guide with a similar slug was created recently
  const recentSimilar = existingGuides.find(guide => {
    const createdAt = new Date(guide.created_at);
    const isSimilar = guide.slug.includes(newSlugBase.split('-').slice(0, 3).join('-'));
    return isSimilar && createdAt > cutoffDate;
  });

  return !recentSimilar;
}
