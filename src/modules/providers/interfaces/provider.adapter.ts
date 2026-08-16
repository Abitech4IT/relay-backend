import {
  NormalizedProviderOffer,
  ProviderName,
  ProviderRequest,
} from "../provider.types";

export interface ProviderAdapter {
  readonly name: ProviderName;

  getOffer(request: ProviderRequest): Promise<NormalizedProviderOffer>;
}
