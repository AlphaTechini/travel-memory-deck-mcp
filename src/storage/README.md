# Deck Storage

This folder stores completed decks privately and creates temporary download URLs.

To find GCS upload, signed URL, and deletion logic visit [decks.ts](file:///C:/Hackathons/Slide%20Maker/src/storage/decks.ts).

The Google Cloud Storage connection can be found in [decks.ts](file:///C:/Hackathons/Slide%20Maker/src/storage/decks.ts). Objects remain private and are deleted by the scheduled job after the 24-hour download period.
