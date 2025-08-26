// WORKING UPDATE FUNCTION - Based on storymap-grid proven patterns
// Copy this EXACT code into your Bubble plugin update function

console.log('Visual Workflow Architect: Update function called');

// 1. Gatekeeper: Ensure the renderer script is loaded
if (typeof window.WorkflowArchitectRenderer === 'undefined') {
    instance.canvas.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">Renderer script not loaded. Check plugin headers.</div>');
    return;
}

// 2. Initialize the Event Bridge if available
if (window.WorkflowArchitectEventBridge) {
    window.WorkflowArchitectEventBridge.init(instance);
}

// 3. Check for essential data
if (!properties.feature) {
    instance.canvas.html('<div style="padding:20px; border: 2px solid #ffa500; border-radius: 8px; background: #fff8e1; color: #e65100;">No feature selected. Please select a feature in the element properties.</div>');
    return;
}

try {
    // 4. Clear the canvas for a fresh render
    instance.canvas.empty();

    // 5. Load all raw data from Bubble
    var projectName = properties.feature.get('name');
    var containerCount = properties.containers ? properties.containers.length() : 0;
    var sequenceCount = properties.sequences ? properties.sequences.length() : 0;
    
    var allContainers = containerCount > 0 ? properties.containers.get(0, containerCount) : [];
    var allSequences = sequenceCount > 0 ? properties.sequences.get(0, sequenceCount) : [];
    
    // Process containers
    var containers = [];
    for (var i = 0; i < allContainers.length; i++) {
        var container = allContainers[i];
        containers.push({
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
        });
    }
    
    // Process sequences
    var sequences = [];
    for (var j = 0; j < allSequences.length; j++) {
        var sequence = allSequences[j];
        sequences.push({
            sequence_id: sequence.get('_id'),
            label_text: sequence.get('Label'),
            description_text: sequence.get('description') || '',
            from_container_id: sequence.get('FromContainer') ? sequence.get('FromContainer').get('_id') : null,
            to_container_id: sequence.get('ToContainer') ? sequence.get('ToContainer').get('_id') : null,
            feature_id: sequence.get('Feature') ? sequence.get('Feature').get('_id') : null,
            sequence_type_name: sequence.get('SequenceType') ? sequence.get('SequenceType').get('name') : '',
            workflow_name: sequence.get('Workflow') ? sequence.get('Workflow').get('Label') : '',
            order_index_number: sequence.get('order_index') || 0,
            is_dashed_boolean: sequence.get('is_dashed') || false,
            color_hex_text: sequence.get('color_hex') || '#1976d2'
        });
    }
    
    console.log('--- Raw Data From Bubble ---');
    console.log('Feature:', projectName);
    console.log('Containers:', containers.length);
    console.log('Sequences:', sequences.length);
    
    // 6. Pass the raw data to the Data Store for transformation
    if (window.WorkflowArchitectDataStore) {
        window.WorkflowArchitectDataStore.init({
            feature: {
                feature_id: properties.feature.get('_id'),
                name_text: projectName,
                description_text: properties.feature.get('description') || ''
            },
            containers: containers,
            sequences: sequences,
            viewMode: properties.view_mode || 'view',
            editPermissions: properties.edit_permissions || false
        });
    }
    
    // 7. Call the renderer
    window.WorkflowArchitectRenderer.render(instance.canvas);

} catch (err) {
    // 8. Handle errors
    if (err.message === 'not ready') {
        instance.canvas.html('<div style="padding:20px; text-align:center; color: #666;">Loading Visual Workflow Architect...</div>');
        throw err;
    }
    console.error('Visual Workflow Architect error:', err);
    instance.canvas.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">Error: ' + err.message + '</div>');
}
