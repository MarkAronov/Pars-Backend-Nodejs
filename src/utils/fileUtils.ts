// import { dirname } from "node:path";
// import { fileURLToPath } from "node:url";
import type { Request } from "../types";

/**
 * Returns the directory name of the current module.
 * @returns {string} The directory name.
 */
// export const dirName = () => dirname(fileURLToPath(import.meta.url));
export const dirName = () => process.cwd();
