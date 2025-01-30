/**
 * A wrapper function to handle async errors in route handlers.
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} The wrapped function.
 */
export const wrap =
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(fn: any) =>
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(...args: any) =>
			fn(...args).catch(args[2]);

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
 * A class for better error handling with structured error arrays or objects.
 */
export class ErrorAO extends Error {
	errorAO:
		| {
				[key: string]: string[];
		  }
		| string[];

	status: number;

	/**
	 * Constructor for the ErrorAO class.
	 * @param {Object|Array} [errorAO] - The error array list or object list.
	 * @param {string} [name] - The error name.
	 * @param {number} [status] - The HTTP status code (default is 400).
	 * @param {...string} params - Other parameters.
	 */
	constructor(
		errorAO?:
			| {
					[key: string]: string[];
			  }
			| string[],
		name?: string,
		status?: number,
		...params: string[]
	) {
		super(...params);
		this.name = name || "ErrorAO";
		this.status = status || 400;
		this.errorAO = errorAO || {};
	}
}
