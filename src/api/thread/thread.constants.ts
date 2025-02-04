export const THREAD_RULES = {
    MAX_TITLE_LENGTH: 200,
    MIN_TITLE_LENGTH: 3,
    VIEWS_INCREMENT_COOLDOWN: 30 * 60 * 1000, // 30 minutes in milliseconds
    MAX_PINNED_PER_TOPIC: 3
} as const;

export const THREAD_SORT_OPTIONS = {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    MOST_VIEWED: 'most_viewed',
    MOST_REPLIED: 'most_replied',
    LAST_REPLY: 'last_reply'
} as const;

export const THREAD_FILTERS = {
    ALL: 'all',
    PINNED: 'pinned',
    LOCKED: 'locked'
} as const;
