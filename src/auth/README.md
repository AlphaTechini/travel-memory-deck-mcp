# Marketplace Identity

This folder defines the boundary where the marketplace's verified agent identity must be attached to an MCP request.

To find marketplace identity enforcement visit [marketplace-identity.ts](file:///C:/Hackathons/Slide%20Maker/src/auth/marketplace-identity.ts).

The marketplace authentication connection can be found in [marketplace-identity.ts](file:///C:/Hackathons/Slide%20Maker/src/auth/marketplace-identity.ts). The current boundary fails closed because a caller-controlled agent ID would allow job ownership spoofing.
