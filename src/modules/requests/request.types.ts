export interface CustomerProfile {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface AssetData {
  type: string;
  identifier?: string;
  attributes: Record<string, unknown>;
}

export interface CreateServiceRequestInput {
  category: string;
  customerProfile: CustomerProfile;
  asset: AssetData;
  notes?: string;
  consent: boolean;
  idempotencyKey: string;
}
