export interface BetaRequest {
  request_ref: string;
  service_category: string;
  customer_name: string;
  asset_type: string;
}

export interface BetaResponse {
  quoteId: string;
  basePrice: number;
  serviceFee: number;
  finalPrice: number;
  benefitsText: string;
  termsText: string;
  contribution: number;
  expiresAt: string;
  etaMinutes: number;
}
