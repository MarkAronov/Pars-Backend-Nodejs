export const PASSWORD_RULES = {
    MIN_LENGTH: 10,
    PATTERNS: {
        UPPERCASE: /[A-Z]/,
        LOWERCASE: /[a-z]/,
        DIGIT: /\d/,
        SPECIAL: /[!@#$%^&*(),.?":{}|<>]/
    }
};

export const USERNAME_RULES = {
    MAX_LENGTH: 64,
    PATTERN: /^[0-9a-zA-Z\s]+$/
};

export const DISPLAY_NAME_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254;
export const BIO_MAX_LENGTH = 400;

export const TOKEN_EXPIRY = 1000 * 60 * 60 * 24 * 7; // 7 days
