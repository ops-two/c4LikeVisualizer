// BUBBLE-COMPATIBLE UPDATE FUNCTION
// Reads data from DOM attributes since Bubble clears instance.data

function(instance, properties, context) {
    console.log('=== UPDATE: Visual Workflow Architect Starting ===');
    console.log('UPDATE: Instance data from Bubble:', instance.data);
    
    // Find the container by looking for our plugin container
    var containerElement = instance.canvas.find('.sequence-diagram-container[data-plugin-id]');
    
    if (containerElement.length === 0) {
        console.log('UPDATE: No initialized container found, plugin may not be initialized');
        instance.canvas.html('<div style="padding:20px; color: red;">Plugin container not found. Initialize function may have failed.</div>');
        return;
    }
    
    // Get data from DOM attributes
    var pluginId = containerElement.attr('data-plugin-id');
    var isInitialized = containerElement.attr('data-initialized') === 'true';
    
    console.log('UPDATE: Found container with plugin ID:', pluginId);
    console.log('UPDATE: Container initialized:', isInitialized);
    
    if (!isInitialized) {
        console.log('UPDATE: Container not properly initialized');
        containerElement.html('<div style="padding:20px; color: red;">Container not properly initialized</div>');
        return;
    }
    
    // 1. Check if renderer script is loaded
    console.log('UPDATE: Checking for WorkflowArchitectRenderer...');
    if (typeof window.WorkflowArchitectRenderer === 'undefined') {
        console.log('UPDATE: Renderer script not loaded');
        containerElement.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">🚨 RENDERER SCRIPT NOT LOADED<br>Check plugin headers for sequence-renderer.js</div>');
        return;
    }
    
    // 2. Check if data store script is loaded
    console.log('UPDATE: Checking for WorkflowArchitectDataStore...');
    if (typeof window.WorkflowArchitectDataStore === 'undefined') {
        console.log('UPDATE: Data store script not loaded');
        containerElement.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">🚨 DATA STORE SCRIPT NOT LOADED<br>Check plugin headers for data-store.js</div>');
        return;
    }
    
    // 2.5. Debug: Check what renderer functions are available
    console.log('UPDATE: WorkflowArchitectRenderer type:', typeof window.WorkflowArchitectRenderer);
    console.log('UPDATE: WorkflowArchitectRenderer object:', window.WorkflowArchitectRenderer);
    if (window.WorkflowArchitectRenderer) {
        console.log('UPDATE: Available renderer methods:', Object.keys(window.WorkflowArchitectRenderer));
    }
    
    // 3. Initialize event bridges if available
    if (window.WorkflowArchitectEventBridge) {
        window.WorkflowArchitectEventBridge.init(instance);
        console.log('UPDATE: WorkflowArchitectEventBridge initialized');
    }
    
    if (window.SequenceDiagramEventBridge) {
        window.SequenceDiagramEventBridge.init(instance);
        console.log('UPDATE: SequenceDiagramEventBridge initialized');
    }
    
    // 4. Show success if all scripts loaded but no feature selected
    if (!properties.feature) {
        console.log('UPDATE: No feature selected');
        containerElement.html('<div style="padding:20px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; color: #2e7d32;"><h3>🎉 ALL SCRIPTS LOADED SUCCESSFULLY!</h3><p>✅ Initialize function worked<br>✅ Update function is working<br>✅ Data store script loaded<br>✅ Renderer script loaded<br>' + (typeof window.WorkflowArchitectEventBridge !== 'undefined' ? '✅ Event bridge script loaded' : '⚠️ Event bridge script missing') + '</p><p><strong>Next step:</strong> Select a feature in the element properties</p><p>Plugin ID: ' + pluginId + '</p></div>');
        return;
    }
    
    try {
        console.log('UPDATE: Processing feature data...');
        
        // Extract feature data - using correct field name from database schema
        var projectName = properties.feature.get('name_text') || properties.feature.get('name') || 'Untitled Feature';
        
        var containerCount = properties.containers ? properties.containers.length() : 0;
        var sequenceCount = properties.sequences ? properties.sequences.length() : 0;
        
        console.log('UPDATE: Feature:', projectName, 'Containers:', containerCount, 'Sequences:', sequenceCount);
        console.log('UPDATE: Feature object keys:', Object.keys(properties.feature._data || {}));
        
        var allContainers = containerCount > 0 ? properties.containers.get(0, containerCount) : [];
        var allSequences = sequenceCount > 0 ? properties.sequences.get(0, sequenceCount) : [];
        
        // Process containers - using correct field names from database schema
        var containers = [];
        for (var i = 0; i < allContainers.length; i++) {
            var container = allContainers[i];
            containers.push({
                container_id: container.get('_id'),
                name_text: container.get('name_text') || container.get('name'), // Try both field names
                type_text: container.get('Persona') ? 'Persona' : 'Component',
                persona_name: container.get('Persona') ? container.get('Persona').get('name') : null,
                tooltype_name: container.get('type') ? container.get('type').get('name') : null, // Fixed: 'type' not 'ToolType'
                feature_id: container.get('feature') ? container.get('feature').get('_id') : null,
                component_url_text: container.get('url') || '',
                external_id: container.get('externalcomponentid') || '',
                x_position_number: container.get('x_position') || 0,
                order_index_number: container.get('order_index') || 0,
                color_hex_text: container.get('color_hex') || '#3ea50b'
            });
        }
        
        // Process sequences - using correct field names from database schema
        var sequences = [];
        for (var j = 0; j < allSequences.length; j++) {
            var sequence = allSequences[j];
            sequences.push({
                sequence_id: sequence.get('_id'),
                label_text: sequence.get('Label') || sequence.get('label_text') || sequence.get('label'), // Try multiple field names
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
        
        console.log('UPDATE: Processed', containers.length, 'containers and', sequences.length, 'sequences');
        
        // Initialize data store
        var bubbleData = {
            feature: {
                feature_id: properties.feature.get('_id'),
                name_text: projectName,
                description_text: properties.feature.get('description') || 
                                 properties.feature.get('description_text') || 
                                 properties.feature.get('Description') || ''
            },
            containers: containers,
            sequences: sequences,
            viewMode: properties.view_mode || 'view',
            editPermissions: properties.edit_permissions || false
        };
        
        // Initialize sequence data store with bubble data
        if (window.SequenceDiagramDataStore && !window.SequenceDiagramDataStore.isInitialized) {
            console.log('UPDATE: Initializing sequence data store...');
            window.SequenceDiagramDataStore.init(bubbleData.feature, containers, sequences);
        }
        
        // Store bubble instance globally for event bridge
        window.bubbleInstance = instance;
        
        // Store feature ID in DOM for persistence
        containerElement.attr('data-feature-id', properties.feature.get('_id'));
        
        // Check if already rendered to prevent infinite loop
        if (containerElement.attr('data-diagram-rendered') === 'true') {
            console.log('UPDATE: Diagram already rendered, skipping to prevent infinite loop');
            return;
        }
        
        // Initialize renderer
        console.log('UPDATE: Initializing renderer...');
        window.WorkflowArchitectRenderer.init(pluginId);
        
        // Mark as rendered BEFORE calling render to prevent loops
        containerElement.attr('data-diagram-rendered', 'true');
        
        // Call renderer with data and target element
        console.log('UPDATE: Calling renderer...');
        window.WorkflowArchitectRenderer.render({
            feature: { name: projectName },
            containers: containers,
            sequences: sequences
        }, containerElement);
        console.log('UPDATE: Renderer completed successfully');
        
        console.log('=== UPDATE: Completed successfully ===');

    } catch (err) {
        console.error('UPDATE: Error occurred:', err);
        
        if (err.message === 'not ready') {
            console.log('UPDATE: Bubble not ready, showing loading message');
            containerElement.html('<div style="padding:20px; text-align:center; color: #666;">🔄 Loading Visual Workflow Architect...</div>');
            throw err;
        }
        
        containerElement.html('<div style="padding:20px; border: 2px solid #ff4444; border-radius: 8px; background: #fff5f5; color: #cc0000;">🚨 ERROR<br>' + err.message + '<br><small>Check console for details</small></div>');
    }
}
