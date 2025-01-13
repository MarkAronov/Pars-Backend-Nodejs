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
