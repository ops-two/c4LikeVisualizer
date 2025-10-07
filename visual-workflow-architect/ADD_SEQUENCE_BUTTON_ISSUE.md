# Add Sequence Button Issue Analysis

## Problem Identified

The **Add Sequence** button has an inconsistency compared to the **Add Workflow** button that may prevent it from properly triggering popup workflows in Bubble.

---

## Issue Details

### Current Implementation Comparison

#### Add Workflow Button ✅ (Working Correctly)

```javascript
const handleAddWorkflow = () => {
  const feature = window.WorkflowArchitectDataStore?.getFeature();
  if (!feature || !feature.id) {
    return;
  }
  const newWorkflowData = {
    name: "New Workflow",
    featureId: feature.id,
  };
  if (window.WorkflowArchitectEventBridge) {
    window.WorkflowArchitectEventBridge.handleWorkflowAdd(newWorkflowData);
  }
};
```

**Event Bridge Handler:**

```javascript
handleWorkflowAdd: function (eventData) {
  console.log("WorkflowArchitectEventBridge: Workflow add requested", eventData);
  this.instance.publishState("pending_add", JSON.stringify(eventData));  // ✅ Uses "pending_add"
  this.instance.triggerEvent("workflow_added");
}
```

---

#### Add Sequence Button ❌ (Potential Issue)

```javascript
const handleAddSequence = () => {
  console.log("Add Sequence clicked - triggering Bubble workflow");

  // Check if we have at least 2 containers
  if (actors.length < 2) {
    console.log("Need at least 2 containers to create a sequence");
    return;
  }

  // Get feature ID from data store
  const feature = window.WorkflowArchitectDataStore?.getFeature();
  const featureId = feature?.id;

  if (!featureId) {
    console.error("No feature ID available for new sequence");
    return;
  }

  // Calculate next order index for new sequence
  const nextOrderIndex = allPositionedMessages.length + 1;

  // Trigger Bubble workflow event to show sequence creation popup
  const eventData = {
    type: "add_sequence_clicked",
    featureId: featureId,
    nextOrderIndex: nextOrderIndex,
    timestamp: Date.now(),
  };

  // Use event bridge to trigger sequence creation popup
  if (window.WorkflowArchitectEventBridge) {
    console.log("Triggering sequence creation popup via event bridge");
    window.WorkflowArchitectEventBridge.handleSequenceCreationTrigger(
      eventData
    );
  } else {
    console.error("WorkflowArchitectEventBridge not available");
  }
};
```

**Event Bridge Handler:**

```javascript
// Handle sequence creation trigger (for "Add Sequence" button)
handleSequenceCreationTrigger: function (eventData) {
  console.log("WorkflowArchitectEventBridge: Sequence creation trigger", eventData);
  this.handleSequenceAdd(eventData);  // ⚠️ Calls handleSequenceAdd
},

// Handle sequence creation
handleSequenceAdd: function (eventData) {
  console.log("WorkflowArchitectEventBridge: Sequence add requested", eventData);
  this.instance.publishState("pending_update", JSON.stringify(eventData));  // ❌ Uses "pending_update" instead of "pending_add"
  this.instance.triggerEvent("sequence_added");
}
```

---

## The Problems

### Problem 1: Wrong State Name

**Issue**: `handleSequenceAdd` publishes to `"pending_update"` instead of `"pending_add"`

**Impact**:

- Bubble workflows listening for new sequence creation should read from `"pending_add"` state
- Using `"pending_update"` is semantically incorrect for creation operations
- This inconsistency with the workflow pattern may cause Bubble workflows to not receive the data

**Expected Behavior**: Should use `"pending_add"` for creation operations (like `handleWorkflowAdd` does)

---

### Problem 2: Data Structure Inconsistency

**Issue**: The `eventData` structure differs between sequence and workflow creation

**Add Workflow Data:**

```javascript
{
  name: "New Workflow",
  featureId: feature.id
}
```

**Add Sequence Data:**

```javascript
{
  type: "add_sequence_clicked",
  featureId: featureId,
  nextOrderIndex: nextOrderIndex,
  timestamp: Date.now()
}
```

**Impact**:

- The sequence data includes extra fields (`type`, `nextOrderIndex`, `timestamp`) that may not be needed
- The sequence data is missing actual sequence properties (like `fromContainerId`, `toContainerId`, `label`)
- This suggests the button is meant to trigger a popup (not directly create), but the state name is still wrong

---

### Problem 3: Unclear Intent

**Issue**: The implementation is ambiguous about whether it should:

1. **Directly create a sequence** (like Add Workflow does)
2. **Trigger a popup** for the user to fill in sequence details

**Current Code Suggests**: It wants to trigger a popup (based on comments and data structure)

**But**: The event name `"sequence_added"` suggests a sequence was already created

---

## Recommended Fixes

### Option 1: If Add Sequence Should Trigger a Popup (Recommended)

This matches the comments in the code and makes sense since sequences need more info (from/to containers).

**Fix in `event-bridge.js`:**

