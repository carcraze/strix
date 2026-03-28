# Design System Strategy: High-Tech Security & Tonal Depth

## 1. Overview & Creative North Star
**Creative North Star: "The Sentinel’s Veil"**

This design system moves away from the "flat-grid" aesthetic of traditional SaaS to create a high-fidelity, editorial experience. It is designed to feel like a high-tech command center—secure, authoritative, and sophisticated. We achieve this by moving beyond standard UI tropes, using intentional asymmetry, overlapping elements, and high-contrast typography scales that demand attention. 

The experience isn't built on lines, but on **layers**. By utilizing depth, glassmorphism, and a meticulously defined surface hierarchy, the interface feels less like a website and more like a precision-engineered instrument.

---

## 2. Colors & Surface Logic

Our palette is rooted in the deep shadows of cybersecurity, punctuated by "vibrant data" accents.

### The Color Logic
*   **Base (`#070d1f`):** The absolute foundation. All depth is built upward from this deep navy.
*   **Primary (`#a3a6ff`):** Used for critical paths and high-value actions.
*   **Secondary (`#34b5fa`):** Used for technical highlights and informative accents.
*   **Tertiary (`#c180ff`):** Used to draw the eye to secondary conversion points or "AI-driven" insights.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Tonal Transitions:** Using subtle gradients to suggest a change in context.
3.  **Negative Space:** Using the Spacing Scale (specifically `12` to `20`) to create "breathing rooms" that naturally separate content.

### Surface Hierarchy & Nesting
Think of the UI as layers of polarized glass.
*   **Background Layer:** `surface` (`#070d1f`)
*   **Section Layer:** `surface-container-low` (`#0c1326`)
*   **Card/Interactive Layer:** `surface-container` (`#11192e`)
*   **Floating/Active Layer:** `surface-container-highest` (`#1c253e`)

### Signature Textures
To add "soul" to the professional tech aesthetic, use linear gradients on Primary CTAs. 
*   **CTA Gradient:** `primary_dim` (`#6063ee`) to `primary` (`#a3a6ff`) at a 135-degree angle.
*   **Glassmorphism:** For floating menus or tooltips, use `surface_container` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance high-tech precision with human readability.

### Type Pairing
*   **Display & Headlines:** **Plus Jakarta Sans.** This is our "voice." It is used for large-scale storytelling and key security value propositions. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for a high-end, bespoke feel.
*   **Body & Titles:** **Inter.** This is our "data." Inter provides the technical clarity required for security logs and complex dashboards.

### Typography Roles
*   **High Contrast:** Use `on_surface_variant` (`#a5aac2`) for secondary text to ensure that primary headlines in `on_surface` (`#dfe4fe`) pop with maximum authority.
*   **Labeling:** `label-sm` should be uppercase with `0.05em` letter spacing to mimic technical schematics.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through "Tonal Layering." To elevate an element, do not simply add a shadow; change its surface tier. For example, a dashboard widget (`surface-container-high`) should sit atop a sidebar (`surface-container-low`).

### Ambient Shadows
When a component must "float" (e.g., a modal or a primary dropdown), use a "Security Glow":
*   **Shadow Color:** `on_secondary` at 8% opacity.
*   **Properties:** `0px 24px 48px`. This creates a soft, ambient lift that feels integrated into the dark background rather than a detached "drop shadow."

### The "Ghost Border" Fallback
If an element requires a container but background shifts are insufficient, use a **Ghost Border**:
*   **Stroke:** `outline_variant` (`#41475b`) at **15% opacity**.
*   **Width:** `1px` or `0.5px` if the screen density allows. 
*   **Prohibition:** Never use 100% opaque outlines; they break the "Premium Veil" aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary_dim` to `primary`. Roundedness: `full`. No border.
*   **Secondary:** Ghost Border style. Roundedness: `full`. Text color: `primary`.
*   **Tertiary:** Text-only with an arrow icon. Uses `title-sm` typography.

### Cards
*   **Style:** No borders. Use `surface-container` background.
*   **Corner Radius:** `xl` (1.5rem) for main dashboard cards; `lg` (1rem) for nested items.
*   **Spacing:** Internal padding must never be less than `spacing.6` (2rem).

### Input Fields
*   **State:** Unfocused inputs should be `surface-container-lowest` with a `0.5rem` radius.
*   **Focus:** Border becomes `primary` at 50% opacity with a subtle `primary` outer glow (4px blur).

### List Items
*   **Prohibition:** No horizontal dividers.
*   **Separation:** Use a `0.7rem` (`spacing.2`) vertical gap between items. Highlight the hovered state with `surface-container-highest`.

### Security Chips
*   **Usage:** For "Status" or "Tagging."
*   **Style:** Low-saturation backgrounds with high-saturation text (e.g., `error_container` background with `on_error_container` text).

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. Let a headline "hang" into the margin to create visual interest.
*   **Do** use "vibrant data" colors (`tertiary`, `secondary`) sparingly to highlight the most important security metrics.
*   **Do** prioritize whitespace. If a section feels crowded, double the spacing token.

### Don't:
*   **Don't** use pure white (`#FFFFFF`) for text. Use `on_background` (`#dfe4fe`) to prevent eye strain against the dark theme.
*   **Don't** use standard "Material Design" shadows. Stick to the Tonal Layering and Ambient Shadow guidelines.
*   **Don't** use sharp corners. Everything in this system must feel approachable yet high-tech—sharp corners feel dated and "standard."

---

## 7. Spacing & Rhythm

All spacing must follow the defined scale to maintain a mathematical harmony across the platform.
*   **Standard Padding:** `spacing.6` (2rem).
*   **Section Gaps:** `spacing.20` (7rem) or `spacing.24` (8.5rem) to maintain the "Premium/Editorial" feel.
*   **Component Internal:** `spacing.3` (1rem).