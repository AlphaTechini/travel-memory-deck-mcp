# Travel Memory Deck MCP

This service creates paid travel memory book PowerPoint files for agent clients through a remote MCP endpoint. It accepts a typography-only cover and up to nineteen memories, then returns a temporary download URL after asynchronous generation. The cover is included in the twenty-slide maximum and is billable.

The full project map is available in [structure.md](file:///C:/Hackathons/Slide%20Maker/structure.md).

## Architecture

- Fastify exposes the public MCP API and a separately deployed Cloud Run worker processes jobs.
- MongoDB tracks job ownership and state.
- Cloud Tasks delivers protected generation and deletion work to the private worker.
- Google Cloud Storage stores generated PPTX files for 24 hours.
- PptxGenJS renders slides and Sharp creates rounded rectangular image assets.
- x402 uses the OKX facilitator to verify and synchronously settle exact USD₮0 payments on X Layer before paid jobs are created.

To find MCP request handling visit [src/app.ts](file:///C:/Hackathons/Slide%20Maker/src/app.ts).
To find asynchronous job orchestration visit [src/jobs/generate.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/generate.ts).
To find PowerPoint rendering visit [src/presentation/render.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/render.ts).
To find x402 payment handling visit [src/payments/service.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/service.ts).
The MongoDB connection can be found in [src/services.ts](file:///C:/Hackathons/Slide%20Maker/src/services.ts).
The Google Cloud Storage connection can be found in [src/storage/decks.ts](file:///C:/Hackathons/Slide%20Maker/src/storage/decks.ts).

## Deployment

Deploy the API and worker as separate Cloud Run services from the same image. The API uses the default `node dist/server.js` command. The worker uses `node dist/worker.js` and must not grant public invocation.

Set shared infrastructure values from [.env.example](file:///C:/Hackathons/Slide%20Maker/.env.example) on both Cloud Run services. Set `MCP_PUBLIC_BASE_URL`, `X402_NETWORK`, `X402_PAY_TO_ADDRESS`, and the OKX credentials only on the API service. The worker requires MongoDB, GCS, Cloud Tasks, and worker URL settings but does not require payment configuration. Store production credentials in Cloud Run secrets and do not place them in a file or source control.

The service account needs minimum permissions for the selected GCS bucket and Cloud Tasks queue. The worker service account needs GCS object create, read, and delete permissions. The API service account needs Cloud Tasks enqueue permission. Cloud Tasks must invoke the worker using its configured OIDC service account.

`create_travel_memory_deck` charges 1.5 USD₮0 for every output slide, including the cover. Configure `X402_NETWORK=eip155:1952` for X Layer testnet and `X402_NETWORK=eip155:196` for production. The service records the hashed payment authorization and final settlement metadata for one year to make valid retries idempotent.

The marketplace authentication contract is still required before the public MCP endpoint can serve requests. The current implementation rejects unverified identities rather than accepting a caller-controlled header.
