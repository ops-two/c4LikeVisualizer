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

## Plugin Element States

The Visual Workflow Architect plugin element needs only this state:

| State Name | Type | Description |
|------------|------|-------------|
| `pending_update` | Text | JSON payload for inline edit operations |

## Event Names

The plugin will trigger these events:

- `container_updated` - When a container name is edited via double-click
- `sequence_updated` - When a sequence label is edited via double-click

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
