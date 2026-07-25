import { createHash } from "node:crypto";

import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import {
	type HTTPAdapter,
	type HTTPResponseInstructions,
	x402HTTPResourceServer,
	x402ResourceServer
} from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import type { FastifyRequest } from "fastify";

import type { AppConfig } from "../config.js";
import { parseDeckRequest } from "../mcp/deck-request.js";
import type { DeckRequest, MarketplaceIdentity, PaymentRecord } from "../types.js";
import { PaymentLedger } from "./ledger.js";

const PAYMENT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const PRICE_PER_SLIDE_USD = 1.5;

export type PaymentAuthorization = {
	id: string;
	settlementHeaders: Record<string, string>;
};

export class PaymentChallengeError extends Error {
	constructor(readonly response: HTTPResponseInstructions) {
		super("Payment required.");
	}
}

export class PaymentSettlementError extends Error {
	constructor(readonly response: HTTPResponseInstructions) {
		super("Payment settlement did not complete.");
	}
}

export class PaymentReuseError extends Error {
	constructor() {
		super("This payment authorization is already bound to a different request or identity.");
	}
}

class FastifyPaymentAdapter implements HTTPAdapter {
	constructor(
		private readonly request: FastifyRequest,
		private readonly publicBaseUrl: string
	) {}

	getHeader(name: string): string | undefined {
		const value = this.request.headers[name.toLowerCase()];
		return typeof value === "string" ? value : undefined;
	}

	getMethod(): string {
		return this.request.method;
	}

	getPath(): string {
		return new URL(this.request.url, this.publicBaseUrl).pathname;
	}

	getUrl(): string {
		return new URL(this.request.url, this.publicBaseUrl).toString();
	}

	getAcceptHeader(): string {
		return this.getHeader("accept") ?? "";
	}

	getUserAgent(): string {
		return this.getHeader("user-agent") ?? "";
	}

	getBody(): unknown {
		return this.request.body;
	}
}

export function getDeckPricing(request: DeckRequest): { slideCount: number; priceUsd: string } {
	const slideCount = request.memories.length + 1;
	return { slideCount, priceUsd: (slideCount * PRICE_PER_SLIDE_USD).toFixed(2) };
}

export class X402PaymentService {
	private readonly httpServer: x402HTTPResourceServer;

	constructor(
		private readonly config: AppConfig,
		private readonly ledger: PaymentLedger
	) {
		const facilitator = new OKXFacilitatorClient({
			apiKey: config.OKX_API_KEY,
			secretKey: config.OKX_SECRET_KEY,
			passphrase: config.OKX_PASSPHRASE,
			syncSettle: true
		});
		const resourceServer = new x402ResourceServer(facilitator).register(
			config.X402_NETWORK,
			new ExactEvmScheme()
		);
		this.httpServer = new x402HTTPResourceServer(resourceServer, {
			"POST /mcp": {
				accepts: {
					scheme: "exact",
					network: config.X402_NETWORK,
					payTo: config.X402_PAY_TO_ADDRESS,
					price: (context) => {
						const deck = getValidDeckRequest(context.adapter.getBody?.());
						if (!deck) {
							throw new Error("A valid deck request is required before payment can be quoted.");
						}
						return `$${getDeckPricing(deck).priceUsd}`;
					}
				},
				resource: new URL("/mcp", config.MCP_PUBLIC_BASE_URL).toString(),
				description: "Travel memory PowerPoint deck generation",
				mimeType: "application/json"
			}
		});
	}

	async initialize(): Promise<void> {
		await this.httpServer.initialize();
	}

	async authorize(
		request: FastifyRequest,
		identity: MarketplaceIdentity,
		deck: DeckRequest
	): Promise<PaymentAuthorization> {
		const paymentHeader = getPaymentHeader(request);
		const requestFingerprint = hash(JSON.stringify(deck));
		const pricing = getDeckPricing(deck);
		const paymentId = paymentHeader ? hash(paymentHeader) : undefined;

		if (paymentId) {
			const existing = await this.ledger.find(paymentId);
			if (existing) {
				if (!matchesAuthorization(existing, identity.id, requestFingerprint, pricing.slideCount)) {
					throw new PaymentReuseError();
				}

				return { id: existing.id, settlementHeaders: {} };
			}
		}

		const adapter = new FastifyPaymentAdapter(request, this.config.MCP_PUBLIC_BASE_URL);
		const paymentResult = await this.httpServer.processHTTPRequest({
			adapter,
			path: adapter.getPath(),
			method: adapter.getMethod(),
			...(paymentHeader ? { paymentHeader } : {})
		});

		if (paymentResult.type === "payment-error") {
			throw new PaymentChallengeError(paymentResult.response);
		}
		if (paymentResult.type !== "payment-verified" || !paymentId) {
			throw new Error("The x402 payment boundary did not receive a verifiable payment authorization.");
		}

		const settlement = await this.httpServer.processSettlement(
			paymentResult.paymentPayload,
			paymentResult.paymentRequirements,
			paymentResult.declaredExtensions
		);
		if (!settlement.success) {
			throw new PaymentSettlementError(settlement.response);
		}
		if (settlement.status !== "success" || !settlement.transaction) {
			throw new PaymentSettlementError({
				status: 503,
				headers: settlement.headers,
				body: { error: "Payment settlement is not final. Retry this exact request after confirmation." }
			});
		}

		const payment = await this.ledger.record({
			id: paymentId,
			ownerId: identity.id,
			requestFingerprint,
			slideCount: pricing.slideCount,
			priceUsd: pricing.priceUsd,
			network: settlement.network,
			asset: paymentResult.paymentRequirements.asset,
			amount: settlement.amount ?? paymentResult.paymentRequirements.amount,
			transaction: settlement.transaction,
			...(settlement.payer ? { payer: settlement.payer } : {}),
			createdAt: new Date(),
			purgeAt: new Date(Date.now() + PAYMENT_RETENTION_MS)
		});

		if (!matchesAuthorization(payment, identity.id, requestFingerprint, pricing.slideCount)) {
			throw new PaymentReuseError();
		}

		return { id: payment.id, settlementHeaders: settlement.headers };
	}
}

function getValidDeckRequest(body: unknown): DeckRequest | null {
	if (!isRecord(body) || body.method !== "tools/call" || !isRecord(body.params)) {
		return null;
	}
	if (body.params.name !== "create_travel_memory_deck") {
		return null;
	}

	return parseDeckRequest(body.params.arguments);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPaymentHeader(request: FastifyRequest): string | undefined {
	const value = request.headers["payment-signature"];
	return typeof value === "string" ? value : undefined;
}

function hash(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function matchesAuthorization(
	payment: PaymentRecord,
	ownerId: string,
	requestFingerprint: string,
	slideCount: number
): boolean {
	return (
		payment.ownerId === ownerId &&
		payment.requestFingerprint === requestFingerprint &&
		payment.slideCount === slideCount
	);
}
