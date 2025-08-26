// Visual Workflow Architect - Sequence Renderer
// Based on proven storymap-grid patterns

console.log('DEBUG: sequence-renderer.js script is loading...');

window.WorkflowArchitectRenderer = {
  render: function(containerElement) {
    console.log('WorkflowArchitectRenderer: Starting render');
    
    // Check if data store is initialized
    if (!window.WorkflowArchitectDataStore || !window.WorkflowArchitectDataStore.data.isInitialized) {
      containerElement.html('<div style="padding: 20px; color: #666;">Data store not initialized</div>');
      return;
    }
    
    // Get data from store
    const feature = window.WorkflowArchitectDataStore.getFeature();
    const containers = window.WorkflowArchitectDataStore.getContainersArray();
    const sequences = window.WorkflowArchitectDataStore.getSequencesArray();
    
    console.log('WorkflowArchitectRenderer: Rendering data', {
      feature: feature,
      containers: containers.length,
      sequences: sequences.length
    });
    
    // Basic sequence diagram HTML
    const html = '<div class="sequence-diagram-container" style="padding: 20px; font-family: Arial, sans-serif; border: 2px solid #3ea50b; border-radius: 8px; background: #f8f9fa;">' +
      '<h2 style="color: #3ea50b; margin: 0 0 15px 0;">🎯 ' + (feature ? feature.name : 'Visual Workflow Architect') + '</h2>' +
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
      '<div style="background: #e8f5e8; padding: 15px; border-radius: 4px; margin-top: 15px;">' +
        '<h3 style="margin: 0 0 10px 0; color: #2e7d32;">Containers:</h3>' +
        this.renderContainersList(containers) +
      '</div>' +
      '<div style="background: #e3f2fd; padding: 15px; border-radius: 4px; margin-top: 15px;">' +
        '<h3 style="margin: 0 0 10px 0; color: #1976d2;">Sequences:</h3>' +
        this.renderSequencesList(sequences) +
      '</div>' +
    '</div>';
    
    containerElement.html(html);
    console.log('WorkflowArchitectRenderer: Render complete');
  },
  
  renderContainersList: function(containers) {
    if (containers.length === 0) {
      return '<p style="margin: 0; color: #666; font-style: italic;">No containers defined</p>';
    }
    
    var html = '<ul style="margin: 0; padding-left: 20px;">';
    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      html += '<li style="margin-bottom: 5px;">' +
        '<strong>' + container.name + '</strong> ' +
        '<span style="background: ' + container.colorHex + '; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">' + container.type + '</span>' +
      '</li>';
    }
    html += '</ul>';
    return html;
  },
  
  renderSequencesList: function(sequences) {
    if (sequences.length === 0) {
      return '<p style="margin: 0; color: #666; font-style: italic;">No sequences defined</p>';
    }
    
    var html = '<ul style="margin: 0; padding-left: 20px;">';
    for (var i = 0; i < sequences.length; i++) {
      var sequence = sequences[i];
      html += '<li style="margin-bottom: 5px;">' +
        '<strong>' + sequence.label + '</strong>' +
        (sequence.description ? '<br><span style="color: #666; font-size: 12px;">' + sequence.description + '</span>' : '') +
      '</li>';
    }
    html += '</ul>';
    return html;
  }
};

console.log('DEBUG: sequence-renderer.js script loaded successfully. WorkflowArchitectRenderer object created:', typeof window.WorkflowArchitectRenderer);
