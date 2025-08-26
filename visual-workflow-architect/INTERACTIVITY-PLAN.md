# Visual Workflow Architect - Detailed Interactivity Plan

## Analysis Summary

Based on meticulous analysis of the storymap-grid implementation, I've identified the proven event-driven architecture pattern that enables seamless real-time updates between the plugin UI and Bubble database.

## Core Architecture Pattern (Proven from Storymap-Grid)

### 1. Event-Driven Communication Flow
```
User Interaction → Custom DOM Event → Event Bridge → Bubble State → Workflow Trigger → Database Update → UI Re-render
```

### 2. Key Components Required

#### A. **Inline Edit System** (`sequence-inline-edit.js`)
- **Double-click handlers** on container names and sequence labels
- **Input/textarea overlays** for in-place editing
- **Save/cancel logic** with keyboard shortcuts (Enter/Escape)
- **Custom event dispatch** with entity data

#### B. **Event Bridge** (`sequence-event-bridge.js`) 
- **Custom event listeners** for `workflow:update`, `workflow:reorder`, `workflow:add`
- **Bubble state publishing** via `publishState()`
- **Workflow triggering** via `triggerEvent()`
- **JSON payload formatting** for Bubble consumption

#### C. **Data Store Enhancement** (extend existing `data-store.js`)
- **Local state management** for containers and sequences
- **Optimistic updates** for UI responsiveness
- **Order index management** for drag-drop operations
- **Entity formatting** for Bubble workflows

#### D. **Bubble Workflow Integration**
- **Element Events** triggered by `pending_update` state changes
- **JSON extraction** using regex patterns
- **Database field updates** based on entity type
- **State clearing** to reset triggers

## Detailed Implementation Steps

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Create Sequence Event Bridge
```javascript
window.SequenceDiagramEventBridge = {
  instance: null,
  
  init(instance) {
    this.instance = instance;
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    document.addEventListener('sequence:container_updated', this.handleContainerUpdate.bind(this));
    document.addEventListener('sequence:sequence_updated', this.handleSequenceUpdate.bind(this));
    document.addEventListener('sequence:container_added', this.handleContainerAdd.bind(this));
    document.addEventListener('sequence:sequence_added', this.handleSequenceAdd.bind(this));
    document.addEventListener('sequence:reorder', this.handleReorder.bind(this));
  },
  
  handleContainerUpdate(event) {
    const payload = {
      entityType: 'container',
      entityId: event.detail.containerId,
      fieldName: 'name_text',
      newValue: event.detail.newName,
      oldValue: event.detail.oldName
    };
    this.instance.publishState('pending_update', JSON.stringify(payload));
    this.instance.triggerEvent('container_updated');
  }
  // ... other handlers
};
```

#### Step 1.2: Create Sequence Inline Edit System
```javascript
window.SequenceDiagramInlineEdit = {
  activeEdit: null,
  
  init(container) {
    this.container = container;
    this.setupEditHandlers();
  },
  
  setupEditHandlers() {
    // Container name editing
    this.container.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('container-name')) {
        this.startContainerEdit(e.target);
      }
    });
    
    // Sequence label editing
    this.container.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('sequence-label')) {
        this.startSequenceEdit(e.target);
      }
    });
  },
  
  startContainerEdit(element) {
    const containerId = element.closest('.actor-lane').dataset.containerId;
    const currentName = element.textContent.trim();
    
    const input = document.createElement('input');
    input.value = currentName;
    input.className = 'inline-edit-input';
    
    this.activeEdit = {
      element,
      input,
      entityType: 'container',
      entityId: containerId,
      originalValue: currentName
    };
    
    this.showEditInput();
  }
  // ... rest of editing logic
};
```

#### Step 1.3: Enhance Data Store for Sequences
```javascript
// Extend existing data-store.js
window.WorkflowArchitectDataStore = {
  data: {
    feature: null,
    containers: new Map(),
    sequences: new Map()
  },
  
  updateContainerName(containerId, newName) {
    const container = this.data.containers.get(containerId);
    if (container) {
      container.name_text = newName;
    }
  },
  
  updateSequenceLabel(sequenceId, newLabel) {
    const sequence = this.data.sequences.get(sequenceId);
    if (sequence) {
      sequence.label_text = newLabel;
    }
  },
  
  getContainerForUpdate(containerId) {
    const container = this.data.containers.get(containerId);
    return container ? {
      entityId: containerId,
      name_text: container.name_text,
      type_text: container.type_text,
      color_hex_text: container.color_hex_text
    } : null;
  }
  // ... other methods
};
```

### Phase 2: Interactive Features (Week 2)

#### Step 2.1: Implement Container Name Editing
- **CSS Classes**: Add `.container-name` class to container headers
- **Double-click Handler**: Trigger inline editing on container names
- **Input Overlay**: Replace text with input field during editing
- **Save Logic**: Dispatch `sequence:container_updated` event
- **UI Update**: Re-render container with new name

#### Step 2.2: Implement Sequence Label Editing  
- **CSS Classes**: Add `.sequence-label` class to sequence labels
- **Double-click Handler**: Trigger inline editing on sequence labels
- **Input Overlay**: Replace label with input field during editing
- **Save Logic**: Dispatch `sequence:sequence_updated` event
- **UI Update**: Re-render sequence with new label

#### Step 2.3: Add Container Creation
- **Toolbar Button**: "Add Container" button functionality
- **Modal/Prompt**: Collect container name and type
- **Event Dispatch**: `sequence:container_added` with container data
- **Optimistic Update**: Add container to local state immediately
- **UI Re-render**: Show new container in diagram

