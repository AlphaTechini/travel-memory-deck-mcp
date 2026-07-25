# Service Modules

This directory contains the Fastify API, Cloud Run worker, and feature modules used by the travel memory deck service.

To find public MCP routing visit [app.ts](file:///C:/Hackathons/Slide%20Maker/src/app.ts).
To find Cloud Run API startup visit [server.ts](file:///C:/Hackathons/Slide%20Maker/src/server.ts).
To find private worker startup visit [worker.ts](file:///C:/Hackathons/Slide%20Maker/src/worker.ts).
To find environment validation visit [config.ts](file:///C:/Hackathons/Slide%20Maker/src/config.ts).
To find x402 payment handling visit [payments/README.md](file:///C:/Hackathons/Slide%20Maker/src/payments/README.md).
The MongoDB, Cloud Tasks, and Google Cloud Storage connections can be found in [services.ts](file:///C:/Hackathons/Slide%20Maker/src/services.ts).

Fastify owns transport concerns while feature folders own their corresponding integration or rendering logic. The payment module settles a deck charge before the MCP tool creates a job, avoiding worker execution for unpaid requests.
