import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CreateDeckInputSchema } from "./deck-request.js";
import { getDeckPricing } from "../payments/service.js";
import type { AppServices } from "../services.js";
import type { DeckRequest, MarketplaceIdentity } from "../types.js";

const CreateDeckOutputSchema = z.object({
	jobId: z.string().uuid(),
	status: z.literal("queued"),
	slideCount: z.number().int().min(2).max(20),
	priceUsd: z.string()
});

const GetDeckInputSchema = z
	.object({
		jobId: z.string().uuid()
	})
	.strict();

const GetDeckOutputSchema = z.object({
	jobId: z.string().uuid(),
	status: z.enum(["queued", "processing", "completed", "failed", "expired"]),
	expiresAt: z.string().datetime().optional(),
	downloadUrl: z.url().optional(),
	error: z.string().optional()
});

type ToolContext = {
	services: AppServices;
	identity: MarketplaceIdentity;
	paymentId?: string;
};

function createStatusText(status: string, jobId: string): string {
	return `Deck job ${jobId} is ${status}.`;
}

export function createMcpServer(context: ToolContext): McpServer {
	const server = new McpServer(
		{
			name: "travel-memory-deck",
			version: "0.1.0"
		},
		{
			instructions:
				"Create paid travel memory books from a cover and up to nineteen memories. The cover is billable, for a maximum of twenty slides. Each memory accepts one to four HTTPS image URLs."
		}
	);

	server.registerTool(
		"create_travel_memory_deck",
		{
			title: "Create travel memory deck",
			description:
				"Queue a PowerPoint travel memory book with a typography-only cover and one to nineteen image-based memories. USD₮0 is charged per output slide, including the cover.",
			inputSchema: CreateDeckInputSchema,
			outputSchema: CreateDeckOutputSchema,
			annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
		},
		async (request) => {
			if (!context.paymentId) {
				return {
					content: [{ type: "text", text: "A settled payment is required before a deck can be queued." }],
					isError: true
				};
			}

			const deckRequest = request as DeckRequest;
			const pricing = getDeckPricing(deckRequest);
			const job = await context.services.jobs.createPaid(context.identity.id, deckRequest, context.paymentId);
			await context.services.tasks.enqueueGeneration(job.id);

			return {
				content: [{ type: "text", text: createStatusText(job.status, job.id) }],
				structuredContent: { jobId: job.id, status: "queued", ...pricing }
			};
		}
	);

	server.registerTool(
		"get_travel_memory_deck",
		{
			title: "Get travel memory deck",
			description: "Get the status of a deck job and its temporary PowerPoint download URL when available.",
			inputSchema: GetDeckInputSchema,
			outputSchema: GetDeckOutputSchema,
			annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
		},
		async ({ jobId }) => {
			const job = await context.services.jobs.findOwned(jobId, context.identity.id);
			if (!job) {
				return {
					content: [{ type: "text", text: "No deck job exists for this identity." }],
					structuredContent: { jobId, status: "expired", error: "Deck job not found." },
					isError: true
				};
			}

			const result = {
				jobId: job.id,
				status: job.status,
				...(job.expiresAt ? { expiresAt: job.expiresAt.toISOString() } : {}),
				...(job.downloadUrl ? { downloadUrl: job.downloadUrl } : {}),
				...(job.failureMessage ? { error: job.failureMessage } : {})
			};

			return {
				content: [
					{ type: "text", text: createStatusText(job.status, job.id) },
					...(job.downloadUrl
						? [
								{
									type: "resource_link" as const,
									uri: job.downloadUrl,
									name: "travel-memory-book.pptx",
									description: "Temporary download for the generated travel memory book.",
									mimeType:
										"application/vnd.openxmlformats-officedocument.presentationml.presentation"
								}
							]
						: [])
				],
				structuredContent: result,
				isError: job.status === "failed"
			};
		}
	);

	return server;
}
