### **Consolidated Technical Blueprint: Visual Workflow Architect Plugin (V4 - Visual Target Specification)**

This document provides the complete specification for the next version of the Visual Workflow Architect plugin. It is based on the provided visual mockups and interactive prototype, detailing the precise UI, functionality, and the necessary data model changes to achieve the target design.

---

### **Part 1: Feature Description & Vision** (Unchanged)

**Feature Name:** Visual Workflow Architect

**Vision:** To replace static, text-based requirement documents with a dynamic, interactive "data movement map." This visual workspace provides absolute clarity on how a product feature operates across an ecosystem of tools, serving as the core planning, documentation, and development hub.

---

### **Part 2: Target Visual & Functional Requirements**

This section details the target state of the plugin, combining visual design elements with user interactions.

#### **Section 2.1: Visual Layout & UI Requirements**

1.  **Header - Container Toolbar:**

    - At the top of the diagram, a horizontal list of all **Containers** will be displayed.
    - Each container is represented as a colored box with its icon and name.
    - A `+` button will be present between each container, allowing users to add a new container at that specific position.

2.  **Workflow Grouping:**

    - Sequences will be grouped into distinct **Workflows**.
    - Each workflow is visually represented by a large, rounded rectangle with a colored background and a subtle border.
    - The workflow's name (e.g., "Workflow A") is displayed as a label in the top-left corner of the rectangle.

3.  **Lifelines & Activation Points:**

    - Each container in the header extends a vertical, dotted **lifeline** down the entire height of the diagram.
    - When a sequence starts or ends on a lifeline, an **activation point** (a colored circle) is rendered.
    - The color of the activation point **must match the color of its parent Container** from the header, providing clear visual association.

4.  **Sequence Arrows & Labels:**
    - **Arrow Styling:** Arrows are the core visual element for sequences and must support the following configurable properties:
      - **Style:** Solid or **Dotted** (technically dashed).
      - **Direction:** One-way (single arrowhead) or **Two-way** (arrowheads on both ends).
      - **Color:** The arrow line and arrowhead(s) must be colorable, supporting at minimum **Green, Red, and Blue**, in addition to the default dark gray/black.
    - **Labels:** Each sequence has a text label positioned near the arrow. These labels are for descriptive purposes and are editable.

#### **Section 2.2: Functional & Interaction Requirements**

1.  **Editing:**

    - **Double-Click to Edit:** Users must be able to edit the names of **Containers** and the labels of **Sequences** by double-clicking on them directly in the diagram. This will trigger the existing inline editing module.

2.  **Adding Entities:**

    - **Adding a Container:** Clicking a `+` button in the header toolbar will trigger a Bubble workflow to create a new Container and insert it at that position.
    - **Adding a Sequence:** Clicking a context-aware `+` button (which should appear on hover between existing sequences or at the end of a workflow) will trigger the `show_sequence_creation_popup` event in Bubble. This allows for inserting new steps in the correct order.

3.  **Reordering:**
    - **No Drag-and-Drop:** There will be **no drag-and-drop functionality** for reordering sequences or containers. All ordering is managed explicitly by the `order_index` field, which should be updated via Bubble workflows (e.g., when inserting a new sequence).

---

### **Part 3: Implemented Technical Architecture & Blueprint** (Largely Unchanged)

The plugin will continue to leverage its robust, proven modular architecture. The primary changes will be within the Renderer and the Data Store to support the new visual requirements.

- **`react-flow-renderer-clean.js` (The Renderer):** This module must be updated to:
  - Render the new header toolbar with container boxes and `+` icons.
  - Render the colored workflow background rectangles.
  - Draw activation points (circles) using the color from the parent container's data.
  - Implement the logic to render arrows with different styles (solid/dotted), directions (one/two heads), and colors (Green/Red/Blue/Default).
- **`data-store.js`, `event-bridge.js`, `inline-edit.js`:** These modules will require minimal changes, primarily to handle the new fields in the data model.

---

### **Part 4: Updated As-Built Technical Specifications**

To support the new visual requirements, the database schema and data formats must be updated.

#### **Bubble Database Schema (Updated)**

**Data Type: `Container`** (Largely Unchanged)

- `color_hex` (text) - **Crucial for coloring activation points.**
- `name` (text)
- `order_index` (number)
- ... (other existing fields)

**Data Type: `Sequence` (Updated Schema)**

- `Label` (text) - The descriptive text for the sequence.
- `fromContainer` (relationship to `Container`)
- `toContainer` (relationship to `Container`)
- `order_index` (number) - Manages the vertical order.
- `is_dashed` (yes/no) - Controls solid vs. dotted/dashed style.
- **`arrow_direction` (text)** - **NEW field.** Stores values like `"one-way"` or `"two-way"` to control arrowheads.
- **`color_hex` (text)** - **NEW field.** Stores the hex code for the arrow color (e.g., for Green, Red, Blue, or default).
- `Workflow` (relationship to `Workflow`)
- ... (other existing fields like `description`, `Feature`, etc.)

**Data Type: `Workflow`**

- `name` (text) - The name displayed on the workflow label.
- `color_hex` (text) - The background color of the workflow grouping rectangle.
- `order_index` (number) - Controls the vertical stacking of workflows.

#### **Update Data Format (JSON payload for `pending_update` state)**

The JSON payload sent from the plugin to Bubble for a Sequence update must be expanded to include the new fields.

- **Example Payload for an Updated `Sequence`:**
  ```json
  {
    "entityId": "...",
    "Label": "Two-way Sync",
    "order_index": 3.0,
    "fromContainer": "container_id_1...",
    "toContainer": "container_id_2...",
    "is_dashed": false,
    "arrow_direction": "two-way", // New property
    "color_hex": "#ff4444" // New property for a red arrow
  }
  ```
