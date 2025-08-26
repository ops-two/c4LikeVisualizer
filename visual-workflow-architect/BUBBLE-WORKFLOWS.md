# Bubble Workflows for Visual Workflow Architect Interactivity

This document provides the exact Bubble workflow configurations needed to handle interactive events from the Visual Workflow Architect plugin.

## Required Bubble Workflows

### 1. Container Update Workflow

**Trigger:** Element Event - `container_updated`
**Condition:** `pending_update` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_update
   Find: "entityId":"([^"]*)"
   Replace with: Container ID: $1
   
   Search & Replace in pending_update  
   Find: "newValue":"([^"]*)"
   Replace with: New Name: $1
   ```

2. **Update Container Record:**
   ```
   Make changes to Container (search by unique id = extracted Container ID)
   name_text = extracted New Name
   ```

3. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_update = (empty)
   ```

### 2. Sequence Update Workflow

**Trigger:** Element Event - `sequence_updated`
**Condition:** `pending_update` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_update
   Find: "entityId":"([^"]*)"
   Replace with: Sequence ID: $1
   
   Search & Replace in pending_update
   Find: "newValue":"([^"]*)"
   Replace with: New Label: $1
   ```

2. **Update Sequence Record:**
   ```
   Make changes to Sequence (search by unique id = extracted Sequence ID)
   label_text = extracted New Label
   ```

3. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_update = (empty)
   ```

### 3. Container Creation Workflow

**Trigger:** Element Event - `container_to_be_added`
**Condition:** `pending_add` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_add
   Find: "name_text":"([^"]*)"
   Replace with: Container Name: $1
   
   Search & Replace in pending_add
   Find: "type_text":"([^"]*)"
   Replace with: Container Type: $1
   
   Search & Replace in pending_add
   Find: "color_hex_text":"([^"]*)"
   Replace with: Container Color: $1
   
   Search & Replace in pending_add
   Find: "feature_id":"([^"]*)"
   Replace with: Feature ID: $1
   ```

2. **Create New Container:**
   ```
   Data (Things) > Create a new Container
   name_text = extracted Container Name
   type_text = extracted Container Type
   color_hex_text = extracted Container Color
   feature = Feature (search by unique id = extracted Feature ID)
   order_index_number = Container's count + 1
   ```

3. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_add = (empty)
   ```

### 4. Sequence Creation Workflow

**Trigger:** Element Event - `sequence_to_be_added`
**Condition:** `pending_add` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_add
   Find: "label_text":"([^"]*)"
   Replace with: Sequence Label: $1
   
   Search & Replace in pending_add
   Find: "from_container_id":"([^"]*)"
   Replace with: From Container ID: $1
   
   Search & Replace in pending_add
   Find: "to_container_id":"([^"]*)"
   Replace with: To Container ID: $1
   
   Search & Replace in pending_add
   Find: "feature_id":"([^"]*)"
   Replace with: Feature ID: $1
   
   Search & Replace in pending_add
   Find: "color_hex_text":"([^"]*)"
   Replace with: Sequence Color: $1
   ```

2. **Create New Sequence:**
   ```
   Data (Things) > Create a new Sequence
   label_text = extracted Sequence Label
   from_container = Container (search by unique id = extracted From Container ID)
   to_container = Container (search by unique id = extracted To Container ID)
   feature = Feature (search by unique id = extracted Feature ID)
   color_hex_text = extracted Sequence Color
   is_dashed_boolean = no
   order_index_number = Sequence's count + 1
   ```

3. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_add = (empty)
   ```

### 5. Container Deletion Workflow

**Trigger:** Element Event - `container_to_be_deleted`
**Condition:** `pending_delete` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_delete
   Find: "entityId":"([^"]*)"
   Replace with: Container ID: $1
   ```

2. **Delete Related Sequences:**
   ```
   Data (Things) > Delete a list of Sequences
   List to delete = Search for Sequences (from_container = Container OR to_container = Container)
   ```

3. **Delete Container:**
   ```
   Data (Things) > Delete Container (search by unique id = extracted Container ID)
   ```

4. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_delete = (empty)
   ```

### 6. Sequence Deletion Workflow

**Trigger:** Element Event - `sequence_to_be_deleted`
**Condition:** `pending_delete` is not empty

**Actions:**
1. **Extract Data from JSON:**
   ```
   Search & Replace in pending_delete
   Find: "entityId":"([^"]*)"
   Replace with: Sequence ID: $1
   ```

2. **Delete Sequence:**
   ```
   Data (Things) > Delete Sequence (search by unique id = extracted Sequence ID)
   ```

3. **Clear Pending State:**
   ```
   Element Actions > Set state
   pending_delete = (empty)
   ```

## Plugin Element States

The Visual Workflow Architect plugin element needs these states:

| State Name | Type | Description |
|------------|------|-------------|
| `pending_update` | Text | JSON payload for update operations |
| `pending_add` | Text | JSON payload for creation operations |
| `pending_delete` | Text | JSON payload for deletion operations |

## Event Names

The plugin will trigger these events:

- `container_updated` - When a container name is edited via double-click
- `sequence_updated` - When a sequence label is edited via double-click
- `container_to_be_added` - When a new container is created via toolbar
- `sequence_to_be_added` - When a new sequence is created via toolbar
- `container_to_be_deleted` - When a container is deleted
- `sequence_to_be_deleted` - When a sequence is deleted

## JSON Payload Examples

### Update Payload
```json
{
  "entityType": "container",
  "entityId": "1234567890abcdef",
  "fieldName": "name_text",
  "newValue": "Updated Container Name",
  "oldValue": "Old Container Name",
  "allData": {}
}
```

### Add Container Payload
```json
{
  "entityType": "container",
  "name_text": "New Container",
  "type_text": "Component",
  "color_hex_text": "#3ea50b",
  "feature_id": "feature123",
  "order_index_number": 3
}
```

### Add Sequence Payload
```json
{
  "entityType": "sequence",
  "label_text": "New Sequence",
  "from_container_id": "container1",
  "to_container_id": "container2",
  "feature_id": "feature123",
  "is_dashed_boolean": false,
  "color_hex_text": "#1976d2",
  "order_index_number": 2
}
```

### Delete Payload
```json
{
  "entityType": "container",
  "entityId": "1234567890abcdef",
  "cascadeDelete": true
}
```

### Reorder Payload
```json
{
  "entityType": "container",
  "reorderData": [
    {"entityId": "container1", "order_index_number": 0},
    {"entityId": "container2", "order_index_number": 1},
    {"entityId": "container3", "order_index_number": 2}
  ]
}
```

## Testing the Integration

1. **Double-click on container names** - Should trigger inline editing
2. **Double-click on sequence labels** - Should trigger inline editing  
3. **Click "Add Container" button** - Should prompt for name and create container
4. **Click "Add Sequence" button** - Should prompt for label and create sequence
5. **Check Bubble workflows** - Should see JSON payloads in browser console
6. **Verify database updates** - Changes should persist in Bubble database

## Troubleshooting

- **Events not firing:** Check browser console for JavaScript errors
- **JSON parsing issues:** Verify workflow regex patterns match payload structure
- **Database not updating:** Check workflow conditions and field mappings
- **Infinite loops:** Ensure `data-rendered` flags are working correctly
