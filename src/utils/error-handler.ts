interface UserError {
  field: string;
  message: string;
}

export function handleGraphQLErrors(userErrors: UserError[], operation: string): void {
  if (userErrors.length > 0) {
    const errorMessages = userErrors
      .map((e) => e.field ? `${e.field}: ${e.message}` : e.message)
      .join(", ");
    throw new Error(`Failed to ${operation}: ${errorMessages}`);
  }
}

export function handleExecutionError(error: unknown, operation: string): never {
  console.error(`Error ${operation}:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
}