import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";

import { requestService } from "../requests/request.module";

import { AlphaAdapter } from "./alpha/alpha.adapter";

import { BetaAdapter } from "./beta/beta.adapter";

import { GammaAdapter } from "./gamma/gamma.adapter";

import { ProviderResult } from "./provider-result.entity";

import { ProviderResultService } from "./provider-result.service";

import { ProviderService } from "./provider.service";
import { offerService } from "../offers/offer.module";

const providerResultRepository = AppDataSource.getRepository(ProviderResult);

export const providerResultService = new ProviderResultService(
  providerResultRepository,
);

const adapters = [new AlphaAdapter(), new BetaAdapter(), new GammaAdapter()];

export const providerService = new ProviderService(
  adapters,
  providerResultService,
  requestService,
  offerService,
  {
    timeoutMs: env.PROVIDER_TIMEOUT_MS,

    retries: 1,

    retryDelayMs: 200,
  },
);
