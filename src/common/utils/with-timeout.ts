import { ProviderTimeoutError } from "../errors/provider.error";

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  providerName: string,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new ProviderTimeoutError(providerName));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
