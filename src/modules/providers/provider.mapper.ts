import { ServiceRequest } from "../requests/request.entity";

import { ProviderRequest } from "./provider.types";

export function toProviderRequest(
  serviceRequest: ServiceRequest,
): ProviderRequest {
  return {
    requestId: serviceRequest.publicId,

    category: serviceRequest.category,

    customerProfile: serviceRequest.customerProfile,

    asset: serviceRequest.asset,

    notes: serviceRequest.notes,
  };
}