#### Step 2.4: Add Sequence Creation
- **Toolbar Button**: "Add Sequence" button functionality
- **Container Selection**: Choose from/to containers
- **Event Dispatch**: `sequence:sequence_added` with sequence data
- **Optimistic Update**: Add sequence to local state immediately
- **UI Re-render**: Show new sequence arrow in diagram

### Phase 3: Advanced Interactions (Week 3)

#### Step 3.1: Drag-and-Drop Reordering
- **Drag Handles**: Add drag indicators to sequences
- **Drop Zones**: Visual feedback for valid drop locations
- **Order Calculation**: Decimal order indices for positioning
- **Event Dispatch**: `sequence:reorder` with new order data
- **Optimistic Update**: Reorder sequences in local state

#### Step 3.2: Delete Operations
- **Context Menus**: Right-click options for delete
- **Confirmation**: Prevent accidental deletions
- **Cascade Logic**: Handle orphaned sequences when containers deleted
- **Event Dispatch**: `sequence:deleted` events
- **UI Cleanup**: Remove elements from diagram

#### Step 3.3: Bulk Operations
- **Multi-select**: Shift+click for multiple selection
- **Bulk Actions**: Move, delete, or modify multiple items
- **Batch Events**: Single event for multiple changes
- **Performance**: Minimize re-renders during bulk operations

## Bubble Workflow Configuration

### Required Element Events

#### 1. Container Updated Event
```
Trigger: When pending_update is not empty
Condition: pending_update contains "container"
Actions:
- Extract container ID from JSON
- Extract new name from JSON  
- Update Container record
- Clear pending_update
```

#### 2. Sequence Updated Event
```
Trigger: When pending_update is not empty
Condition: pending_update contains "sequence"
Actions:
- Extract sequence ID from JSON
- Extract new label from JSON
- Update Sequence record  
- Clear pending_update
```

#### 3. Container Added Event
```
Trigger: When pending_add is not empty
Condition: pending_add contains "container"
Actions:
- Create new Container record
- Set feature relationship
- Calculate order index
- Clear pending_add
```

#### 4. Sequence Added Event
```
Trigger: When pending_add is not empty  
Condition: pending_add contains "sequence"
Actions:
- Create new Sequence record
- Set container relationships
- Calculate order index
- Clear pending_add
```

## Data Flow Examples

### Container Name Update Flow
```
1. User double-clicks "Auth API" → 
2. Input field appears with current name →
3. User types "Authentication Service" →
4. User presses Enter →
5. Event dispatched: sequence:container_updated →
6. Event bridge publishes to Bubble →
7. Bubble workflow updates database →
8. Plugin re-renders with new name
```

### Sequence Addition Flow
```
1. User clicks "Add Sequence" button →
2. Modal shows container selection →
3. User selects From: User, To: Auth API →
4. User enters label: "Login Request" →
5. Event dispatched: sequence:sequence_added →
6. Optimistic update adds to local state →
7. UI re-renders with new sequence arrow →
8. Bubble workflow creates database record
```

## Error Handling & Edge Cases

### 1. Concurrent Editing
- **Conflict Detection**: Compare timestamps
- **Last-Write-Wins**: Simple conflict resolution
- **User Notification**: Alert on conflicts
- **Refresh Option**: Manual sync button

### 2. Network Failures
- **Retry Logic**: Exponential backoff for failed requests
- **Offline Queue**: Store changes locally when offline
- **Sync Indicator**: Visual feedback for sync status
- **Manual Retry**: User-triggered retry button

### 3. Data Validation
- **Client-side Validation**: Prevent invalid data entry
- **Server-side Validation**: Bubble workflow validation
- **Error Messages**: User-friendly error display
- **Rollback Logic**: Revert on validation failure

## Performance Considerations

### 1. Rendering Optimization
- **Debounced Updates**: Prevent excessive re-renders
- **Partial Updates**: Update only changed elements
- **Virtual Scrolling**: For large diagrams
- **Lazy Loading**: Load sequences on demand

### 2. Memory Management
- **Event Cleanup**: Remove listeners on destroy
- **Data Pruning**: Clear unused cached data
- **Weak References**: Prevent memory leaks
- **Garbage Collection**: Explicit cleanup routines

## Testing Strategy

### 1. Unit Tests
- **Event Dispatching**: Verify correct event data
- **Data Store Operations**: Test CRUD operations
- **Input Validation**: Test edge cases
- **Error Handling**: Test failure scenarios

### 2. Integration Tests
- **Bubble Workflow Integration**: End-to-end testing
- **Multi-user Scenarios**: Concurrent editing tests
- **Performance Tests**: Large diagram handling
- **Browser Compatibility**: Cross-browser testing

## Success Metrics

### 1. Technical Metrics
- **Event Latency**: < 100ms for local updates
- **Sync Time**: < 2 seconds for database sync
- **Error Rate**: < 1% for normal operations
- **Memory Usage**: < 50MB for typical diagrams

### 2. User Experience Metrics
- **Edit Success Rate**: > 95% successful edits
- **User Satisfaction**: Positive feedback on responsiveness
- **Learning Curve**: < 5 minutes to master editing
- **Error Recovery**: < 10 seconds to resolve conflicts

This detailed plan leverages the proven patterns from storymap-grid while adapting them specifically for sequence diagram interactions. The event-driven architecture ensures real-time synchronization between the UI and Bubble database, providing a seamless editing experience.
