# Bubble Implementation Guide - Visual Workflow Architect Plugin (Using Existing Data Types)

## Step 1: Database Setup - Minimal Changes

### Use Existing Container Data Type

**DO NOT create new Container data type** - use your existing one.

**Add only these 3 fields to existing Container:**
| Field Name | Field Type | Optional | Notes |
|------------|------------|----------|-------|
| x_position | number | Yes | Horizontal position (default: 0) |
| order_index | number | Yes | Display order (default: 0) |
| color_hex | text | Yes | Color (default: #3ea50b) |

**Existing fields that will be used:**

- `name` → Container display name
- `feature` → Parent relationship
- `Persona` → For type="Persona" containers
- `ToolType` → For type="Component" containers
- `url` → Component URL
- `externalcomponentid` → External reference

### Use Existing Sequence Data Type

**DO NOT create new Sequence data type** - use your existing one.

**Add only these 3 fields to existing Sequence:**
| Field Name | Field Type | Optional | Notes |
|------------|------------|----------|-------|
| description | text | Yes | Detailed description |
| is_dashed | yes/no | Yes | Dashed line style (default: no) |
| color_hex | text | Yes | Arrow color (default: #1976d2) |

**Existing fields that will be used:**

- `Label` → Sequence display text
- `Feature` → Parent relationship
- `FromContainer` → Source container
- `ToContainer` → Target container
- `SequenceType` → Action type
- `Workflow` → Grouping
- `order_index` → Sequence order (if exists)

### Update Feature Data Type (if needed)

Add these fields if missing:

- `description` (text, optional)

## Step 2: Create Bubble Plugin

### Plugin Creation

1. Go to **Plugins** → **Add plugins** → **Build a new plugin**
2. Plugin configuration:
   - **Name**: Visual Workflow Architect
   - **Description**: Interactive sequence diagrams for features
   - **Category**: Productivity
   - **Subcategory**: Business Tools

### Create Plugin Element

1. Click **"Add a new element"**
2. Element configuration:
   - **Element name**: `SequenceDiagram`
   - **Element type**: Visual elements
   - **Display as**: Block element

### Element Fields

Add these fields:

| Field Name       | Editor Type Optional                  | List | Description |
| ---------------- | ------------------------------------- | ---- | ----------- | ------------------------------------ |
| feature          | Dynamic value (any thing with fields) | No   | No          | Feature to display                   |
| containers       | Dynamic value (any thing with fields) | Yes  | Yes         | Containers for this feature          |
| sequences        | Dynamic value (any thing with fields) | Yes  | Yes         | Sequences for this feature           |
| view_mode        | Dropdown                              | Yes  | No          | Options: "edit,view" (default: view) |
| edit_permissions | Checkbox                              | Yes  | No          | User can edit (default: no)          |

### Element Events

Add these events:

| Event Name             | Description           |
| ---------------------- | --------------------- |
| container_added        | New container created |
| container_updated      | Container modified    |
| container_deleted      | Container removed     |
| sequence_added         | New sequence created  |
| sequence_updated       | Sequence modified     |
| sequence_deleted       | Sequence removed      |
| diagram_layout_changed | Positions updated     |

### Element States

Add these exposed states:

| State Name | Type | Description |
|------------|------|-------------|
| pending_update | text | JSON payload for updates |
| current_view | text | Current view state |
| is_loading | yes/no | Loading indicator |
| selected_container_id | text | ID of currently selected container |
| selected_sequence_id | text | ID of currently selected sequence | |

## Step 3: Plugin Code Setup

### Headers Section

Copy this into the **Headers** section:

```html
<!-- React Flow and dependencies -->
<script
  src="https://unpkg.com/react@18/umd/react.development.js"
  crossorigin
></script>
<script
  src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
  crossorigin
></script>
<script
  src="https://unpkg.com/reactflow@11/dist/umd/index.js"
  crossorigin
></script>

<!-- D3.js for SVG manipulation -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Plugin styles -->
<style>
  .sequence-diagram-container {
    width: 100%;
    height: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #fafafa;
    position: relative;
    overflow: auto;
  }

  .container-line {
    stroke: #333;
    stroke-width: 2;
  }

  .container-label {
    font-family: Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    text-anchor: middle;
    fill: #333;
  }

  .sequence-arrow {
    stroke-width: 2;
    fill: none;
    marker-end: url(#arrowhead);
  }

  .sequence-label {
    font-family: Arial, sans-serif;
    font-size: 11px;
    text-anchor: middle;
    fill: #333;
    background: white;
    padding: 2px 4px;
  }

  .dashed-line {
    stroke-dasharray: 5, 5;
  }
</style>
```

### Initialize Function

```javascript
function(instance, context) {
    // Initialize plugin state
    instance.data = {
        isInitialized: false,
        lastLoadTime: null,
        currentFeatureId: null,
        containers: [],
        sequences: []
    };

    // Clear any existing content
    instance.canvas.empty();

    // Create main container
    instance.canvas.append('<div class="sequence-diagram-container" id="sequence-diagram-' + instance.data.id + '"></div>');

    // Mark as initialized
    instance.data.isInitialized = true;

    console.log('SequenceDiagram plugin initialized');
}
```

### Update Function

Copy the entire content from `plugin-files/update.txt` into the **Update** section.

## Step 4: Create Test Data

### Create Sample Feature

1. Go to **Data** → **App data** → **Feature**
2. Click **"New entry"**
3. Set:
   - **name**: "User Authentication"
   - **description**: "Login and authentication flow"
   - **project**: (select existing project)

### Create Sample Containers

Create 3 containers for the feature:

**Container 1:**

- **name**: "User"
- **type**: "Persona"
- **feature**: User Authentication (select the feature you created)
- **x_position**: 100
- **order_index**: 1
- **color_hex**: #4CAF50

**Container 2:**

- **name**: "Auth API"
- **type**: "Component"
- **feature**: User Authentication
- **x_position**: 300
- **order_index**: 2
- **color_hex**: #2196F3

**Container 3:**

- **name**: "Database"
- **type**: "Component"
- **feature**: User Authentication
- **x_position**: 500
- **order_index**: 3
- **color_hex**: #FF9800

### Create Sample Sequences

Create 3 sequences connecting the containers:

**Sequence 1:**

- **label**: "Login Request"
- **from_container**: User
- **to_container**: Auth API
- **feature**: User Authentication
- **action_type**: "User Action"
- **order_index**: 1

**Sequence 2:**

- **label**: "Validate Credentials"
- **from_container**: Auth API
- **to_container**: Database
- **feature**: User Authentication
- **action_type**: "API Call"
- **order_index**: 2

**Sequence 3:**

- **label**: "Auth Token"
- **from_container**: Auth API
- **to_container**: User
- **feature**: User Authentication
- **action_type**: "API Response"
- **order_index**: 3

## Step 5: Create Test Page

### Add Plugin Element to Page

1. Create a new page or use existing page
2. Drag **SequenceDiagram** element from plugin section
3. Set element size: **800px width**, **600px height**

### Configure Element Properties

Set these properties on the SequenceDiagram element:

- **feature**: Search for Features → select "User Authentication"
- **containers**: Search for Containers → constraint: feature = User Authentication
- **sequences**: Search for Sequences → constraint: feature = User Authentication
- **view_mode**: "edit"
- **edit_permissions**: yes

### Create Workflows for Events

Create workflows to handle plugin events:

**Container Updated Workflow:**

1. **Trigger**: SequenceDiagram container_updated
2. **Actions**:
   - Parse pending_update state as JSON
   - Make changes to Container (search by \_id)
   - Update relevant fields

**Sequence Updated Workflow:**

1. **Trigger**: SequenceDiagram sequence_updated
2. **Actions**:
   - Parse pending_update state as JSON
   - Make changes to Sequence (search by \_id)
   - Update relevant fields

## Step 6: Testing Steps

### Initial Test

1. **Preview** your page
2. Check browser **Developer Console** (F12)
3. Look for initialization messages
4. Verify the sequence diagram displays

### Debug Checklist

- [ ] All CDN scripts load successfully
- [ ] Feature data is retrieved correctly
- [ ] Containers display as vertical lines
- [ ] Sequences display as horizontal arrows
- [ ] No JavaScript errors in console

### Expected Visual Output

You should see:

- 3 vertical lines labeled "User", "Auth API", "Database"
- 3 horizontal arrows connecting them with labels
- Clean SVG-based diagram layout

### Common Issues & Solutions

**Plugin Not Loading:**

- Check CDN URLs are accessible
- Verify all dependencies load in correct order
- Check browser console for errors

**Data Not Displaying:**

- Verify database relationships are correct
- Check property configurations match field names
- Use console.log to debug data structure

**Visual Issues:**

- Check CSS styles are applied
- Verify SVG elements are created
- Check container positions and sequence paths

This guide provides everything needed to implement and test the Visual Workflow Architect plugin in Bubble with Container and Sequence data types.
