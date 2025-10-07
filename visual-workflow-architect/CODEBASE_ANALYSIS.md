# Visual Workflow Architect - Codebase Analysis

## Event Listeners, State Management, and Bubble Integration

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Event System](#event-system)
3. [State Management](#state-management)
4. [Bubble Integration](#bubble-integration)
5. [User Interactions](#user-interactions)
6. [Data Flow](#data-flow)

---

## Architecture Overview

The Visual Workflow Architect is a Bubble plugin that creates an interactive sequence diagram for visualizing workflows. It uses a **modular architecture** with clear separation of concerns:

### Core Modules

1. **Data Store** (`data-store.js`) - Centralized state management
2. **Event Bridge** (`event-bridge.js`) - Communication between UI and Bubble
3. **Renderer** (`react-flow-renderer-clean.js`) - React-based UI rendering
4. **Inline Edit** (`inline-edit.js`, `workflow-inline-edit.js`) - Double-click editing
5. **Drag & Drop** (`sequence-drag-drop.js`) - Sequence reordering

---

## Event System

### 1. Custom DOM Events

The plugin uses **custom DOM events** for internal communication:

#### Event: `workflow-architect:update`

**Purpose**: Triggered when any entity (container, sequence, workflow) is updated via inline editing

**Dispatched by**:

- `inline-edit.js` (for containers and sequences)
- `workflow-inline-edit.js` (for workflows)

**Listened by**:

- `event-bridge.js` → `handleUpdate()` method

**Event Detail Structure**:

```javascript
{
  entityType: "container" | "sequence" | "workflow",
  entityId: "unique_id",
  fieldName: "name_text" | "label_text",
  newValue: "Updated text",
  oldValue: "Original text",
  allData: { /* full entity data */ }
}
```

**Flow**:

1. User double-clicks element → inline edit starts
2. User presses Enter → `saveEdit()` called
3. Data store updated locally
4. Custom event dispatched
5. Event bridge receives event
6. Bubble state published + workflow triggered

---

#### Event: `workflow-architect:rerender`

**Purpose**: Forces UI re-render after data changes

**Dispatched by**:

- `sequence-drag-drop.js` (after drag-drop)
- Potentially other modules after data updates

**Listened by**:

- `react-flow-renderer-clean.js` (global listener)

**Flow**:

1. Data change occurs (e.g., drag-drop)
2. Event dispatched
3. Renderer fetches fresh data from data store
4. React re-renders with new data
5. **Scroll position preserved** (using persistent React roots)

---

#### Event: `workflow:update`

**Purpose**: Legacy event for sequence drag-drop updates

**Dispatched by**:

- `sequence-drag-drop.js`

**Listened by**:

- `event-bridge.js` → `handleSequenceDragDrop()`

---

### 2. Native DOM Events

#### Double-Click Events (`dblclick`)

**Purpose**: Initiate inline editing

**Listeners**:

- `inline-edit.js` - Listens on `document` for:
  - `.container-name` elements
  - `.sequence-label` elements
- `workflow-inline-edit.js` - Listens on `document` for:
  - `.workflow-label` elements

**Flow**:

```
User double-clicks element
  ↓
Event listener detects target class
  ↓
`startEdit()` called
  ↓
Input field created and positioned
  ↓
Original element hidden
  ↓
User edits and presses Enter
  ↓
`saveEdit()` updates data store
  ↓
Custom event dispatched to Bubble
```

---

#### Click Events (`click`)

**Purpose**: Multiple purposes - save edits, trigger actions, select entities

**Listeners**:

1. **Inline Edit Save** (`inline-edit.js`, `workflow-inline-edit.js`)

   - Listens on `document`
   - Saves edit when clicking outside input field

2. **Entity Selection** (via event bridge)
   - Container clicks → `handleContainerClick()`
   - Sequence clicks → `handleSequenceClick()`
   - Workflow clicks → `handleWorkflowClick()`
3. **Icon Button Clicks** (in renderer)
   - Sequence doc icon → triggers `sequence_clicked` event
   - Container doc icon → triggers `container_clicked` event
   - Workflow doc icon → triggers `workflow_clicked` event

---

#### Drag Events (`dragstart`, `dragover`, `drop`, `dragend`)

**Purpose**: Reorder sequences via drag-and-drop

**Managed by**: `sequence-drag-drop.js`

**Event Flow**:

```
dragstart
  ↓
Store dragged sequence reference
  ↓
Add visual feedback (dragging class)
  ↓
Create custom drag image (canvas)
  ↓
dragover (on drop zones)
  ↓
Prevent default + add drag-over class
  ↓
drop
  ↓
Calculate new order index
  ↓
Update data store (optimistic update)
  ↓
Dispatch rerender event
  ↓
Send update to Bubble via event bridge
  ↓
dragend
  ↓
Clean up visual feedback
```

**Key Implementation Details**:

- Uses `.universal-drop-zone` elements as drop targets
- Calculates new `orderIndex` as average of before/after values
- Updates `workflowId` and `subgroupId` based on drop zone
- **Optimistic UI update** - updates data store BEFORE sending to Bubble

---

#### Keyboard Events (`keydown`)

**Purpose**: Handle edit actions

**Listeners**:

- `inline-edit.js` and `workflow-inline-edit.js`
  - `Enter` key → Save edit
  - `Escape` key → Cancel edit

---

#### Mouse Events (`mouseenter`, `mouseleave`)

**Purpose**: Show/hide container action buttons on hover

**Managed by**: `react-flow-renderer-clean.js` → `initContainerHoverLogic()`

**Flow**:

```
mouseenter on .container-master-wrapper
  ↓
Clear hide timer
  ↓
Add 'is-visible' class
  ↓
Action buttons fade in
  ↓
mouseleave
  ↓
Start 300ms hide timer
  ↓
Remove 'is-visible' class
  ↓
Action buttons fade out
```

---

## State Management

### Data Store Architecture (`data-store.js`)

The data store is a **singleton object** that maintains the entire application state:

```javascript
window.WorkflowArchitectDataStore = {
  data: {
    feature: null, // Current feature object
    containers: {}, // Indexed by ID
    sequences: {}, // Indexed by ID
    workflows: {}, // Indexed by ID
    subgroups: {}, // Indexed by ID
    isInitialized: false,
    lastUpdate: null,
  },
};
```

### State Initialization

**Triggered by**: Bubble's `update` function
**Process**:

1. Bubble passes raw data objects
2. `init()` method called with `bubbleData`
3. Each entity type transformed via:
   - `transformFeature()`
   - `transformContainer()`
   - `transformSequence()`
   - `transformWorkflow()`
   - `transformSubgroup()`
4. Transformed data stored in indexed objects (by ID)
5. `isInitialized` flag set to `true`

### Data Transformation

**Purpose**: Convert Bubble's data format to internal format

**Example - Sequence Transformation**:

```javascript
transformSequence: function(bubbleSequence) {
  const fromContainerRef = bubbleSequence.get("fromcontainer_custom_component");
  const toContainerRef = bubbleSequence.get("tocontainer_custom_component");
  const workflowRef = bubbleSequence.get("workflow_custom_workflows");
  const subgroupRef = bubbleSequence.get("subgroup_custom_subgroup");

  return {
    id: bubbleSequence.get("_id"),
    label: bubbleSequence.get("label_text") || "Untitled Sequence",
    description: bubbleSequence.get("description_text") || "",
    fromContainerId: fromContainerRef ? fromContainerRef.get("_id") : null,
    toContainerId: toContainerRef ? toContainerRef.get("_id") : null,
    workflowId: workflowRef ? workflowRef.get("_id") : null,
    subgroupId: subgroupRef ? subgroupRef.get("_id") : null,
    orderIndex: bubbleSequence.get("order_index_number") || 0,
    isDashed: bubbleSequence.get("is_dashed_boolean") || false,
    createdDate: bubbleSequence.get("Created Date") || new Date(),
    modifiedDate: bubbleSequence.get("Modified Date") || new Date()
  };
}
```

### State Access Methods

**Read Operations**:

- `getFeature()` - Returns feature object
- `getContainersArray()` - Returns sorted array of containers
- `getSequencesArray()` - Returns sorted array of sequences
- `getWorkflowsArray()` - Returns sorted array of workflows
- `getSubgroupsArray()` - Returns array of subgroups
- `getSequencesByWorkflow(workflowId)` - Filtered sequences
- `getContainer(id)`, `getSequence(id)`, `getWorkflow(id)`, `getSubgroup(id)` - Get by ID

**Write Operations**:

- `updateEntity(entityType, entityId, updates)` - Update entity properties
- `addEntity(entityType, entityData)` - Add new entity
- `removeEntity(entityType, entityId)` - Delete entity
- `updateSequenceOrder(sequenceId, newOrder, subgroupId)` - Reorder sequence

**Data Preparation for Bubble**:

- `getEntityForUpdate(entityType, entityId)` - Formats entity for Bubble update
- `getSequenceForUpdate(sequenceId)` - Special formatting for sequences

---

## Bubble Integration

### Initialization Flow

```
Bubble loads plugin
  ↓
initialize() function called
  ↓
Create container with unique ID
  ↓
Store ID in DOM data attributes
  ↓
update() function called
  ↓
Check if scripts loaded
  ↓
Initialize event bridges
  ↓
Extract Bubble data (feature, containers, sequences, workflows, subgroups)
  ↓
Initialize data store
  ↓
Create/reuse React root
  ↓
Render UI
```

### Bubble → Plugin Communication

**Method**: Bubble's `update()` function passes data via `properties` parameter

**Data Structure**:

```javascript
properties = {
  feature: BubbleObject, // Selected feature
  containers: BubbleList, // List of containers
  sequences: BubbleList, // List of sequences
  workflows: BubbleList, // List of workflows
  subgroups: BubbleList, // List of subgroups
};
```

**Access Pattern**:

```javascript
var featureId = properties.feature.get("_id");
var containerCount = properties.containers.length();
var allContainers = properties.containers.get(0, containerCount);
```

### Plugin → Bubble Communication

**Method**: Event Bridge publishes state and triggers workflows

**State Publishing**:

```javascript
instance.publishState(stateName, value);
```

**Published States**:

- `pending_add` - Entity creation data (JSON string)
- `pending_update` - Entity update data (JSON string)
- `pending_reorder` - Sequence reorder data (JSON string)
- `pending_workflow_doc` - Workflow documentation request (JSON string)
- `selected_container_id` - Selected container ID
- `selected_sequence_id` - Selected sequence ID
- `selected_workflow_id` - Selected workflow ID

**Workflow Triggering**:

```javascript
instance.triggerEvent(eventName);
```

**Triggered Events**:

- `container_added` - New container created
- `container_updated` - Container modified
- `container_clicked` - Container selected
- `sequence_added` - New sequence created
- `sequence_updated` - Sequence modified (includes reorder)
- `sequence_clicked` - Sequence selected
- `workflow_added` - New workflow created
- `workflow_updated` - Workflow modified
- `workflow_clicked` - Workflow selected
- `workflow_documentation_clicked` - Workflow doc icon clicked
- `subgroup_added` - New subgroup created
- `subgroup_updated` - Subgroup modified

### Event Bridge Methods

Each user action has a corresponding handler:

```javascript
// Container operations
handleContainerAdd(eventData);
handleContainerUpdate(eventData);
handleContainerClick(containerId);

// Sequence operations
handleSequenceAdd(eventData);
handleSequenceUpdate(eventData);
handleSequenceClick(sequenceId);
handleSequenceDragDrop(eventData);

// Workflow operations
handleWorkflowAdd(eventData);
handleWorkflowUpdate(eventData);
handleWorkflowClick(workflowId);
handleWorkflowDocumentation(eventData);

// Subgroup operations
handleSubgroupAdd(eventData);
handleSubgroupUpdate(eventData);
```

**Pattern**:

1. Receive event data
2. Log action
3. Publish state to Bubble (`pending_*` state)
4. Trigger Bubble workflow event

---

## User Interactions

### 1. Inline Editing

**Containers and Sequences** (`inline-edit.js`):

```
User double-clicks container name or sequence label
  ↓
startEdit() called
  ↓
Create input field positioned over element
  ↓
Hide original element
  ↓
Focus input and select text
  ↓
User types new value
  ↓
User presses Enter or clicks outside
  ↓
saveEdit() called
  ↓
Update data store locally
  ↓
Get full entity data for Bubble
  ↓
Dispatch 'workflow-architect:update' event
  ↓
Event bridge receives event
  ↓
Publish state to Bubble
  ↓
Trigger Bubble workflow
  ↓
triggerRerender() called
  ↓
UI updates immediately (optimistic)
```

**Workflows** (`workflow-inline-edit.js`):

Similar flow but:

- Targets `.workflow-label` elements
- Creates container with input field
- Positions absolutely within diagram
- Handles workflow-specific data structure

### 2. Drag and Drop Reordering

**Sequences** (`sequence-drag-drop.js`):

```
User starts dragging sequence label
  ↓
dragstart event
  ↓
Store reference to dragged sequence
  ↓
Add 'dragging' class for visual feedback
  ↓
Create custom drag image (canvas with arrow + text)
  ↓
User drags over drop zone
  ↓
dragover event
  ↓
Prevent default (allow drop)
  ↓
Add 'drag-over' class to drop zone
  ↓
User releases mouse
  ↓
drop event
  ↓
Read drop zone data attributes:
  - orderBefore
  - orderAfter
  - workflowId
  - subgroupId
  ↓
Calculate new orderIndex = (orderBefore + orderAfter) / 2
  ↓
**OPTIMISTIC UPDATE**: Update data store FIRST
  ↓
Prepare payload with updated data
  ↓
Dispatch 'workflow-architect:rerender' event
  ↓
UI re-renders immediately
  ↓
Send update to Bubble via event bridge
  ↓
dragend event
  ↓
Clean up visual feedback
```

**Key Feature**: Optimistic UI updates ensure smooth UX

### 3. Entity Selection

**Click Handlers**:

```
User clicks sequence doc icon
  ↓
onClick handler (in React component)
  ↓
event.stopPropagation()
  ↓
Call event bridge method
  ↓
handleSequenceClick(sequenceId)
  ↓
Publish 'selected_sequence_id' state
  ↓
Trigger 'sequence_clicked' event
  ↓
Bubble workflow runs
  ↓
(Typically opens detail panel or popup)
```

Similar flow for:

- Container clicks
- Workflow clicks

### 4. Adding Entities

**Add Container Button**:

```
User clicks "Add Container" button
  ↓
handleAddContainer() called
  ↓
Get current feature ID from data store
  ↓
Create new container data object:
  {
    name_text: "New Container",
    color_hex: "#3ea50b",
    feature_id: featureId
  }
  ↓
Call event bridge
  ↓
handleContainerAdd(newContainerData)
  ↓
Publish 'pending_add' state (JSON)
  ↓
Trigger 'container_added' event
  ↓
Bubble workflow creates container in database
  ↓
Bubble re-runs update() function
  ↓
Plugin receives updated data
  ↓
UI re-renders with new container
```

**Add Sequence Button**:

```
User clicks "Add Sequence" button
  ↓
handleAddSequence() called
  ↓
Check if at least 2 containers exist
  ↓
Get feature ID and calculate next order index
  ↓
Create event data:
  {
    type: "add_sequence_clicked",
    featureId: featureId,
    nextOrderIndex: nextOrderIndex,
    timestamp: Date.now()
  }
  ↓
Call event bridge
  ↓
handleSequenceCreationTrigger(eventData)
  ↓
Publish 'pending_add' state
  ↓
Trigger 'sequence_added' event
  ↓
Bubble workflow shows sequence creation popup
  ↓
User fills form and submits
  ↓
Bubble creates sequence
  ↓
Plugin receives updated data
  ↓
UI re-renders with new sequence
```

---

## Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BUBBLE DATABASE                       │
│  (Features, Containers, Sequences, Workflows, Subgroups)    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Bubble update() function
                         │ passes properties
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUBBLE UPDATE FUNCTION                    │
│  - Extract data from properties                             │
│  - Initialize event bridges                                 │
│  - Call data store init()                                   │
│  - Create/reuse React root                                  │
│  - Call renderer                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ bubbleData object
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA STORE (data-store.js)               │
│  - Transform Bubble objects to internal format              │
│  - Store in indexed objects (by ID)                         │
│  - Provide read/write methods                               │
│  - Maintain single source of truth                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Transformed data
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              RENDERER (react-flow-renderer-clean.js)        │
│  - Fetch data from data store                               │
│  - Calculate layout (positions, sizes)                      │
│  - Render React components                                  │
│  - Initialize drag-drop                                     │
│  - Setup event listeners                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ React elements
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                       │
│  - Containers (swimlanes)                                   │
│  - Sequences (arrows with labels)                           │
│  - Workflows (grouped backgrounds)                          │
│  - Interactive elements (buttons, icons)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ User interactions
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION MODULES                  │
│  - inline-edit.js (double-click editing)                    │
│  - workflow-inline-edit.js (workflow editing)               │
│  - sequence-drag-drop.js (reordering)                       │
│  - Click handlers (selection, actions)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Custom DOM events
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  EVENT BRIDGE (event-bridge.js)             │
│  - Listen for custom events                                 │
│  - Handle entity operations                                 │
│  - Publish state to Bubble                                  │
│  - Trigger Bubble workflows                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ instance.publishState()
                         │ instance.triggerEvent()
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUBBLE WORKFLOWS                        │
│  - Receive triggered events                                 │
│  - Read published states                                    │
│  - Update database                                          │
│  - Trigger update() function                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Loop back to top
                         ↓
                    (Cycle repeats)
```

### Key Data Flow Patterns

#### 1. Read Flow (Display Data)

```
Bubble DB → update() → Data Store → Renderer → UI
```

#### 2. Write Flow (User Edits)

```
UI → Interaction Module → Data Store (optimistic) → Event Bridge → Bubble Workflow → Bubble DB → update() → Data Store → Renderer → UI
```

#### 3. Optimistic Update Flow (Drag-Drop)

```
UI (drag) → sequence-drag-drop.js → Data Store (immediate update) → Rerender Event → Renderer → UI (instant feedback)
                                                                    ↓
                                                            Event Bridge → Bubble (background save)
```

---

## Summary

### Event Listeners Summary

| Event Type                    | Listener Location              | Purpose                    | Handler                    |
| ----------------------------- | ------------------------------ | -------------------------- | -------------------------- |
| `dblclick`                    | `inline-edit.js`               | Edit containers/sequences  | `startEdit()`              |
| `dblclick`                    | `workflow-inline-edit.js`      | Edit workflows             | `startEdit()`              |
| `click`                       | `inline-edit.js`               | Save edit on click outside | `saveEdit()`               |
| `click`                       | React components               | Entity selection           | Event bridge handlers      |
| `dragstart`                   | `sequence-drag-drop.js`        | Start sequence drag        | Store reference            |
| `dragover`                    | `sequence-drag-drop.js`        | Allow drop                 | Prevent default            |
| `drop`                        | `sequence-drag-drop.js`        | Reorder sequence           | Calculate new order        |
| `dragend`                     | `sequence-drag-drop.js`        | Clean up                   | Remove classes             |
| `keydown`                     | Inline edit modules            | Save/cancel edit           | Enter/Escape handlers      |
| `mouseenter/leave`            | `react-flow-renderer-clean.js` | Show/hide buttons          | Toggle visibility          |
| `workflow-architect:update`   | `event-bridge.js`              | Entity updates             | `handleUpdate()`           |
| `workflow-architect:rerender` | `react-flow-renderer-clean.js` | Force re-render            | Fetch data + render        |
| `workflow:update`             | `event-bridge.js`              | Drag-drop updates          | `handleSequenceDragDrop()` |

### State Management Summary

- **Single Source of Truth**: `WorkflowArchitectDataStore`
- **Indexed Storage**: Objects indexed by ID for O(1) lookup
- **Transformation Layer**: Converts Bubble format to internal format
- **Optimistic Updates**: UI updates immediately, Bubble saves in background
- **Persistent React Roots**: Preserves scroll position across re-renders

### Bubble Integration Summary

- **Initialization**: `initialize()` → `update()` → render
- **Data In**: Bubble `properties` → Data Store → Renderer
- **Data Out**: Event Bridge → `publishState()` + `triggerEvent()` → Bubble Workflows
- **Update Cycle**: Bubble DB change → `update()` called → UI re-renders

### Key Design Patterns

1. **Event-Driven Architecture**: Custom events for loose coupling
2. **Optimistic UI Updates**: Immediate feedback, background persistence
3. **Modular Design**: Separate concerns (data, events, rendering, interactions)
4. **Persistent State**: React roots prevent scroll position loss
5. **Transform Pattern**: Bubble format ↔ Internal format conversion
