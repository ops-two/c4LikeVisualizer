function(instance, properties, context) {
    console.log('Visual Workflow Architect: Update function called');
    
    // Check for essential data first
    if (!properties.feature) {
        instance.canvas.html('<div style="padding:20px; border: 2px solid #ffa500; border-radius: 8px; background: #fff8e1; color: #e65100;">No feature selected. Please select a feature in the element properties.</div>');
        return;
    }
    
    try {
        // Clear canvas
        instance.canvas.empty();
        
        console.log('Extracting data from Bubble properties...');
        
        // Feature data
        var featureId = properties.feature.get('_id');
        var featureName = properties.feature.get('name');
        var featureDescription = properties.feature.get('description') || '';
        
        console.log('Feature:', featureId, featureName);
        
        // Container data
        var containerCount = properties.containers ? properties.containers.length() : 0;
        var allContainers = containerCount > 0 ? properties.containers.get(0, containerCount) : [];
        
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
        
        // Sequence data
        var sequenceCount = properties.sequences ? properties.sequences.length() : 0;
        var allSequences = sequenceCount > 0 ? properties.sequences.get(0, sequenceCount) : [];
        
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
        
        console.log('Data extracted - Containers:', containers.length, 'Sequences:', sequences.length);
        
        // Render basic info directly
        var html = '<div style="padding: 20px; font-family: Arial, sans-serif; border: 2px solid #3ea50b; border-radius: 8px; background: #f8f9fa;">' +
            '<h2 style="color: #3ea50b; margin: 0 0 15px 0;">Visual Workflow Architect</h2>' +
            '<p style="margin: 0 0 10px 0; font-weight: bold;">Feature: ' + (featureName || 'Unknown') + '</p>' +
            '<div style="display: flex; gap: 20px; margin-bottom: 15px;">' +
                '<div style="background: #e8f5e8; padding: 10px; border-radius: 4px; text-align: center; min-width: 80px;">' +
                    '<div style="font-size: 24px; font-weight: bold; color: #2e7d32;">' + containers.length + '</div>' +
                    '<div style="font-size: 12px; color: #666;">Containers</div>' +
                '</div>' +
                '<div style="background: #e3f2fd; padding: 10px; border-radius: 4px; text-align: center; min-width: 80px;">' +
                    '<div style="font-size: 24px; font-weight: bold; color: #1976d2;">' + sequences.length + '</div>' +
                    '<div style="font-size: 12px; color: #666;">Sequences</div>' +
                '</div>' +
            '</div>' +
            '<div style="background: #fff3e0; padding: 10px; border-radius: 4px; font-size: 14px; color: #e65100;">' +
                'Plugin loaded successfully. Ready for full renderer integration.' +
            '</div>' +
        '</div>';
        
        instance.canvas.html(html);
        console.log('Basic UI rendered successfully');
        
    } catch (err) {
        console.error('Visual Workflow Architect error:', err);
        instance.canvas.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">Error: ' + err.message + '</div>');
    }
}
