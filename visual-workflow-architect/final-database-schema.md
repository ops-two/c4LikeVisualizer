# Final Database Schema - Container & Sequence Data Types

## Core Data Types for Sequence Diagrams

### 1. Container Data Type (Vertical Lines)
```
Container:
- name (text) - Display name for the container
- type (text) - "Component" or "Persona"
- feature (Feature) - Parent feature relationship
- component_url (text) - Optional URL for components
- description (text) - Optional description
- x_position (number) - Horizontal position in diagram
- order_index (number) - Display order
- color_hex (text) - Container color (default: #3ea50b)
- created_date (date)
- modified_date (date)
```

### 2. Sequence Data Type (Horizontal Arrows)
```
Sequence:
- label (text) - Display text on arrow
- description (text) - Optional detailed description
- from_container (Container) - Source container
- to_container (Container) - Target container
- feature (Feature) - Parent feature relationship
- action_type (text) - "API Call", "User Action", "Data Flow", etc.
- order_index (number) - Sequence order within feature
- is_dashed (yes/no) - Dashed line style
- workflow_group (text) - Optional grouping identifier
- color_hex (text) - Arrow color (default: #1976d2)
- created_date (date)
- modified_date (date)
```

### 3. Feature Data Type (Existing - Minimal Updates)
```
Feature:
- name (text) - existing
- description (text) - existing or add if missing
- project (Project) - existing parent relationship
- created_date (date) - add if missing
- modified_date (date) - add if missing
```

## Sequence Diagram Structure

### Visual Layout
```
Container 1    Container 2    Container 3
    |              |              |
    |-- Sequence 1 -->            |
    |              |-- Sequence 2 -->
    |<-- Sequence 3 --|          |
```

### Data Relationships
- **Feature** (1) → **Containers** (many)
- **Feature** (1) → **Sequences** (many)
- **Sequence** belongs to **from_container** and **to_container**

### Example Data
```
Feature: "User Authentication"

Containers:
- Container 1: name="User", type="Persona", x_position=100
- Container 2: name="Auth API", type="Component", x_position=300
- Container 3: name="Database", type="Component", x_position=500

Sequences:
- Sequence 1: label="Login Request", from_container=User, to_container=Auth API
- Sequence 2: label="Validate Credentials", from_container=Auth API, to_container=Database
- Sequence 3: label="Auth Token", from_container=Auth API, to_container=User
```

## Plugin Integration

### Required Properties
```javascript
feature (Feature) - Single feature to display
containers (Container list) - All containers for this feature
sequences (Sequence list) - All sequences for this feature
view_mode (text) - "edit" or "view"
edit_permissions (yes/no) - User can edit diagram
```

### Key Events
```javascript
container_added - New container created
container_updated - Container modified
container_deleted - Container removed
sequence_added - New sequence created
sequence_updated - Sequence modified
sequence_deleted - Sequence removed
diagram_layout_changed - Positions updated
```

### Data Flow
1. Plugin receives feature + related containers + sequences
2. Renders vertical lines for containers at x_positions
3. Renders horizontal arrows for sequences between containers
4. Handles drag/drop for repositioning
5. Triggers events for database updates

This schema supports the sequence diagram functionality while keeping the data structure clean and focused on the core visual elements.
