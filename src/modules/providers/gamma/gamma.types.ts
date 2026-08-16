export interface GammaRequest {
  ref: string;

  kind: string;

  customer: string;

  object: {
    asset_kind: string;
    ref?: string;
  };
}

export interface GammaResponse {
  id: number;

  amount: string;

  charges: string;

  grand_total: string;

  perks: string | string[];

  conditions: string | string[];

  customer_share: string;

  expires: number;

  eta: string;
}
