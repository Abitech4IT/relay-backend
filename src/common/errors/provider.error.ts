export class ProviderTimeoutError extends Error {
  constructor(public readonly provider: string) {
    super(`${provider} timed out`);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderTemporaryError extends Error {
  constructor(
    public readonly provider: string,
    message = `${provider} returned a temporary error`,
  ) {
    super(message);
    this.name = "ProviderTemporaryError";
  }
}

export class ProviderInvalidResponseError extends Error {
  constructor(
    public readonly provider: string,
    message = `${provider} returned an invalid response`,
  ) {
    super(message);
    this.name = "ProviderInvalidResponseError";
  }
}
