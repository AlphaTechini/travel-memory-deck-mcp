import type { FastifyInstance, FastifyRequest } from "fastify";
import Fastify from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { MarketplaceIdentityNotConfiguredError, requireMarketplaceIdentity } from "./auth/marketplace-identity.js";
import type { AppConfig } from "./config.js";
import { createMcpServer } from "./mcp/tools.js";
import type { AppServices } from "./services.js";

function assertAllowedOrigin(request: FastifyRequest, config: AppConfig): void {
	const origin = request.headers.origin;
	if (origin && !config.allowedOrigins.has(origin)) {
		throw new Error("Origin is not allowed.");
	}
}

export function createApp(config: AppConfig, services: AppServices): FastifyInstance {
	const app = Fastify({
		logger: true,
		bodyLimit: 1_000_000
	});

	app.get("/health", async () => ({ status: "ok" }));

	app.route({
		method: ["GET", "POST", "DELETE"],
		url: "/mcp",
		handler: async (request, reply) => {
			assertAllowedOrigin(request, config);
			const identity = await requireMarketplaceIdentity(request);
			const server = createMcpServer({ services, identity });
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

		if (error instanceof Error && error.message === "Origin is not allowed.") {
			return reply.code(403).send({ error: error.message });
		}

		app.log.error(error);
		return reply.code(500).send({ error: "Unexpected server error." });
	});

	return app;
}
