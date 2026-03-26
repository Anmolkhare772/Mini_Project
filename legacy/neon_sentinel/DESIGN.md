# Design System Strategy: The Sentinel Aesthetic

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Panopticon"**
In high-stakes cybersecurity, the interface must feel like an extension of the operator’s intent—authoritative, surgically precise, and hyper-focused. We are moving away from the "boxy" dashboard of the past. Instead, this design system treats the UI as a high-fidelity tactical display. We break the "template" look through **atmospheric depth** (using light as a material) and **asymmetric information density**, where critical telemetry is elevated through neon luminescence while secondary data recedes into the deep void of the background.

## 2. Colors & Atmospheric Depth
The palette is rooted in a "Deep Dark" philosophy. We don't use gray; we use levels of midnight and obsidian to maintain high contrast with our tactical neon accents.

### Surface Hierarchy & Nesting
To create an elite feel, we abandon flat layouts. We use "Tonal Stacking" to define priority:
*   **Base Layer (`surface` / `#121318`):** The canvas. Used for the primary application background.
*   **Secondary Zones (`surface_container_low` / `#1a1b21`):** Navigation rails and sidebars.
*   **Actionable Cards (`surface_container` / `#1e1f25`):** Standard data widgets.
*   **Elevated Focus (`surface_container_high` / `#292a2f`):** Active or hovered elements.

### The Rules of Light
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for structural sectioning. If you need to separate the sidebar from the main content, do it with a shift from `surface` to `surface_container_low`.
*   **The "Glass & Gradient" Rule:** Floating modals and high-level alerts must use **Glassmorphism**. Apply a `backdrop-blur` of 12px-20px with a 40% opacity fill of `surface_container_highest`. 
*   **Signature Glows:** Primary actions (`primary_container` / `#00d1ff`) should utilize a subtle outer glow (0px 0px 12px) using the same color at 30% opacity. This mimics the light emission of a physical terminal.

## 3. Typography: Technical Authority
We pair **Space Grotesk** (Display/Headlines) with **Inter** (Body/Labels) to balance futuristic character with extreme legibility.

*   **Tactical Headers (`display-sm` to `headline-sm`):** Use Space Grotesk. These are your "Status Indicators." Use `primary` or `on_surface` color.
*   **Data Readouts (`title-md`):** Use Inter. For numerical telemetry, ensure `font-variant-numeric: tabular-nums` is active to prevent jittering during live updates.
*   **Utility Labels (`label-sm`):** Inter at 0.6875rem. This is for metadata. It should be used sparingly with `on_surface_variant` to keep the UI from feeling cluttered.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows look "muddy" on deep dark backgrounds. We use **Ambient Luster** instead.

*   **The Layering Principle:** Instead of a shadow, "lift" a component by moving it one step up the surface scale. A card on `surface_container_low` should be `surface_container`.
*   **Ghost Borders:** When accessibility requires a stroke (e.g., input fields), use `outline_variant` at 15% opacity. It should feel like a faint "etching" on glass, not a solid line.
*   **Depth through Blur:** Use `surface_tint` (#4cd6ff) at 2% opacity as a very large, soft background radial gradient behind primary data visualizations to suggest a "behind-the-glass" light source.

## 5. Tactical Components

### Buttons & Inputs
*   **Primary Action:** `primary_container` (#00d1ff) background. No border. Text color is `on_primary_fixed` (#001f28). On hover, increase the outer glow, do not change the background color.
*   **Ghost Inputs:** Use `surface_container_lowest` with a "Ghost Border" of `outline_variant` at 20%. Upon focus, the border transitions to `primary` with a 2px outer neon glow.

### Chips & Status Indicators
*   **Success (`tertiary` / Cyber Green):** Use for "Safe" states.
*   **Critical (`error` / Critical Red):** Use for active breaches.
*   **Design Note:** Forbid solid background chips for status. Instead, use a "Pulse" style: A small 6px circular dot of the color next to `body-sm` text. It feels more like a live hardware LED.

### Lists & Cards
*   **The Divider Ban:** Never use `<hr>` or border-bottom. Separate list items using `spacing.2` (0.4rem) and alternating background tints (`surface_container_low` vs `surface_container_lowest`) or simply use whitespace.
*   **Data Density:** Use `spacing.3` (0.6rem) for internal card padding to maintain a "dense but breathable" SOC environment.

### Specialized SOC Components
*   **Telemetry Sparklines:** High-contrast lines using `primary`. Forbid fills under the line; keep it a pure, thin vector to emphasize the technical nature.
*   **Hex-Grid Overlays:** For map views or high-level status grids, use a subtle repeating SVG pattern of hexagons at 3% opacity to reinforce the cybersecurity theme.

## 6. Do's and Don'ts

### Do
*   **DO** use `secondary_fixed_dim` for "inactive" or "muted" data. 
*   **DO** use intentional asymmetry. A large tactical metric on the left balanced by three small density-rich lists on the right creates a professional, "worked-in" feel.
*   **DO** use `surface_bright` sparingly for hover states on dark buttons to create a "backlit" effect.

### Don't
*   **DON'T** use pure white (#FFFFFF). Always use `on_surface` (#e3e1e9) to reduce eye strain in dark environments.
*   **DON'T** use standard Material Design "Drop Shadows." They are invisible on `#121318`. Use background color shifts and glows.
*   **DON'T** use rounded corners above `md` (0.375rem) for data containers. We want "Technical Sharpness," not "Consumer Softness." Use `sm` (0.125rem) for most tactical elements.