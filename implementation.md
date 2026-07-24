# Travel Memory Deck MCP Implementation

## Product

This project is an agent-to-MCP service that turns travel memories into a PowerPoint memory book. It is not a website. Agents submit a cover and a sequence of memories, then receive a temporary URL to the generated `.pptx` file.

## Confirmed Architecture

- Runtime: Fastify on Cloud Run.
- Transport: authenticated MCP Streamable HTTP endpoint at `/mcp`.
- Identity: calls are accepted only through the agent marketplace identity integration. ERC-402 payment support is deferred.
- Jobs: MongoDB persists job status and ownership. Cloud Tasks invokes the protected generation worker.
- Storage: a private Google Cloud Storage bucket holds generated decks.
- Delivery: a V4 signed GCS download URL is valid for 24 hours.
- Deletion: a scheduled Cloud Task deletes the PPTX and sensitive job data exactly at expiry. GCS lifecycle rules and MongoDB TTL indexes provide cleanup fallbacks.
- Source images: remote image bytes are fetched into memory only and are never stored.

## MCP Tools

### `create_travel_memory_deck`

Validates the deck request, creates a job, enqueues the generation task, and returns a job ID.

### `get_travel_memory_deck`

Returns the caller-owned job state: `queued`, `processing`, `completed`, `failed`, or `expired`. Completed jobs include the signed PPTX URL and its expiration time.

## Request Contract

- One typography-only cover with a required title and subtext.
- One to twenty memories per deck.
- Every memory has a required title, subtext, and one to four HTTPS image URLs.
- Captions are not accepted because `Detail.md` does not define them.
- Accepted image formats: JPEG, PNG, and WebP.
- Maximum downloaded size: 10 MiB per image.

## Presentation Rules

- Use PptxGenJS `LAYOUT_WIDE` (13.33 by 7.5 inches).
- Cover: text-only title and subtext.
- Every memory slide keeps text on the left and images on the right.
- Text zone: roughly 35-40% of slide width.
- Image zone: roughly 60-65% of slide width.
- User image ordering is preserved.
- One image: `SINGLE_HERO_RIGHT`.
- Two images: `DOUBLE_COLLAGE_RIGHT`, with the first image dominant.
- Three images: `TRIPLE_HERO_COLLAGE_RIGHT`, with image one central and largest, image two left, and image three right.
- Four images: `FOUR_GRID_RIGHT`, an equal two-by-two grid.
- Sharp applies rounded-rectangle masks before PptxGenJS embeds images. PptxGenJS image rounding creates circles and cannot satisfy this requirement directly.

## Security Rules

- Validate HTTPS image URLs before fetching.
- Reject loopback, private, link-local, and other non-public destination addresses.
- Revalidate every redirect destination.
- Enforce response type, response size, fetch timeout, and bounded fetch concurrency.
- Keep GCS objects private; never return permanent public URLs.
- Bind every job and status lookup to the marketplace-authenticated caller identity.
- Use Cloud Tasks OIDC tokens to protect internal worker and deletion endpoints.

## Delivery Flow

1. An authenticated agent calls `create_travel_memory_deck`.
2. The API validates the request, stores a queued MongoDB job, and creates a Cloud Task.
3. The worker claims the job, retrieves and processes images in memory, generates the PPTX, and uploads it to GCS.
4. The worker stores the signed download URL and expiration in MongoDB, then schedules deletion for 24 hours later.
5. The calling agent uses `get_travel_memory_deck` until the job is completed and retrieves the temporary URL.
6. The deletion task removes the GCS object and sensitive request/result fields from MongoDB.

## Implementation Order

1. Create the TypeScript/Fastify project structure, configuration validation, and MCP HTTP server.
2. Add MongoDB job persistence, Cloud Tasks dispatch, and GCS signed delivery.
3. Implement strict request, caller identity, and remote image validation.
4. Implement the Sharp image preprocessing and PptxGenJS cover and memory templates.
5. Add Cloud Run deployment artifacts and project documentation.
6. Build the service and manually verify each template and the asynchronous job lifecycle.
