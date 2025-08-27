// BUBBLE-COMPATIBLE INITIALIZE FUNCTION
// Stores data in DOM attributes since Bubble clears instance.data

(function(instance, context) {
    console.log('=== INITIALIZE: Visual Workflow Architect Starting ===');
    
    // Generate unique ID for this instance
    var uniqueId = 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Clear any existing content
    instance.canvas.empty();
    console.log('INITIALIZE: Canvas cleared');

    // Create main container with data attributes to store state
    var containerHtml = '<div class="sequence-diagram-container" ' +
        'id="sequence-diagram-' + uniqueId + '" ' +
        'data-plugin-id="' + uniqueId + '" ' +
        'data-initialized="true" ' +
        'data-last-load="' + new Date().toISOString() + '" ' +
        'style="min-height: 200px; border: 1px dashed #ccc; padding: 20px; text-align: center; color: #666; overflow-x: auto; overflow-y: auto;">' +
        'Waiting for data...</div>';
    
    instance.canvas.append(containerHtml);
    console.log('INITIALIZE: Container created with ID: sequence-diagram-' + uniqueId);
    
    // Also store in instance.data (even though Bubble might clear it)
    instance.data = {
        id: uniqueId,
        isInitialized: true,
        lastLoadTime: new Date(),
        currentFeatureId: null,
        containers: [],
        sequences: []
    };

    console.log('INITIALIZE: Plugin initialized successfully. Data stored in DOM attributes.');
    console.log('INITIALIZE: Update function will be called next.');
})
