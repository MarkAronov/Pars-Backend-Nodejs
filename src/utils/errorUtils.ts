import type { ValidationError } from "../types/generalTypes";

/**
 * Composes validation errors into a structured format.
 * @param {ValidationError} error - The validation error object.
 * @returns {Object} The composed error object.
 */
export const validationErrorComposer = (
	error: ValidationError,
): { [key: string]: string[] } => {
	const errorArray: { [key: string]: string[] } = {};
	const errorKeys: string[] = Object.keys(error.errors);
	for (const errorKey of errorKeys) {
		const CapKey = errorKey.charAt(0).toUpperCase() + errorKey.slice(1);

		const errExtract = error.errors[errorKey].properties.reason;
		if (errExtract) {
			errorArray[errorKey] = errExtract.errorAO;
		}

		const dupeMessage = error.errors[errorKey].properties.message;
		if (dupeMessage === "dupe") {
			errorArray[errorKey] = [
				`${CapKey} is being currently used, use a different one`,
			];
		}

		if (
			error.errors[errorKey].kind === "maxlength" &&
			errorKey !== "displayName"
		) {
			errorArray[errorKey] = [error.errors[errorKey].properties.message];
		}

		if (error.errors[errorKey].properties.type === "required") {
			errorArray[errorKey] = [`${CapKey} is empty`];
		}
	}
	return errorArray;
};

interface MulterError {
	code?: string;
}

/**
 * Composes multer errors into a structured format.
 * @param {MulterError} error - The multer error object.
 * @returns {Object} The composed error object.
 */
export const multerErrorComposer = (
	error: MulterError,
): { [index: string]: string[] } => {
	const errorMessages: { [index: string]: string } = {
		LIMIT_PART_COUNT: "Too many parts",
		LIMIT_FILE_SIZE: "File too large",
		LIMIT_FILE_COUNT: "Too many files",
		LIMIT_FIELD_KEY: "Field name too long",
		LIMIT_FIELD_VALUE: "Field value too long",
		LIMIT_FIELD_COUNT: "Too many fields",
		LIMIT_UNEXPECTED_FILE: "Unexpected file",
		MISSING_FIELD_NAME: "Field name missing",
	};

	if (error.code) {
		const errMsg = errorMessages[error.code];
		if (errMsg) return { media: [errMsg] };
	}
	return {};
};
