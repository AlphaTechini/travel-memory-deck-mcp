# Travel Memory Deck MCP

This service creates travel memory book PowerPoint files for agent clients through a remote MCP endpoint. It accepts a typography-only cover and up to twenty memories, then returns a temporary download URL after asynchronous generation.

The full project map is available in [structure.md](file:///C:/Hackathons/Slide%20Maker/structure.md).

## Architecture

- Fastify exposes the public MCP API and a separately deployed Cloud Run worker processes jobs.
- MongoDB tracks job ownership and state.
- Cloud Tasks delivers protected generation and deletion work to the private worker.
- Google Cloud Storage stores generated PPTX files for 24 hours.
- PptxGenJS renders slides and Sharp creates rounded rectangular image assets.

To find MCP request handling visit [src/app.ts](file:///C:/Hackathons/Slide%20Maker/src/app.ts).
To find asynchronous job orchestration visit [src/jobs/generate.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/generate.ts).
To find PowerPoint rendering visit [src/presentation/render.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/render.ts).
The MongoDB connection can be found in [src/services.ts](file:///C:/Hackathons/Slide%20Maker/src/services.ts).
The Google Cloud Storage connection can be found in [src/storage/decks.ts](file:///C:/Hackathons/Slide%20Maker/src/storage/decks.ts).

## Deployment

Deploy the API and worker as separate Cloud Run services from the same image. The API uses the default `node dist/server.js` command. The worker uses `node dist/worker.js` and must not grant public invocation.

Set all values from [.env.example](file:///C:/Hackathons/Slide%20Maker/.env.example) through Cloud Run secrets or environment configuration. Do not place production credentials in a file or source control.

The service account needs minimum permissions for the selected GCS bucket and Cloud Tasks queue. The worker service account needs GCS object create, read, and delete permissions. The API service account needs Cloud Tasks enqueue permission. Cloud Tasks must invoke the worker using its configured OIDC service account.

The marketplace authentication contract is still required before the public MCP endpoint can serve requests. The current implementation rejects unverified identities rather than accepting a caller-controlled header.
