import type { FastifyInstance, FastifyRequest } from "fastify";
import Fastify from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { MarketplaceIdentityNotConfiguredError, requireMarketplaceIdentity } from "./auth/marketplace-identity.js";
import type { ApiConfig } from "./config.js";
import { parseDeckRequest } from "./mcp/deck-request.js";
import { createMcpServer } from "./mcp/tools.js";
import {
	PaymentChallengeError,
	PaymentReuseError,
	PaymentSettlementError
} from "./payments/service.js";
import type { AppServices } from "./services.js";
import type { DeckRequest } from "./types.js";

export function createApp(config: ApiConfig, services: AppServices): FastifyInstance {
	const app = Fastify({
		logger: true,
		bodyLimit: 1_000_000
	});

	app.get("/health", async () => ({ status: "ok" }));
	app.addHook("onReady", async () => services.payments.initialize());

	app.route({
		method: ["GET", "POST", "DELETE"],
		url: "/mcp",
		handler: async (request, reply) => {
			const identity = await requireMarketplaceIdentity(request);
			let paymentId: string | undefined;
			let settlementHeaders: Record<string, string> = {};
			const deckRequest = getValidCreateDeckRequest(request.body);
			if (deckRequest) {
				try {
					const payment = await services.payments.authorize(request, identity, deckRequest);
					paymentId = payment.id;
					settlementHeaders = payment.settlementHeaders;
				} catch (error) {
					if (error instanceof PaymentChallengeError || error instanceof PaymentSettlementError) {
						for (const [name, value] of Object.entries(error.response.headers)) {
							reply.header(name, value);
						}
						return reply.code(error.response.status).send(error.response.body);
					}
					throw error;
				}
			}

			for (const [name, value] of Object.entries(settlementHeaders)) {
				reply.header(name, value);
			}
			const server = createMcpServer({ services, identity, paymentId });
			const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

			await server.connect(transport);
			reply.hijack();

			try {
				await transport.handleRequest(request.raw, reply.raw, request.body);
			} finally {
				await server.close();
			}
		}
	});

	app.setErrorHandler(async (error, _request, reply) => {
		if (error instanceof MarketplaceIdentityNotConfiguredError) {
			return reply.code(503).send({ error: "Marketplace identity verification is not configured." });
		}
		if (error instanceof PaymentReuseError) {
			return reply.code(409).send({ error: error.message });
		}

		app.log.error(error);
		return reply.code(500).send({ error: "Unexpected server error." });
	});

	return app;
}

function getValidCreateDeckRequest(body: unknown): DeckRequest | null {
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return null;
	}

	const message = body as { method?: unknown; params?: unknown };
	if (message.method !== "tools/call" || typeof message.params !== "object" || message.params === null) {
		return null;
	}

	const params = message.params as { name?: unknown; arguments?: unknown };
	return params.name === "create_travel_memory_deck" ? parseDeckRequest(params.arguments) : null;
}
