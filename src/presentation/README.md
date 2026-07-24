# Presentation Renderer

This folder converts an approved deck request into a PowerPoint file.

To find renderer orchestration visit [render.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/render.ts).
To find the typography-only cover visit [cover.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/cover.ts).
To find fixed image-count layouts visit [layouts.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/layouts.ts).
To find shared text and image styling visit [theme.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/theme.ts).
To find the PptxGenJS compatibility adapter visit [pptx.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/pptx.ts).

The PptxGenJS connection can be found in [pptx.ts](file:///C:/Hackathons/Slide%20Maker/src/presentation/pptx.ts). Fixed layouts are intentional: image count and upload order determine composition, preventing random slide output.
