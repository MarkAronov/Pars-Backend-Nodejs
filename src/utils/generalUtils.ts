// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
