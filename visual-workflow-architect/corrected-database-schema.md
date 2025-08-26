# Corrected Database Schema - Based on August 25 Meeting

## Core Architecture Changes

### 1. Feature Data Type (Update Existing)
```
Feature:
- name (text)
- description (text) 
- project (Project) - parent relationship
- diagram_data (text) - JSON string of visual diagram
- connectivity_data (text) - JSON string of lightweight connections
- created_date (date)
- modified_date (date)
```

### 2. Remove Container Data Type
**IMPORTANT**: Do NOT create Container data type. Containers are part of the diagram JSON, not separate database entities.

### 3. Workflow Data Type (Simplified)
```
Workflow:
- name (text)
- description (text)
- feature (Feature) - parent relationship
- color_hex (text)
- order_index (number)
- workflow_data (text) - JSON for workflow-specific sequences
```

### 4. Sequence Data Type (Update Existing)
```
Sequence:
- label (text)
- description (text)
- from_container (text) - container name/ID within diagram
- to_container (text) - container name/ID within diagram
- workflow (Workflow) - parent workflow group
- action_type (text)
- order_index (number)
- is_dashed (yes/no)
```

## Key Architectural Principles

### Single Diagram Per Feature
- Each Feature has exactly ONE diagram
- Diagram contains multiple containers (vertical lines)
- Containers are stored as JSON within diagram_data, not as separate records

### Data Storage Strategy
```json
// diagram_data example
{
  "containers": [
    {"id": "c1", "name": "User", "type": "Persona", "x": 100, "y": 50},
    {"id": "c2", "name": "API", "type": "Component", "x": 300, "y": 50}
  ],
  "sequences": [
    {"id": "s1", "from": "c1", "to": "c2", "label": "Login Request", "workflow": "auth"}
  ],
  "workflows": [
    {"id": "auth", "name": "Authentication", "color": "#e3f2fd"}
  ]
}
```

```json
// connectivity_data example (lightweight)
{
  "nodes": ["User", "API", "Database"],
  "edges": [
    {"from": "User", "to": "API"},
    {"from": "API", "to": "Database"}
  ]
}
```

## UI Hierarchy

### Workspace Level
- **Purpose**: Bird's-eye view of all projects and features
- **Data Source**: All projects in workspace → all features in projects
- **Display**: Graph/network view showing project boxes containing feature nodes

### Project Level  
- **Purpose**: List of features within project
- **Data Source**: Features where project = current project
- **Display**: Card layout with feature name + description

### Feature Level
- **Purpose**: Detailed diagram editing and viewing
- **Data Source**: Single feature's diagram_data
- **Display**: Tabs with full-width sequence diagram

## Plugin Architecture Changes

### Properties Required
```javascript
// For Feature Detail View
feature (Feature) - Single feature to display
view_mode (text) - "edit" or "view"
edit_permissions (yes/no) - User can edit

// For Workspace Overview  
workspace (Workspace) - For bird's-eye view
projects (Project list) - All projects in workspace

// For Project Feature List
project (Project) - For feature list view
features (Feature list) - Features in project
```

### Events Required
```javascript
diagram_updated - When diagram_data changes
connectivity_updated - When connectivity_data changes
feature_selected - When user clicks feature in overview
container_added - When new container added to diagram
sequence_added - When new sequence added
workflow_created - When new workflow group created
```

## Critical Corrections to Previous Response

### What I Got Wrong:
1. **Container as separate data type** - Should be JSON within diagram
2. **Multiple diagrams per feature** - Each feature has exactly one
3. **Complex property structure** - Simplified to single feature focus
4. **Missing workspace overview** - Critical bird's-eye view missing
5. **Incorrect workflow relationship** - Workflows are groups within diagram

### What You Actually Need:
1. **Single diagram per feature** with JSON storage
2. **Three-level hierarchy**: Workspace → Project → Feature
3. **Two data formats**: Visual + connectivity JSON
4. **Tab-based feature details** with full-width diagrams
5. **Story map CSS consistency**

This corrected schema aligns with your August 25 meeting discussion and the actual requirements for the Visual Workflow Architect plugin.
