import type { FastifyRequest } from "fastify";

import type { MarketplaceIdentity } from "../types.js";

export class MarketplaceIdentityNotConfiguredError extends Error {
	constructor() {
		super("Marketplace identity verification is not configured.");
	}
}

export async function requireMarketplaceIdentity(_request: FastifyRequest): Promise<MarketplaceIdentity> {
	// The marketplace authentication contract must supply a verified agent identity.
	// Never substitute an unverified request header as the caller identity.
	throw new MarketplaceIdentityNotConfiguredError();
}
