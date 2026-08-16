import { AppDataSource } from "../../../src/config/database";

import { User } from "../../../src/modules/users/user.entity";
import { ServiceRequest } from "../../../src/modules/requests/request.entity";
import { ProviderResult } from "../../../src/modules/providers/provider-result.entity";

import { providerResultService } from "../../../src/modules/providers/provider.module";

import {
  ProviderName,
  ProviderResultStatus,
} from "../../../src/modules/providers/provider.types";

import { UserRole } from "../../../src/common/constants/roles";
import { RequestStatus } from "../../../src/common/constants/request-status";

import { generateRequestFingerprint } from "../../../src/common/utils/request-fingerprint";

describe("Provider result persistence", () => {
  let userId: string;
  let requestId: string;

  const requestInput = {
    category: "vehicle-service",

    customerProfile: {
      firstName: "Jane",
      lastName: "Doe",
    },

    asset: {
      type: "vehicle",
      attributes: {},
    },

    notes: null,

    consent: true as const,
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    const requestRepository = AppDataSource.getRepository(ServiceRequest);

    const user = await userRepository.save(
      userRepository.create({
        email: `provider-result-${Date.now()}@example.com`,

        fullName: "Provider Result Test",

        passwordHash: "integration-test-hash",

        role: UserRole.USER,

        isActive: true,
      }),
    );

    userId = user.id;

    const idempotencyKey = `provider-result-${Date.now()}`;

    const requestFingerprint = generateRequestFingerprint(requestInput);

    const serviceRequest = await requestRepository.save(
      requestRepository.create({
        publicId: `REQ_PROVIDER_${Date.now()}`,

        userId: user.id,

        category: requestInput.category,

        customerProfile: requestInput.customerProfile,

        asset: requestInput.asset,

        notes: requestInput.notes,

        consent: requestInput.consent,

        status: RequestStatus.CREATED,

        idempotencyKey,

        requestFingerprint,

        processingStartedAt: null,
      }),
    );

    requestId = serviceRequest.id;
  });

  afterAll(async () => {
    if (!AppDataSource.isInitialized) {
      return;
    }

    if (userId) {
      await AppDataSource.getRepository(User).delete(userId);
    }

    await AppDataSource.destroy();
  });

  it("should not persist the same successful provider result twice", async () => {
    const externalOfferId = `GAMMA-${Date.now()}`;

    const result = {
      provider: ProviderName.GAMMA,

      status: ProviderResultStatus.SUCCESS,

      offer: {
        provider: ProviderName.GAMMA,

        externalOfferId,

        baseAmount: 1000,

        fees: 50,

        totalAmount: 1050,

        benefits: ["Priority fulfillment"],

        terms: ["Subject to review"],

        customerContribution: 100,

        validUntil: new Date(Date.now() + 60 * 60 * 1000),

        estimatedFulfillmentMinutes: 30,
      },

      durationMs: 100,
    };

    const first = await providerResultService.saveResult(requestId, result);

    const second = await providerResultService.saveResult(requestId, result);

    expect(second.id).toBe(first.id);

    const repository = AppDataSource.getRepository(ProviderResult);

    const count = await repository.count({
      where: {
        requestId,

        provider: ProviderName.GAMMA,
      },
    });

    expect(count).toBe(1);
  });
});
