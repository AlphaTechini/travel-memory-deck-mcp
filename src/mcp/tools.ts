import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { AppServices } from "../services.js";
import type { DeckRequest, MarketplaceIdentity } from "../types.js";

const ImageUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", {
	message: "Image URLs must use HTTPS."
});

const MemorySchema = z
	.object({
		title: z.string().trim().min(1).max(120),
		subtext: z.string().trim().min(1).max(1_500),
		imageUrls: z.array(ImageUrlSchema).min(1).max(4)
	})
	.strict();

const CreateDeckInputSchema = z
	.object({
		cover: z
			.object({
				title: z.string().trim().min(1).max(160),
				subtext: z.string().trim().min(1).max(1_000)
			})
			.strict(),
		memories: z.array(MemorySchema).min(1).max(20)
	})
	.strict();

const CreateDeckOutputSchema = z.object({
	jobId: z.string().uuid(),
	status: z.literal("queued")
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
				"Create travel memory books from a cover and up to twenty memories. Each memory accepts one to four HTTPS image URLs."
		}
	);

	server.registerTool(
		"create_travel_memory_deck",
		{
			title: "Create travel memory deck",
			description:
				"Queue a PowerPoint travel memory book with a typography-only cover and one to twenty image-based memories.",
			inputSchema: CreateDeckInputSchema,
			outputSchema: CreateDeckOutputSchema,
			annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
		},
		async (request) => {
			const job = await context.services.jobs.create(context.identity.id, request as DeckRequest);
			await context.services.tasks.enqueueGeneration(job.id);

			return {
				content: [{ type: "text", text: createStatusText(job.status, job.id) }],
				structuredContent: { jobId: job.id, status: "queued" }
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
