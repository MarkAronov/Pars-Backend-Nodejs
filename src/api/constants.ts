export const MEDIA_RULES = {
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    FILE_NAME_LENGTH: 32
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

export const ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
