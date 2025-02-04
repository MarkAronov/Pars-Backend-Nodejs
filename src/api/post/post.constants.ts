import { MEDIA_RULES } from '../constants';

export const POST_RULES = {
    MAX_CONTENT_LENGTH: 5000,
    MAX_ATTACHMENTS: 4,
    ALLOWED_ATTACHMENT_TYPES: MEDIA_RULES.ALLOWED_IMAGE_TYPES,
    MAX_ATTACHMENT_SIZE: MEDIA_RULES.MAX_FILE_SIZE,
    LIKES_PER_PAGE: 50
} as const;

export const POST_SORT_OPTIONS = {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    MOST_LIKED: 'most_liked',
    MOST_REPLIES: 'most_replies'
} as const;
