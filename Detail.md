Yes, this is becoming much more concrete. I would actually change the layout system based on what you described because your reasoning is better for a **memory album** than a presentation deck.

The previous “image left, text right” was too rigid. For a travel memory artifact, the images are the emotional anchor, so when there are multiple images they deserve more space.

The final rule should be:

* **1 image:** image + text side-by-side.
* **2 images:** collage takes priority.
* **3 images:** central hero + supporting images.
* **4 images:** grid.
* Text placement stays consistent: **always left**.

This makes the deck easier for the rendering engine because the text block has one predictable location.

---

## Global slide structure

### Text zone

Always:

```
LEFT SIDE

Title
Subtitle
Narrative
Optional quote
```

Approx:

* 35-40% slide width

---

### Image zone

Always:

```
RIGHT SIDE

Generated layout based on image count
```

Approx:

* 60-65% slide width

This creates a consistent reading pattern.

---

# Layout 1: Single Image

Template:

`SINGLE_HERO_RIGHT`

Purpose:

When one photo represents the entire memory.

Structure:

```
+-------------------------------+
|             |                 |
|  TITLE      |                 |
|             |    IMAGE        |
|  TEXT       |                 |
|             |                 |
+-------------------------------+
```

Rules:

* Image occupies almost the entire right side.
* Rounded corners.
* No unnecessary decoration.
* Text explains the memory.

---

# Layout 2: Two Images

Template:

`DOUBLE_COLLAGE_RIGHT`

This is where the artistic style starts.

Instead of:

```
IMAGE
IMAGE
```

Use a collage.

Structure:

```
+-------------------------------+
| TEXT          |       ______  |
|               |      |      | |
|               |  ___ | IMG2 | |
|               | |IMG1|______| |
|               | |     |      |
+-------------------------------+
```

Rules:

* First image = dominant image.
* Second image = supporting image.
* Slight overlap.
* Slight diagonal offset.
* Same visual family.

The goal is:

"Memory scrapbook."

Not:

"Two files placed beside each other."

---

# Layout 3: Three Images

Template:

`TRIPLE_HERO_COLLAGE_RIGHT`

Important correction:

There is **no equal three-image layout.**

The order matters.

The input order determines hierarchy.

## Image order:

```
Image 1 = central hero
Image 2 = left supporting image
Image 3 = right supporting image
```

The agent must preserve this.

Layout:

```
             IMAGE 2


        IMAGE 1 (MAIN)


             IMAGE 3
```

More realistically:

```
+--------------------------------+
| TEXT        |                  |
|             |   IMG2           |
|             |       IMG1       |
|             |           IMG3   |
|             |                  |
+--------------------------------+
```

Rules:

* Image 1 is largest.
* Image 2 and Image 3 are smaller.
* Image 2 sits slightly behind/left.
* Image 3 sits slightly behind/right.
* Image 1 has visual priority.

This creates a “memory centerpiece.”

---

# Layout 4: Four Images

Template:

`FOUR_GRID_RIGHT`

Simple.

No creativity here.

Grid wins.

Structure:

```
+--------------------------------+
| TEXT       |  IMG1 | IMG2      |
|            |-------|---------- |
|            |  IMG3 | IMG4      |
+--------------------------------+
```

Rules:

* Equal image sizes.
* Two columns.
* Two rows.
* Same spacing.
* Same corner radius.

Four images are usually supporting memories, so hierarchy is unnecessary.

---

# Important: Image ordering logic

The agent should never reorder images randomly.

The user upload order matters.

For three images:

Input:

```json
[
 "sunset.jpg",
 "market.jpg",
 "temple.jpg"
]
```

Output:

```
Central:
sunset.jpg

Left:
market.jpg

Right:
temple.jpg
```

The agent can recommend a primary image during analysis, but the renderer follows the final assigned order.

---

# Template selection logic

Very simple:

```javascript
if(images.length === 1)
    template = "SINGLE_HERO_RIGHT"

if(images.length === 2)
    template = "DOUBLE_COLLAGE_RIGHT"

if(images.length === 3)
    template = "TRIPLE_HERO_COLLAGE_RIGHT"

if(images.length === 4)
    template = "FOUR_GRID_RIGHT"

if(images.length > 4)
    splitIntoMultipleSlides()
```

---

# Why this is better

Because now the artifact has a recognizable identity.

It is not:

"AI generated PowerPoint."

It becomes:

"AI curated memory book."

The renderer only needs a few layouts, but the output feels intentional.

Also, this is much more realistic for the hackathon timeline. Building five excellent templates beats building an “AI artist” that creates a random mess and then spends three days apologizing for its artistic choices.


we are using: https://github.com/gitbrent/PptxGenJS
