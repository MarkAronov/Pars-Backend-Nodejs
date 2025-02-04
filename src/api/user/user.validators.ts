import validator from 'validator';
import { PASSWORD_RULES, USERNAME_RULES } from './user.constants';
import { ErrorAO } from '../../utils/generalUtils';

export const validateUsername = (value: string): void => {
    const errors = [];
    if (validator.contains(value, " ")) errors.push("Username contains whitespace");
    if (!value.match(USERNAME_RULES.PATTERN)) errors.push("Username contains non-alphanumeric characters");
    if (errors.length) throw new ErrorAO(errors, "username");
};

export const validatePassword = (value: string): void => {
    const errors = [];
    if (value.length < PASSWORD_RULES.MIN_LENGTH) errors.push("Must be at least 10 characters.");
    if (!PASSWORD_RULES.PATTERNS.UPPERCASE.test(value)) errors.push("Must contain an uppercase letter.");
    if (!PASSWORD_RULES.PATTERNS.LOWERCASE.test(value)) errors.push("Must contain a lower letter.");
    if (!PASSWORD_RULES.PATTERNS.DIGIT.test(value)) errors.push("Must contain a digit.");
    if (!PASSWORD_RULES.PATTERNS.SPECIAL.test(value)) errors.push("Must contain a special character.");
    if (errors.length) throw new ErrorAO(errors, "password");
};

export const validateEmail = (value: string): void => {
    if (!validator.isEmail(value)) throw new ErrorAO(["Invalid email"], "email");
};
