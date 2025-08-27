// Visual Workflow Architect - React Flow Renderer
// Modern React Flow implementation for sequence diagrams
// Replaces the HTML-based sequence renderer with proper React Flow components

console.log('DEBUG: react-flow-renderer.js script is loading...');

window.ReactFlowSequenceRenderer = {
  // Initialize the renderer
  init: function(containerId) {
    console.log('ReactFlowSequenceRenderer: Initializing for container:', containerId);
    this.containerId = containerId;
    this.isInitialized = true;
    return true;
  },

  // Main render function
  render: function(data, targetElement) {
    console.log('ReactFlowSequenceRenderer: Rendering with React Flow', data);
    
    if (!window.ReactFlow) {
      console.error('ReactFlowSequenceRenderer: React Flow library not loaded');
      if (targetElement && targetElement.html) {
        targetElement.html('<div style="padding:20px; color: red;">React Flow library not loaded. Check plugin headers.</div>');
      }
      return;
    }

    // Create container for React Flow
    const containerId = "react-flow-container";
    const containerHtml = `<div id="${containerId}" style="width: 100%; height: 600px; border: 1px solid #e0e0e0; border-radius: 8px;"></div>`;
    
    if (targetElement && targetElement.html) {
      targetElement.html(containerHtml);
    }

    // Transform data to React Flow format
    const { nodes, edges } = this.transformToReactFlow(data);
    
    // Render React Flow diagram
    this.renderReactFlowDiagram(containerId, nodes, edges, data);
  },

  // Transform data to React Flow nodes and edges
  transformToReactFlow: function(data) {
    const nodes = [];
    const edges = [];
    
    // Create container nodes (vertical lifelines)
    if (data.containers && data.containers.length > 0) {
      data.containers.forEach((container, index) => {
        const xPosition = (index + 1) * 200; // Space containers 200px apart
        
        nodes.push({
          id: container.container_id || container.id || `container_${index}`,
          type: 'containerNode',
          position: { x: xPosition, y: 50 },
          data: {
            label: container.name_text || container.name || 'Untitled Container',
            type: container.type_text || 'Component',
            color: container.color_hex_text || '#3ea50b',
            containerId: container.container_id || container.id
          },
          draggable: false
        });
      });
    }

    // Create sequence edges (horizontal arrows)
    if (data.sequences && data.sequences.length > 0) {
      data.sequences.forEach((sequence, index) => {
        const fromContainerId = sequence.from_container_id;
        const toContainerId = sequence.to_container_id;
        
        if (fromContainerId && toContainerId) {
          edges.push({
            id: sequence.sequence_id || sequence.id || `sequence_${index}`,
            source: fromContainerId,
            target: toContainerId,
            type: 'sequenceEdge',
            data: {
              label: sequence.label_text || sequence.label || 'Untitled Sequence',
              isDashed: sequence.is_dashed_boolean || false,
              color: sequence.color_hex_text || '#1976d2',
              sequenceNumber: index + 1
            },
            animated: false,
            style: {
              stroke: sequence.color_hex_text || '#1976d2',
              strokeWidth: 2,
              strokeDasharray: sequence.is_dashed_boolean ? '5,5' : 'none'
            }
          });
        }
      });
    }

    console.log('ReactFlowSequenceRenderer: Created', nodes.length, 'nodes and', edges.length, 'edges');
    return { nodes, edges };
  },

  // Render React Flow diagram
  renderReactFlowDiagram: function(containerId, nodes, edges, originalData) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('ReactFlowSequenceRenderer: Container not found:', containerId);
      return;
    }

    // Custom node types
    const nodeTypes = {
      containerNode: this.createContainerNode()
    };

    // Custom edge types  
    const edgeTypes = {
      sequenceEdge: this.createSequenceEdge()
    };

    // Create React Flow component
    const FlowComponent = () => {
      const [flowNodes, setNodes] = React.useState(nodes);
      const [flowEdges, setEdges] = React.useState(edges);

      // Handle node drag end for reordering
      const onNodeDragStop = React.useCallback((event, node) => {
        console.log('Node drag stopped:', node);
        
        // Get all container nodes and sort by x position
        const containerNodes = nodes.filter(n => n.type === 'container');
        const sortedNodes = [...containerNodes].sort((a, b) => a.position.x - b.position.x);
        
        // Find the new order index for the dragged node
        const draggedNodeIndex = sortedNodes.findIndex(n => n.id === node.id);
        
        if (draggedNodeIndex !== -1) {
          // Dispatch reorder event
          const containerId = node.id.replace('container-', '');
          const newOrderIndex = draggedNodeIndex;
          
          console.log(`Reordering container ${containerId} to position ${newOrderIndex}`);
          
          // Use sequence event bridge for reordering
          if (window.SequenceDiagramEventBridge) {
            window.SequenceDiagramEventBridge.handleContainerReorder(containerId, newOrderIndex);
          }
        }
      }, [nodes]);

      // Handle edge updates
      const onEdgesChange = React.useCallback((changes) => {
        console.log('Edges changed:', changes);
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }, []);

      const onConnect = React.useCallback((connection) => {
        console.log('New connection:', connection);
        
        // Create new sequence when connecting nodes
        const fromContainerId = connection.source.replace('container-', '');
        const toContainerId = connection.target.replace('container-', '');
        
        if (window.SequenceDiagramEventBridge) {
          window.SequenceDiagramEventBridge.handleSequenceAdd(
            `New Sequence`,
            fromContainerId,
            toContainerId
          );
        }
        
        setEdges((eds) => addEdge(connection, eds));
      }, []);

      // Toolbar handlers
      const handleAddContainer = () => {
        console.log('Add Container clicked');
        
        const featureId = document.querySelector('[data-feature-id]')?.getAttribute('data-feature-id');
        
        if (window.SequenceDiagramEventBridge) {
          window.SequenceDiagramEventBridge.dispatchContainerAdd(
            'New Container',
            'Component', 
            '#3ea50b',
            featureId,
            null
          );
        }
      };

      const handleAddSequence = () => {
        console.log('Add Sequence clicked');
        
        if (flowNodes.length < 2) {
          alert('Need at least 2 containers to create a sequence');
          return;
        }

        const featureId = document.querySelector('[data-feature-id]')?.getAttribute('data-feature-id');
        
        if (window.SequenceDiagramEventBridge) {
          window.SequenceDiagramEventBridge.dispatchSequenceAdd(
            'New Sequence',
            flowNodes[0].id,
            flowNodes[1].id,
            featureId,
            false,
            '#1976d2',
            null
          );
        }
      };

      return React.createElement(
        'div',
        { style: { width: '100%', height: '100%' } },
        
        // Toolbar
        React.createElement(
          'div',
          { 
            style: { 
              padding: '10px', 
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              gap: '10px',
              backgroundColor: '#f8f9fa'
            } 
          },
          React.createElement(
            'button',
            {
              onClick: handleAddContainer,
              style: {
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            },
            '+ Add Container'
          ),
          React.createElement(
            'button',
            {
              onClick: handleAddSequence,
              style: {
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            },
            '+ Add Sequence'
          )
        ),

        // React Flow
        React.createElement(
          'div',
          { style: { height: 'calc(100% - 60px)' } },
          React.createElement(window.ReactFlow.default, {
            nodes: flowNodes,
            edges: flowEdges,
            nodeTypes: nodeTypes,
            edgeTypes: edgeTypes,
            fitView: true,
            attributionPosition: 'bottom-left',
            nodesDraggable: false,
            nodesConnectable: false,
            elementsSelectable: true,
            minZoom: 0.5,
            maxZoom: 2
          })
        )
      );
    };

    // Render the component
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(FlowComponent));
    
    console.log('ReactFlowSequenceRenderer: React Flow diagram rendered successfully');
  },

  // Create custom container node component
  createContainerNode: function() {
    return ({ data }) => {
      const handleNameEdit = (e) => {
        if (e.key === 'Enter') {
          const newName = e.target.value;
          console.log('Container name changed to:', newName);
          
          if (window.SequenceDiagramEventBridge) {
            window.SequenceDiagramEventBridge.dispatchContainerUpdate(
              data.containerId,
              newName,
              data.label,
              data
            );
          }
        }
      };

      return React.createElement(
        'div',
        {
          style: {
            padding: '10px',
            border: `3px solid ${data.color}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            minWidth: '120px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }
        },
        React.createElement(
          'div',
          {
            style: {
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '4px',
              color: data.color
            }
          },
          data.type
        ),
        React.createElement('input', {
          type: 'text',
          defaultValue: data.label,
          onKeyPress: handleNameEdit,
          style: {
            border: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize: '12px',
            width: '100%',
            outline: 'none'
          }
        }),
        React.createElement(
          'div',
          {
            style: {
              width: '2px',
              height: '400px',
              backgroundColor: data.color,
              margin: '10px auto 0',
              opacity: 0.6
            }
          }
        )
      );
    };
  },

  // Create custom sequence edge component
  createSequenceEdge: function() {
    return ({ data, sourceX, sourceY, targetX, targetY }) => {
      const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      
      return React.createElement(
        'g',
        null,
        React.createElement('path', {
          d: edgePath,
          stroke: data.color,
          strokeWidth: 2,
          strokeDasharray: data.isDashed ? '5,5' : 'none',
          markerEnd: 'url(#arrowhead)'
        }),
        React.createElement(
          'text',
          {
            x: (sourceX + targetX) / 2,
            y: (sourceY + targetY) / 2 - 10,
            textAnchor: 'middle',
            fontSize: '12px',
            fill: '#333'
          },
          `${data.sequenceNumber}. ${data.label}`
        )
      );
    };
  }
};

console.log('DEBUG: react-flow-renderer.js script loaded successfully. ReactFlowSequenceRenderer object created:', typeof window.ReactFlowSequenceRenderer);
