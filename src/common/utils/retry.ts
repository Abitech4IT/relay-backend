export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    retries: number;
    delayMs: number;
    shouldRetry: (error: unknown) => boolean;
  },
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= options.retries || !options.shouldRetry(error)) {
        throw error;
      }

      attempt += 1;

      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }
}
