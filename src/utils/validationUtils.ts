import validator from "validator";

/**
 * Removes duplicate elements from an array.
 * @param {string[]} arr - The input array.
 * @returns {string[]} The filtered array without duplicates.
 */
export const filterDupes = (arr: string[] = []): string[] => {
	const map = new Map();
	let filtered: string[] = [];
	for (const a of arr) {
		if (!map.get(a)) {
			map.set(a, true);
			filtered = filtered.concat(a);
		}
	}
	return filtered;
};

/**
 * Checks if a username is valid.
 * @param {string} str - The username to check.
 * @returns {string[]} An array of errors found.
 */
export const usernameChecker = (str = ""): string[] => {
	const nameErrors = [];

	if (validator.contains(str, " "))
		nameErrors.push("Username contains whitespace");
	if (!str.match(/^[0-9a-zA-Z\s]+$/))
		nameErrors.push("Username contains non-alphanumeric characters");
	return nameErrors;
};

/**
 * Checks if an email is valid.
 * @param {string} str - The email to check.
 * @returns {string[]} An array of errors found.
 */
export const emailChecker = (str = ""): string[] => {
	const emailErrors = [];

	if (!validator.isEmail(str)) emailErrors.push("Invalid email");
	return emailErrors;
};

/**
 * Checks if a password is valid.
 * @param {string} str - The password to check.
 * @returns {string[]} An array of errors found.
 */
export const passwordChecker = (str = ""): string[] => {
	const passwordErrors = [];
	const lowercase = str.match(/[a-z]/);
	const uppercase = str.match(/[A-Z]/);
	const numbers = str.match(/[0-9]/);

	// Minimum: 10 chars | 1 Uppercase | 1 lowercase | 1 digit
	if (str.length < 10)
		passwordErrors.push("Password is less than 10 characters");
	if (!lowercase)
		passwordErrors.push("Password must have at least one lowercase letter");
	if (!uppercase)
		passwordErrors.push("Password must have at least one uppercase letter");
	if (!numbers) passwordErrors.push("Password must have at least one digit");

	return passwordErrors;
};

/**
 * Calculates the entropy of a string.
 * @param {string} str - The string to calculate entropy for.
 * @returns {number} The entropy value.
 */
export const entropy = (str: string): number => {
	// Password entropy
	const E: number = str.length * Math.log2(filterDupes(str.split("")).length);

	return E;
};