```javascript
// Handle sequence creation trigger (for "Add Sequence" button)
handleSequenceCreationTrigger: function (eventData) {
  console.log(
    "WorkflowArchitectEventBridge: Sequence creation trigger",
    eventData
  );
  // Publish to a dedicated state for popup triggers
  this.instance.publishState("pending_sequence_popup", JSON.stringify(eventData));
  this.instance.triggerEvent("sequence_creation_popup_requested");
},
```

**Bubble Workflow Setup:**

- Create a workflow that triggers on `"sequence_creation_popup_requested"` event
- Read data from `"pending_sequence_popup"` state
- Show popup with form for sequence details
- On form submit, create the actual sequence

---

### Option 2: If Add Sequence Should Directly Create (Like Add Workflow)

This would require default values for from/to containers.

**Fix in `event-bridge.js`:**

```javascript
// Handle sequence creation
handleSequenceAdd: function (eventData) {
  console.log(
    "WorkflowArchitectEventBridge: Sequence add requested",
    eventData
  );
  this.instance.publishState("pending_add", JSON.stringify(eventData));  // ✅ Changed to "pending_add"
  this.instance.triggerEvent("sequence_added");
},
```

**Fix in `react-flow-renderer-clean.js`:**

```javascript
const handleAddSequence = () => {
  console.log("Add Sequence clicked - creating new sequence");

  if (actors.length < 2) {
    console.log("Need at least 2 containers to create a sequence");
    return;
  }

  const feature = window.WorkflowArchitectDataStore?.getFeature();
  if (!feature || !feature.id) {
    console.error("No feature ID available for new sequence");
    return;
  }

  // Create sequence with default values (first two containers)
  const newSequenceData = {
    label: "New Sequence",
    featureId: feature.id,
    fromContainerId: actors[0].id,
    toContainerId: actors[1].id,
    orderIndex: allPositionedMessages.length + 1,
    isDashed: false,
  };

  if (window.WorkflowArchitectEventBridge) {
    window.WorkflowArchitectEventBridge.handleSequenceAdd(newSequenceData);
  }
};
```

---

## Comparison with Add Container Button

Let me check how Add Container works for additional context:

**Add Container:**

```javascript
const handleAddContainer = () => {
  const feature = window.WorkflowArchitectDataStore?.getFeature();
  if (!feature || !feature.id) {
    return;
  }
  const newContainerData = {
    name_text: "New Container",
    color_hex: "#3ea50b",
    feature_id: feature.id,
  };
  if (window.WorkflowArchitectEventBridge) {
    window.WorkflowArchitectEventBridge.handleContainerAdd(newContainerData);
  }
};
```

**Event Bridge:**

```javascript
handleContainerAdd: function (eventData) {
  console.log("WorkflowArchitectEventBridge: Container add requested", eventData);
  this.instance.publishState("pending_add", JSON.stringify(eventData));  // ✅ Uses "pending_add"
  this.instance.triggerEvent("container_added");
}
```

**Pattern**: Container follows the same pattern as Workflow - uses `"pending_add"` and directly creates with default values.

---

## Recommended Solution

Based on the code comments and the fact that sequences require more complex setup (from/to containers, workflow assignment), I recommend **Option 1** (popup approach).

### Implementation Steps:

1. **Update `event-bridge.js`:**

```javascript
// Handle sequence creation trigger (for "Add Sequence" button)
handleSequenceCreationTrigger: function (eventData) {
  console.log(
    "WorkflowArchitectEventBridge: Sequence creation popup trigger",
    eventData
  );
  this.instance.publishState("pending_sequence_popup", JSON.stringify(eventData));
  this.instance.triggerEvent("sequence_creation_popup_requested");
},
```

2. **Keep `react-flow-renderer-clean.js` as is** (it's already correct for popup approach)

3. **In Bubble:**
   - Create workflow triggered by `"sequence_creation_popup_requested"` event
   - Read `"pending_sequence_popup"` state to get feature ID and order index
   - Show popup with dropdowns for:
     - From Container
     - To Container
     - Workflow (optional)
     - Subgroup (optional)
     - Label
     - Is Dashed (checkbox)
   - On submit, create sequence in database
   - Plugin will auto-refresh via update() function

---

## Alternative: Keep Current Behavior But Fix State Name

If you want minimal changes and the current Bubble workflow is already set up:

**Just change this one line in `event-bridge.js`:**

```javascript
handleSequenceAdd: function (eventData) {
  console.log("WorkflowArchitectEventBridge: Sequence add requested", eventData);
  this.instance.publishState("pending_add", JSON.stringify(eventData));  // Changed from "pending_update"
  this.instance.triggerEvent("sequence_added");
},
```

**Then update your Bubble workflow to:**

- Trigger on `"sequence_added"` event
- Read from `"pending_add"` state (not `"pending_update"`)

---

## Summary

**Main Issue**: Add Sequence uses `"pending_update"` state instead of `"pending_add"` state, breaking consistency with Add Workflow and Add Container patterns.

**Quick Fix**: Change `"pending_update"` to `"pending_add"` in `handleSequenceAdd` method.

**Better Fix**: Create a dedicated popup trigger event (`"sequence_creation_popup_requested"`) with its own state (`"pending_sequence_popup"`) to clearly separate popup triggers from actual creation operations.
