# Visual Workflow Architect - Implementation Plan
*Based on September 1st Meeting Notes*

## **Meeting Requirements Summary**

### **1. Subgroups Rendering (HIGH PRIORITY)**
- **Current Issue**: "The subgroups are not visible"
- **Required**: Render as "small little boxes not taking the whole bit, small little boxes in it"
- **Location**: Within workflows, containing sequences
- **Status**: Previously rendering but broken now

### **2. Sequence Overlapping (MEDIUM PRIORITY)**
- **Decision**: Allow sequences in multiple subgroups
- **Quote**: "Let the algorithm decide how to overlap them"
- **Implementation**: Remove restriction preventing overlap

### **3. Empty Canvas Workflow (MEDIUM PRIORITY)**
- **Options**: 
  - Add "Add Workflow" button for empty canvases
  - OR add default workflow on load
- **Context**: "How do we add the workflow?" when canvas is empty

### **4. Drag & Drop Grid System (MEDIUM PRIORITY)**
- **Concept**: Each circle = grid intersection point
- **Constraint**: Sequences can only drag within their column
- **UI**: Drag handle on left side (appears on hover)
- **Grid Logic**: Multiple potential circle positions per row, only some used

### **5. Workflow Selection UI (MEDIUM PRIORITY)**
- **Context**: When adding sequences, show which workflow to assign
- **Integration**: Part of sequence creation flow

---

## **Phase 1: Subgroups Rendering Implementation**

### **StoryMap Pattern Analysis:**
The storymap renders **releases** as horizontal bands that span across multiple features. For visual workflow, **subgroups** should work similarly but as "small boxes" within workflows.

### **Data Flow Pattern (Following StoryMap):**
```javascript
// 1. Get data from store
const workflows = window.WorkflowArchitectDataStore.getEntitiesArray("workflow");
const subgroups = window.WorkflowArchitectDataStore.getEntitiesArray("subgroup");
const sequences = window.WorkflowArchitectDataStore.getEntitiesArray("sequence");

// 2. Group sequences by subgroup
subgroups.forEach(subgroup => {
  const subgroupSequences = sequences.filter(seq => 
    seq.subgroupId === subgroup.id
  );
  // Render subgroup box containing these sequences
});
```

### **Visual Design Specifications:**
- **Size**: Small rectangular boxes (not full workflow width)
- **Position**: Within workflow boundaries
- **Style**: Semi-transparent background with border
- **Content**: Contains sequence circles/nodes
- **Overlap**: Multiple subgroups can contain same sequences

### **Implementation Steps:**
1. **Check current subgroup data access** - verify field names and data structure
2. **Add subgroup rendering logic** to react-flow-renderer-clean.js
3. **Create subgroup CSS styles** for small box appearance
4. **Test with existing data** to ensure proper rendering
5. **Handle overlapping sequences** in multiple subgroups

### **CSS Pattern (Following StoryMap Release Bands):**
```css
.subgroup-container {
  position: absolute;
  background: rgba(200, 220, 255, 0.3);
  border: 1px solid #4a90e2;
  border-radius: 8px;
  padding: 10px;
  /* Small box - not full width */
  width: auto;
  min-width: 150px;
}
```

---

## **Phase 2: Empty Canvas & Workflow Management**

### **StoryMap Empty State Pattern:**
```javascript
if (journeys.length === 0) {
  html += `<div class="empty-project-placeholder">
    <div class="add-item-button-static large" data-add-type="journey">
      + Add Your First Journey
    </div>
  </div>`;
}
```

### **Visual Workflow Adaptation:**
```javascript
if (workflows.length === 0) {
  html += `<div class="empty-workflow-placeholder">
    <div class="add-item-button-static large" data-add-type="workflow">
      + Add Your First Workflow
    </div>
  </div>`;
}
```

---

## **Phase 3: Grid System & Drag/Drop**

### **Grid Concept:**
- Each sequence position = grid intersection
- Vertical columns = container lifelines  
- Horizontal rows = sequence order positions
- Drag handles appear on hover (left side)

### **Implementation Strategy:**
1. **Grid Foundation**: Calculate grid positions for all potential sequence slots
2. **Drag Handles**: Add left-side handles that appear on hover
3. **Drag Constraints**: Restrict movement to vertical column only
4. **Order Updates**: Update sequence order_index on drop
5. **Re-render**: Trigger immediate UI update after drag

---

## **Implementation Priority:**
1. **Phase 1**: Subgroups rendering (most visible impact)
2. **Phase 2**: Empty canvas workflow button  
3. **Phase 3**: Grid system foundation
4. **Phase 4**: Drag/drop functionality
5. **Phase 5**: Workflow selection UI

---

## **Technical Notes:**
- Follow storymap's proven event bridge and data store patterns
- Maintain separation of concerns between renderer, data store, and event bridge
- Use same re-render triggers and optimistic update patterns
- Ensure all changes trigger immediate UI updates
