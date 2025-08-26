// Visual Workflow Architect - Sequence Renderer
// Renders sequence diagrams using React Flow

console.log('DEBUG: sequence-renderer.js script is loading...');

window.WorkflowArchitectRenderer = {
  
  // Initialize the renderer
  init: function(containerId) {
    console.log('WorkflowArchitectRenderer: Initializing for container:', containerId);
    this.containerId = containerId;
    this.isInitialized = true;
  },

  // Main render function
  render: function(data, targetElement) {
    console.log('WorkflowArchitectRenderer: Rendering data:', data);
    
    if (!this.isInitialized) {
      console.error('WorkflowArchitectRenderer: Not initialized');
      return;
    }

    // Check if React Flow is available
    if (typeof ReactFlow === 'undefined') {
      console.error('WorkflowArchitectRenderer: React Flow not loaded');
      if (targetElement && targetElement.html) {
        targetElement.html('<div style="padding:20px; color: red;">❌ React Flow library not loaded</div>');
      }
      return;
    }

    // Clear the target element
    if (targetElement && targetElement.empty) {
      targetElement.empty();
    }

    // Create React Flow container
    const containerId = 'reactflow-' + Date.now();
    const containerHtml = `<div id="${containerId}" style="width: 100%; height: 400px; border: 1px solid #ddd;"></div>`;
    
    if (targetElement && targetElement.html) {
      targetElement.html(containerHtml);
    }

    // Transform data to React Flow format
    const { nodes, edges } = this.transformToReactFlow(data);
    
    // Render React Flow
    setTimeout(() => {
      this.renderReactFlow(containerId, nodes, edges);
    }, 100);

    console.log('WorkflowArchitectRenderer: Render complete');
  },

  // Transform containers and sequences to React Flow nodes and edges
  transformToReactFlow: function(data) {
    const nodes = [];
    const edges = [];
    
    // Create container nodes (vertical lines)
    if (data.containers) {
      data.containers.forEach((container, index) => {
        nodes.push({
          id: container.container_id || `container-${index}`,
          type: 'default',
          position: { x: index * 200 + 100, y: 50 },
          data: { 
            label: container.name_text || 'Untitled Container',
            type: container.type_text || 'Component'
          },
          style: {
            background: container.color_hex_text || '#f0f0f0',
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '120px',
            textAlign: 'center'
          }
        });
      });
    }

    // Create sequence edges (horizontal arrows)
    if (data.sequences) {
      data.sequences.forEach((sequence, index) => {
        if (sequence.from_container_id && sequence.to_container_id) {
          edges.push({
            id: sequence.sequence_id || `sequence-${index}`,
            source: sequence.from_container_id,
            target: sequence.to_container_id,
            label: sequence.label_text || 'Untitled Sequence',
            type: sequence.is_dashed_boolean ? 'smoothstep' : 'default',
            style: {
              stroke: sequence.color_hex_text || '#1976d2',
              strokeWidth: 2,
              strokeDasharray: sequence.is_dashed_boolean ? '5,5' : 'none'
            },
            labelStyle: {
              fill: '#333',
              fontWeight: 600
            }
          });
        }
      });
    }

    console.log('WorkflowArchitectRenderer: Transformed to', nodes.length, 'nodes and', edges.length, 'edges');
    return { nodes, edges };
  },

  // Render React Flow diagram
  renderReactFlow: function(containerId, nodes, edges) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('WorkflowArchitectRenderer: Container not found:', containerId);
      return;
    }

    // Create React Flow component
    const ReactFlowComponent = React.createElement(ReactFlow.default, {
      nodes: nodes,
      edges: edges,
      fitView: true,
      attributionPosition: 'bottom-left',
      defaultViewport: { x: 0, y: 0, zoom: 1 },
      minZoom: 0.5,
      maxZoom: 2,
      style: { width: '100%', height: '100%' }
    });

    // Render using ReactDOM
    const root = ReactDOM.createRoot(container);
    root.render(ReactFlowComponent);

    console.log('WorkflowArchitectRenderer: React Flow rendered successfully');
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
