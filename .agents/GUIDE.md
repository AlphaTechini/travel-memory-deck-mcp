# Confirmed Decisions

- The product is an agent-to-MCP travel memory deck generator, not a website.
- The MCP API runs in Fastify on Cloud Run.
- The API and worker are separate Cloud Run services. The worker remains private and Cloud Tasks invokes it with OIDC.
- MongoDB stores job status and caller ownership.
- Google Cloud Storage stores private generated decks.
- Deck URLs expire after 24 hours. A Cloud Task deletes the GCS object and sensitive job data at expiry.
- Each request includes a typography-only cover and 1-20 memories. Each memory includes a title, subtext, and 1-4 HTTPS image URLs.
- Captions are excluded because the source requirements do not define them.
- Source image bytes are processed in memory only. JPEG, PNG, and WebP are accepted up to 10 MiB each.
- The renderer preserves image order and uses fixed layouts by image count.
- Sharp creates rounded rectangular images because PptxGenJS only provides circular image rounding.
- Marketplace identity verification must be implemented from its actual token contract. The MCP endpoint fails closed until that contract is available.
