# Image Pipeline

This folder retrieves public source images without retaining them and prepares rounded rectangular assets for slides.

To find public URL validation and download limits visit [fetch.ts](file:///C:/Hackathons/Slide%20Maker/src/images/fetch.ts).
To find rounded image preprocessing visit [rounded-image.ts](file:///C:/Hackathons/Slide%20Maker/src/images/rounded-image.ts).
To find bounded concurrent processing visit [concurrency.ts](file:///C:/Hackathons/Slide%20Maker/src/images/concurrency.ts).

The remote image connection can be found in [fetch.ts](file:///C:/Hackathons/Slide%20Maker/src/images/fetch.ts). It pins DNS resolution for each request, revalidates redirects, and rejects non-public destinations to prevent SSRF.
