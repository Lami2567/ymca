/**
 * Parses API error responses from Laravel and returns a human-readable error message.
 * Handles:
 *   - Laravel validation errors (422): { errors: { field: ["msg"] } }
 *   - Custom API errors: { error: { message: "..." } }
 *   - Generic Laravel messages: { message: "..." }
 */
export function parseApiError(error: any): string {
  if (!error?.response) {
    return error?.message || 'Network error — could not reach server';
  }

  const { status, data } = error.response;

  // 422 Validation errors - show field-by-field
  if (status === 422 && data?.errors) {
    const messages: string[] = [];
    for (const [field, errors] of Object.entries(data.errors as Record<string, string[]>)) {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const errorList = Array.isArray(errors) ? errors.join(', ') : String(errors);
      messages.push(`${fieldName}: ${errorList}`);
    }
    return messages.join('\n');
  }

  // Custom API error format
  if (data?.error?.message) {
    return data.error.message;
  }

  // Generic Laravel message
  if (data?.message) {
    return data.message;
  }

  // HTTP status fallback
  const statusMessages: Record<number, string> = {
    400: 'Bad request — check your input',
    401: 'Unauthorized — please log in again',
    403: 'Forbidden — you do not have permission',
    404: 'Not found — the resource does not exist',
    409: 'Conflict — a record with this data already exists',
    422: 'Validation failed — check your input',
    500: 'Server error — please try again later',
  };

  return statusMessages[status] || `Request failed with status ${status}`;
}

/**
 * Parses API error and shows a toast with the detailed message.
 * Returns the parsed error message string.
 */
export function getApiErrorDetails(error: any): { message: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};

  if (error?.response?.status === 422 && error?.response?.data?.errors) {
    Object.assign(fieldErrors, error.response.data.errors);
  }

  return {
    message: parseApiError(error),
    fieldErrors,
  };
}
