export interface AlphaRequest {
  reference: string;

  customer: {
    first_name: string;
    last_name: string;
  };

  item: {
    category: string;
    type: string;
    identifier?: string;
  };
}

export interface AlphaResponse {
  result: {
    offer_id: string;

    pricing: {
      base: number;
      fee: number;
      total: number;
    };

    benefits: string[];

    terms: string[];

    customer_contribution: number;

    valid_until: string;

    fulfillment_minutes: number;
  };
}
