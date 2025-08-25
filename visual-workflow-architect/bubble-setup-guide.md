# Bubble Plugin Setup Guide - Visual Workflow Architect

## Step 1: Database Setup

### Create Missing Data Types

**1. Container (New Data Type)**
```
Type name: Container
Fields:
- name (text)
- type (text) 
- feature (Feature)
- component_url (text)
- description (text)
- order_index (number)
- color_hex (text)
```

**2. Update Sequence (Add Missing Fields)**
```
Add to existing Sequence type:
- description (text)
- action_type (text)
- is_dashed (yes/no)
```

**3. Update Workflow (Add Missing Fields)**
```
Add to existing Workflow type:
- feature (Feature)
- description (text)
- color_hex (text)
- order_index (number)
```

**4. Update Feature (Add Missing Fields)**
```
Add to existing Feature type:
- description (text)
- workspace (Workspace) - if not already linked
```

## Step 2: Create Bubble Plugin

### Plugin Creation Steps

1. **Go to Plugins Tab**
   - In your Bubble editor, click "Plugins" in left sidebar
   - Click "Add plugins" → "Build a new plugin"

2. **Plugin Configuration**
   ```
   Plugin name: Visual Workflow Architect
   Description: Interactive workflow diagrams with C4-inspired hierarchical views
   Category: Productivity
   Subcategory: Business Tools
   ```

3. **Create Plugin Element**
   - Click "Add a new element"
   - Element name: `WorkflowArchitect`
   - Element type: `Visual elements`

### Element Properties Setup

Add these properties to your plugin element:

```javascript
// Required Properties
feature (Feature) - The feature to visualize
containers (Container list) - All containers for this feature  
sequences (Sequence list) - All sequences for this feature
workflows (Workflow list) - All workflows for this feature

// Optional Properties  
view_mode (text) - "sequence", "container", or "context"
edit_mode (yes/no) - Enable/disable editing
```

### Element Events Setup

Add these events to handle updates:

```javascript
// Update Events
container_updated - Triggered when container is modified
sequence_updated - Triggered when sequence is modified  
workflow_updated - Triggered when workflow is modified
container_added - Triggered when new container is created
sequence_added - Triggered when new sequence is created
workflow_added - Triggered when new workflow is created
container_deleted - Triggered when container is removed
sequence_deleted - Triggered when sequence is removed
workflow_deleted - Triggered when workflow is removed
```

### Element States Setup

Add these custom states:

```javascript
pending_update (text) - JSON payload for database updates
current_view (text) - Current view mode
is_loading (yes/no) - Loading state indicator
```

## Step 3: Plugin Code Setup

### Headers Section
Copy content from `plugin-files/headers.txt`:

```html
<!-- React Flow and dependencies -->
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/reactflow@11/dist/umd/index.js" crossorigin></script>

<!-- Plugin core files via jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/gh/your-org/visual-workflow-architect@main/src/data-store.js"></script>
<script src="https://cdn.jsdelivr.net/gh/your-org/visual-workflow-architect@main/src/event-bridge.js"></script>

<!-- Plugin styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/your-org/visual-workflow-architect@main/styles/main.css">
```

### Initialize Function
```javascript
function(instance, context) {
    // Initialize plugin state
    instance.data = {
        isInitialized: false,
        lastLoadTime: null,
        currentFeatureId: null
    };
    
    // Clear any existing content
    instance.canvas.empty();
    
    // Mark as initialized
    instance.data.isInitialized = true;
}
```

### Update Function
Copy the corrected update function from `plugin-files/update.txt` (the version with proper Bubble property access patterns).

## Step 4: Workflow Setup

### Database Workflows

Create these workflows to handle plugin events:

**1. Container Updated Workflow**
```
Trigger: WorkflowArchitect container_updated event
Actions:
- Parse pending_update state as JSON
- Make changes to Container (search by _id from JSON)
- Update fields: name, type, component_url, description, order_index, color_hex
```

**2. Sequence Updated Workflow**
```
Trigger: WorkflowArchitect sequence_updated event  
Actions:
- Parse pending_update state as JSON
- Make changes to Sequence (search by _id from JSON)
- Update fields: Label, description, FromContainer, ToContainer, action_type, Workflow, order_index, is_dashed
```

**3. Workflow Updated Workflow**
```
Trigger: WorkflowArchitect workflow_updated event
Actions:
- Parse pending_update state as JSON
- Make changes to Workflow (search by _id from JSON)
- Update fields: Label, description, feature, color_hex, order_index
```

**4. Add Entity Workflows**
```
Container Added:
- Create new Container with data from pending_update JSON
- Set tempId → real _id mapping

Sequence Added:
- Create new Sequence with data from pending_update JSON
- Set tempId → real _id mapping

Workflow Added:
- Create new Workflow with data from pending_update JSON
- Set tempId → real _id mapping
```

## Step 5: Page Setup

### Create Test Page

1. **Add Plugin Element**
   - Drag WorkflowArchitect element to page
   - Set fixed size: 800px width, 600px height

2. **Configure Properties**
   ```
   feature: Current page's Feature (or search for specific feature)
   containers: Search for Containers (feature = this feature)
   sequences: Search for Sequences (feature = this feature) 
   workflows: Search for Workflows (feature = this feature)
   view_mode: "sequence"
   edit_mode: yes
   ```

3. **Add Sample Data**
   Create test records:
   - 1 Feature
   - 3-4 Containers (mix of Components and Personas)
   - 5-6 Sequences connecting the containers
   - 2 Workflows grouping the sequences

## Step 6: Testing Steps

### Initial Test
1. Preview your page
2. Check browser console for initialization messages
3. Verify plugin displays feature data correctly
4. Test basic interactions

### Debug Common Issues

**Plugin Not Loading:**
- Check CDN URLs in headers
- Verify all dependencies load successfully
- Check browser console for JavaScript errors

**Data Not Displaying:**
- Verify database relationships are correct
- Check property configurations match field names
- Use browser console to inspect data structure

**Events Not Triggering:**
- Verify workflow triggers match event names exactly
- Check custom state parsing in workflows
- Test with simple console.log actions first

## Step 7: CDN Deployment

### GitHub Setup
1. Create GitHub repository: `visual-workflow-architect`
2. Upload plugin files to repository
3. Get commit hash for CDN URLs

### Update Headers
Replace `COMMIT_HASH` in headers.txt with actual commit hash:
```
https://cdn.jsdelivr.net/gh/your-org/visual-workflow-architect@abc123/src/data-store.js
```

## Troubleshooting

### Common Bubble Property Access Errors

**Wrong:** `properties.feature_id`
**Correct:** `properties.feature.get('_id')`

**Wrong:** `properties.containers[0].name`  
**Correct:** `properties.containers.get(0, 1)[0].get('name')`

### Data Structure Validation

Add this debug code to update function:
```javascript
console.log('Feature:', properties.feature.get('name'));
console.log('Container count:', properties.containers ? properties.containers.length() : 0);
console.log('Sequence count:', properties.sequences ? properties.sequences.length() : 0);
console.log('Workflow count:', properties.workflows ? properties.workflows.length() : 0);
```

This guide provides everything needed to test the Visual Workflow Architect plugin in your Bubble environment.
