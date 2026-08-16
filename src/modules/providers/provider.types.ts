export enum ProviderName {
  ALPHA = "ALPHA",
  BETA = "BETA",
  GAMMA = "GAMMA",
}

export enum ProviderResultStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  TEMPORARY_ERROR = "TEMPORARY_ERROR",
}

export interface ProviderSimulationOptions {
  forceInvalidResponse?: boolean;
  forceTimeout?: boolean;
  forceTemporaryError?: boolean;

  delayMs?: number;
}

export interface ProviderRequest {
  requestId: string;
  category: string;

  customerProfile: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };

  asset: {
    type: string;
    identifier?: string;
    attributes: Record<string, unknown>;
  };

  notes?: string | null;
}

export interface NormalizedProviderOffer {
  provider: ProviderName;

  externalOfferId: string;

  baseAmount: number;
  fees: number;
  totalAmount: number;

  benefits: string[];

  terms: string[];

  customerContribution: number;

  validUntil: Date;

  estimatedFulfillmentMinutes: number;
}

export interface ProviderExecutionResult {
  provider: ProviderName;

  status: ProviderResultStatus;

  offer?: NormalizedProviderOffer;

  errorCode?: string;

  errorMessage?: string;

  durationMs: number;
}
