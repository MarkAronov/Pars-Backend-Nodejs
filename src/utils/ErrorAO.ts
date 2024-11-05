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
