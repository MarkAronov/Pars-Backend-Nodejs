import { MEDIA_RULES } from '../constants';
import { ROLES } from '../constants';

export const TOPIC_RULES = {
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 3,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_ICON_SIZE: 1024 * 1024, // 1MB
    MAX_BANNER_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: MEDIA_RULES.ALLOWED_IMAGE_TYPES,
    DEFAULT_ORDER: 0,
    ALLOWED_ROLES: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN] as const
} as const;

export const TOPIC_SORT_OPTIONS = {
    ORDER: 'order',
    NAME: 'name',
    NEWEST: 'newest',
    MOST_THREADS: 'most_threads'
} as const;

export const TOPIC_FILTERS = {
    ALL: 'all',
    PUBLIC: 'public',
    PRIVATE: 'private'
} as const;
