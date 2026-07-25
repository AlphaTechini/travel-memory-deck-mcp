# x402 Payments

This folder verifies and synchronously settles exact USD₮0 payments before a paid deck job can be created. The integration uses the official OKX x402 facilitator SDK with the X Layer stablecoin mapping supplied by that SDK.

To find payment challenge, verification, settlement, and idempotency logic visit [service.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/service.ts).
To find the one-year minimal payment ledger visit [ledger.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/ledger.ts).

The OKX facilitator connection can be found in [service.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/service.ts). The MongoDB payment ledger connection can be found in [ledger.ts](file:///C:/Hackathons/Slide%20Maker/src/payments/ledger.ts).

The ledger stores a hash of the payment authorization, the caller binding, price, and final settlement metadata. It intentionally does not retain the signed payment payload.
