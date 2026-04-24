/**
 * Format a successful response.
 * @param {any} data - The data to return.
 * @returns {string} Serialized JSON response.
 */
export function successResponse(data) {
  return JSON.stringify({
    success: true,
    data,
    error: null,
  });
}

/**
 * Format an error response.
 * @param {string} error - The error message.
 * @returns {string} Serialized JSON response.
 */
export function errorResponse(error) {
  return JSON.stringify({
    success: false,
    data: null,
    error,
  });
}
