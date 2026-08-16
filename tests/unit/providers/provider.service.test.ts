import { ProviderService } from "../../../src/modules/providers/provider.service";
import { AlphaAdapter } from "../../../src/modules/providers/alpha/alpha.adapter";
import { BetaAdapter } from "../../../src/modules/providers/beta/beta.adapter";
import { GammaAdapter } from "../../../src/modules/providers/gamma/gamma.adapter";

import {
  ProviderName,
  ProviderRequest,
  ProviderResultStatus,
} from "../../../src/modules/providers/provider.types";

import { RequestStatus } from "../../../src/common/constants/request-status";

const createProviderResultServiceMock = () => ({
  saveResult: jest
    .fn()
    .mockImplementation(async (_requestId, result) => result),
});

const createRequestServiceMock = () => ({
  updateStatus: jest.fn().mockResolvedValue(undefined),
});

const createOfferServiceMock = () => ({
  saveNormalizedOffer: jest
    .fn()
    .mockImplementation(async (_requestId, offer) => offer),
});

describe("ProviderService", () => {
  const providerRequest: ProviderRequest = {
    requestId: "REQ_TEST",

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
  };

  it("should preserve successful offers when another provider times out", async () => {
    const alpha = new AlphaAdapter({
      delayMs: 1,
    });

    const beta = new BetaAdapter({
      delayMs: 100,
    });

    const gamma = new GammaAdapter({
      delayMs: 1,
    });

    const providerResultService = createProviderResultServiceMock();

    const requestService = createRequestServiceMock();

    const offerService = createOfferServiceMock();

    const service = new ProviderService(
      [alpha, beta, gamma],

      providerResultService as any,

      requestService as any,

      offerService as any,

      {
        timeoutMs: 20,
        retries: 1,
        retryDelayMs: 1,
      },
    );

    const results = await service.processRequest(
      "internal-request-id",
      providerRequest,
    );

    expect(results).toHaveLength(3);

    const alphaResult = results.find(
      (result) => result.provider === ProviderName.ALPHA,
    );

    const betaResult = results.find(
      (result) => result.provider === ProviderName.BETA,
    );

    const gammaResult = results.find(
      (result) => result.provider === ProviderName.GAMMA,
    );

    expect(alphaResult?.status).toBe(ProviderResultStatus.SUCCESS);

    expect(betaResult?.status).toBe(ProviderResultStatus.TIMEOUT);

    expect(gammaResult?.status).toBe(ProviderResultStatus.SUCCESS);

    expect(providerResultService.saveResult).toHaveBeenCalledTimes(3);

    // Alpha and Gamma succeeded, Beta timed out.
    expect(offerService.saveNormalizedOffer).toHaveBeenCalledTimes(2);

    expect(requestService.updateStatus).toHaveBeenCalledWith(
      "internal-request-id",
      RequestStatus.PROCESSING,
    );

    expect(requestService.updateStatus).toHaveBeenCalledWith(
      "internal-request-id",
      RequestStatus.PARTIAL_RESULTS,
    );
  });

  it("should mark the request FAILED when every provider fails", async () => {
    const alpha = new AlphaAdapter({
      forceInvalidResponse: true,
      delayMs: 1,
    });

    const beta = new BetaAdapter({
      delayMs: 100,
    });

    const gamma = new GammaAdapter({
      forceTemporaryError: true,
    });

    const providerResultService = createProviderResultServiceMock();

    const requestService = createRequestServiceMock();

    const offerService = createOfferServiceMock();

    const service = new ProviderService(
      [alpha, beta, gamma],

      providerResultService as any,

      requestService as any,

      offerService as any,

      {
        timeoutMs: 20,
        retries: 1,
        retryDelayMs: 1,
      },
    );

    const results = await service.processRequest("request-id", providerRequest);

    expect(
      results.some((result) => result.status === ProviderResultStatus.SUCCESS),
    ).toBe(false);

    // No provider succeeded, therefore no Offer should be persisted.
    expect(offerService.saveNormalizedOffer).not.toHaveBeenCalled();

    expect(providerResultService.saveResult).toHaveBeenCalledTimes(3);

    expect(requestService.updateStatus).toHaveBeenLastCalledWith(
      "request-id",
      RequestStatus.FAILED,
    );
  });

  it("should move the request to READY_FOR_REVIEW when all providers succeed", async () => {
    const providerResultService = createProviderResultServiceMock();

    const requestService = createRequestServiceMock();

    const offerService = createOfferServiceMock();

    const service = new ProviderService(
      [
        new AlphaAdapter({
          delayMs: 1,
        }),

        new BetaAdapter({
          delayMs: 1,
        }),

        new GammaAdapter({
          delayMs: 1,
        }),
      ],

      providerResultService as any,

      requestService as any,

      offerService as any,

      {
        timeoutMs: 100,
        retries: 1,
        retryDelayMs: 1,
      },
    );

    const results = await service.processRequest("request-id", providerRequest);

    expect(
      results.every((result) => result.status === ProviderResultStatus.SUCCESS),
    ).toBe(true);

    expect(providerResultService.saveResult).toHaveBeenCalledTimes(3);

    // All three successful normalized offers must be persisted.
    expect(offerService.saveNormalizedOffer).toHaveBeenCalledTimes(3);

    expect(requestService.updateStatus).toHaveBeenLastCalledWith(
      "request-id",
      RequestStatus.READY_FOR_REVIEW,
    );
  });
});
