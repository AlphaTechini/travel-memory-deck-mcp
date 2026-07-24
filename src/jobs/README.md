# Deck Jobs

This folder implements durable generation and deletion jobs.

To find MongoDB job persistence visit [repository.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/repository.ts).
To find Cloud Tasks dispatch visit [queue.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/queue.ts).
To find PPTX generation orchestration visit [generate.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/generate.ts).
To find exact-expiry deletion visit [delete.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/delete.ts).

The MongoDB job connection can be found in [repository.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/repository.ts). The Cloud Tasks connection can be found in [queue.ts](file:///C:/Hackathons/Slide%20Maker/src/jobs/queue.ts).

Cloud Tasks is used instead of an in-process background task so work survives Cloud Run instance restarts and scaling.
