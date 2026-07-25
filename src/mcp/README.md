# MCP Tools

This folder defines the public agent-facing MCP tool contracts. `create_travel_memory_deck` accepts one cover and one to nineteen memories, making a maximum twenty-slide deck. The cover is included in the paid slide count.

To find deck creation and status tools visit [tools.ts](file:///C:/Hackathons/Slide%20Maker/src/mcp/tools.ts).
To find the shared deck request schema visit [deck-request.ts](file:///C:/Hackathons/Slide%20Maker/src/mcp/deck-request.ts).

The MCP service connection can be found in [tools.ts](file:///C:/Hackathons/Slide%20Maker/src/mcp/tools.ts). The x402 payment boundary can be found in [../payments/service.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/service.ts). The tools return structured job data and expose a temporary deck download as an MCP resource link after completion.
