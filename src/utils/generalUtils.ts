/**
 * Normalize a port into a number, string, or false.
 * @param {string} val - The port value to normalize.
 * @returns {boolean | string | number} The normalized port value.
 */
export const normalizePort = (val: string): boolean | string | number => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * A wrapper function to handle async errors in route handlers.
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} The wrapped function.
 */
export const wrap =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier
    (fn: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any) =>
      fn(...args).catch(args[2]);
