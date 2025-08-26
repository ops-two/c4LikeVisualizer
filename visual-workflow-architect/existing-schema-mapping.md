# Using Existing Data Types - Field Mapping Guide

## Container Data Type (Use Existing)

### Current Fields → Plugin Usage
| Existing Field | Plugin Usage | Notes |
|----------------|--------------|-------|
| name | ✅ Container name | Perfect - use as-is |
| feature | ✅ Parent relationship | Perfect - use as-is |
| Persona | ✅ Use for type="Persona" | Map to persona relationship |
| ToolType | ✅ Use for type="Component" | Map to tooltype relationship |
| url | ✅ component_url | Perfect - use as-is |
| externalcomponentid | ❓ Optional | Can use for external references |

### Missing Fields (Add These)
| Field Name | Type | Optional | Purpose |
|------------|------|----------|---------|
| x_position | number | Yes | Horizontal position in diagram |
| order_index | number | Yes | Display order |
| color_hex | text | Yes | Container color |

## Sequence Data Type (Use Existing)

### Current Fields → Plugin Usage
| Existing Field | Plugin Usage | Notes |
|----------------|--------------|-------|
| Label | ✅ Sequence label | Perfect - use as-is |
| Feature | ✅ Parent relationship | Perfect - use as-is |
| FromContainer | ✅ Source container | Perfect - use as-is |
| ToContainer | ✅ Target container | Perfect - use as-is |
| order_index | ✅ Sequence order | Perfect - use as-is |
| SequenceType | ✅ sequence_type | Relationship to SequenceType data type |
| Workflow | ✅ Workflow grouping | Perfect - use as-is |

### Missing Fields (Add These)
| Field Name | Type | Optional | Purpose |
|------------|------|----------|---------|
| description | text | Yes | Detailed description |
| is_dashed | yes/no | Yes | Dashed line style |
| color_hex | text | Yes | Arrow color |

## Minimal Database Changes Required

### Container Data Type - Add 3 Fields Only
```
x_position (number, optional) - Default: 0
order_index (number, optional) - Default: 0  
color_hex (text, optional) - Default: #3ea50b
```

### Sequence Data Type - Add 3 Fields Only
```
description (text, optional)
is_dashed (yes/no, optional) - Default: no
color_hex (text, optional) - Default: #1976d2
```

## Plugin Property Configuration

### Use These Existing Relationships
```javascript
feature (Feature) - Single feature to display
containers (Container list) - Search: feature = this feature
sequences (Sequence list) - Search: feature = this feature
```

### Container Type Logic
```javascript
// In plugin code, determine container type:
if (container.get('Persona')) {
    containerType = 'Persona';
    containerName = container.get('Persona').get('name');
} else if (container.get('ToolType')) {
    containerType = 'Component';  
    containerName = container.get('ToolType').get('name');
} else {
    containerType = 'Component';
    containerName = container.get('name');
}
```

## Updated Plugin Code Mapping

### Field Access Pattern
```javascript
// Container data mapping
const containers = allContainers.map(container => ({
    container_id: container.get('_id'),
    name_text: container.get('name'),
    type_text: container.get('Persona') ? 'Persona' : 'Component',
    persona_name: container.get('Persona') ? container.get('Persona').get('name') : null,
    tooltype_name: container.get('ToolType') ? container.get('ToolType').get('name') : null,
    feature_id: container.get('feature') ? container.get('feature').get('_id') : null,
    component_url_text: container.get('url') || '',
    external_id: container.get('externalcomponentid') || '',
    x_position_number: container.get('x_position') || 0,
    order_index_number: container.get('order_index') || 0,
    color_hex_text: container.get('color_hex') || '#3ea50b'
}));

// Sequence data mapping  
const sequences = allSequences.map(sequence => ({
    sequence_id: sequence.get('_id'),
    label_text: sequence.get('Label'),
    description_text: sequence.get('description') || '',
    from_container_id: sequence.get('FromContainer') ? sequence.get('FromContainer').get('_id') : null,
    to_container_id: sequence.get('ToContainer') ? sequence.get('ToContainer').get('_id') : null,
    feature_id: sequence.get('Feature') ? sequence.get('Feature').get('_id') : null,
    action_type_text: sequence.get('SequenceType') ? sequence.get('SequenceType').get('name') : 'Data Flow',
    workflow_name: sequence.get('Workflow') ? sequence.get('Workflow').get('Label') : '',
    order_index_number: sequence.get('order_index') || 0,
    is_dashed_boolean: sequence.get('is_dashed') || false,
    color_hex_text: sequence.get('color_hex') || '#1976d2'
}));
```

This approach reuses your existing data structure with minimal changes - just 6 additional fields total across both data types.
