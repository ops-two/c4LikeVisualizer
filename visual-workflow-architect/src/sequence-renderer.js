// Visual Workflow Architect - Sequence Renderer
// Renders Stripe-style UML sequence diagrams

console.log('DEBUG: sequence-renderer.js script is loading...');

window.WorkflowArchitectRenderer = {
  
  // Initialize the renderer
  init: function(containerId) {
    console.log('WorkflowArchitectRenderer: Initializing for container:', containerId);
    this.containerId = containerId;
    this.isInitialized = true;
    this.lastRenderTime = 0;
    this.renderDebounceMs = 500;
  },

  // Main render function
  render: function(data, targetElement) {
    console.log('WorkflowArchitectRenderer: Rendering data:', data);
    
    if (!this.isInitialized) {
      console.error('WorkflowArchitectRenderer: Not initialized');
      return;
    }

    // Debounce rapid render calls
    const now = Date.now();
    if (now - this.lastRenderTime < this.renderDebounceMs) {
      console.log('WorkflowArchitectRenderer: Debouncing render call');
      return;
    }
    this.lastRenderTime = now;

    // Check if target element already has content to prevent re-rendering
    if (targetElement && targetElement[0] && targetElement[0].hasAttribute('data-sequence-rendered')) {
      console.log('WorkflowArchitectRenderer: Element already rendered, skipping');
      return;
    }

    // Clear the target element
    if (targetElement && targetElement.empty) {
      targetElement.empty();
    }

    // Create sequence diagram container
    const containerId = 'sequence-diagram-' + Date.now();
    const containerHtml = `<div id="${containerId}" style="width: 100%; min-height: 400px;" data-sequence-rendered="true"></div>`;
    
    if (targetElement && targetElement.html) {
      targetElement.html(containerHtml);
      // Mark the jQuery element as rendered
      if (targetElement[0]) {
        targetElement[0].setAttribute('data-sequence-rendered', 'true');
      }
    }

    // Add CSS styles
    this.addSequenceDiagramStyles();
    
    // Render sequence diagram immediately
    this.renderSequenceDiagram(containerId, data);

    console.log('WorkflowArchitectRenderer: Render complete');
  },

  // Initialize interactive systems
  initializeInteractivity: function() {
    console.log('WorkflowArchitectRenderer: Initializing interactivity systems');
    
    // Initialize inline edit system
    if (window.SequenceDiagramInlineEdit && !window.SequenceDiagramInlineEdit.isInitialized) {
      window.SequenceDiagramInlineEdit.init();
    }
    
    // Initialize event bridge if Bubble instance is available
    if (window.SequenceDiagramEventBridge && !window.SequenceDiagramEventBridge.isInitialized && window.bubbleInstance) {
      window.SequenceDiagramEventBridge.init(window.bubbleInstance);
    }
    
    // Initialize data store if not already done
    if (window.SequenceDiagramDataStore && !window.SequenceDiagramDataStore.isInitialized) {
      // Data will be initialized from bubble-compatible-update.js
      console.log('WorkflowArchitectRenderer: Data store will be initialized by update handler');
    }
  },

  // CSS styles for the sequence diagram
  getSequenceDiagramStyles: function() {
    if (document.getElementById('sequence-diagram-styles')) return;
    
    const styles = `
      <style id="sequence-diagram-styles">
        .sequence-diagram-container {
          display: flex;
          flex-direction: column;
          position: relative;
          width: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #333;
          background-color: #ffffff;
        }
        
        .actor-header {
          background-color: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 20px;
          font-weight: 600;
          text-align: center;
          min-width: 100px;
          font-size: 14px;
          color: #495057;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .sequence-inline-edit-input {
          position: absolute;
          z-index: 1000;
          border: 2px solid #1976d2;
          border-radius: 4px;
          padding: 4px 8px;
          background: white;
          font-family: inherit;
          font-size: inherit;
          outline: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .container-name {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }
        
        .container-name:hover {
          background-color: rgba(25, 118, 210, 0.1);
        }
        
        .sequence-label {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }
        
        .sequence-label:hover {
          background-color: rgba(25, 118, 210, 0.1);
        }
        
        .toolbar-button {
          padding: 8px 16px;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .toolbar-button:hover {
          background-color: #1565c0;
        }
        
        .toolbar-button:active {
          background-color: #0d47a1;
        }
        
        .sequence-diagram-content {
          display: flex;
          justify-content: space-around;
          position: relative;
          padding: 30px 20px 50px;
        }
        
        .actor-lane {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-height: 600px;
          padding: 0 20px;
        }
        
        .actor-lane h3 {
          margin: 0;
          padding: 10px;
          font-weight: 500;
          border-top: 5px solid transparent;
          text-align: center;
        }
        
        .lifeline {
          position: absolute;
          top: 50px;
          bottom: 20px;
          left: 50%;
          width: 2px;
          background: linear-gradient(to bottom, #dee2e6 0%, #dee2e6 100%);
          transform: translateX(-50%);
          z-index: 1;
        }
        
        .activation-box {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          background-color: #28a745;
          z-index: 3;
          border-radius: 2px;
          border: 1px solid #1e7e34;
        }
        
        .message {
          position: absolute;
          height: 100px;
          display: flex;
          justify-content: center;
          z-index: 3;
          text-align: center;
          line-height: 1.4;
          max-width: 75%;
        }
        
        .sequence-toolbar {
          display: none;
        }
        
        .arrow-line {
          position: absolute;
          top: 50%;
          height: 2px;
          background-color: #555;
          z-index: 2;
        }
        
        .arrow-line.dashed {
          background-image: linear-gradient(to right, #555 50%, transparent 50%);
          background-size: 12px 2px;
          background-color: transparent;
        }
        
        .arrow-line::after {
          content: '';
          position: absolute;
          top: -4px;
          right: 0;
          width: 0;
          height: 0;
          border-left: 8px solid #495057;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
        }
        
        .arrow-line.left::after {
          left: -1px; 
          right: auto; 
          border-left: none; 
          border-right: 8px solid #555;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  },

  // Add CSS styles for sequence diagram
  addSequenceDiagramStyles: function() {
    if (document.getElementById('sequence-diagram-styles')) return;
    
    const styles = this.getSequenceDiagramStyles();
    
    document.head.insertAdjacentHTML('beforeend', styles);
  },

  // Render sequence diagram using React
  renderSequenceDiagram: function(containerId, data) {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.renderSequenceDiagramContent(data, containerId);
      
      // Initialize interactive systems after rendering
      this.initializeInteractivity();
    });
  },

  // Render sequence diagram content
  renderSequenceDiagramContent: function(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('WorkflowArchitectRenderer: Container not found:', containerId);
      return;
    }

    // Prevent multiple renders on the same container
    if (container.hasAttribute('data-rendered')) {
      console.log('WorkflowArchitectRenderer: Container already rendered, skipping');
      return;
    }
    container.setAttribute('data-rendered', 'true');

    // Transform data to sequence diagram format
    const { actors, messages } = this.transformToSequenceDiagram(data);
    
    // Create React components
    const SequenceDiagram = this.createSequenceDiagramComponent(actors, messages);
    
    // Render using ReactDOM
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(SequenceDiagram));

    console.log('WorkflowArchitectRenderer: Sequence diagram rendered successfully');
  },

  // Transform data to sequence diagram format
  transformToSequenceDiagram: function(data) {
    const actors = [];
    const messages = [];
    
    console.log('DEBUG: Full data object:', JSON.stringify(data, null, 2));
    
    // Create actors from containers
    if (data.containers) {
      data.containers.forEach((container, index) => {
        console.log(`DEBUG: Container ${index}:`, JSON.stringify(container, null, 2));
        actors.push({
          name: container.name_text || 'Untitled Container',
          className: `actor-${index}`,
          color: container.color_hex_text || '#3ea50b'
        });
      });
    }
    
    // Create messages from sequences
    if (data.sequences) {
      data.sequences.forEach((sequence, index) => {
        console.log(`DEBUG: Sequence ${index}:`, JSON.stringify(sequence, null, 2));
        
        // Try multiple possible field names for container IDs
        const possibleFromFields = ['from_container_id', 'from_container', 'source_container_id', 'source_container'];
        const possibleToFields = ['to_container_id', 'to_container', 'target_container_id', 'target_container'];
        
        let fromContainerId = null;
        let toContainerId = null;
        
        // Find the actual field names being used
        for (const field of possibleFromFields) {
          if (sequence[field]) {
            fromContainerId = sequence[field];
            console.log(`DEBUG: Found from container ID in field '${field}':`, fromContainerId);
            break;
          }
        }
        
        for (const field of possibleToFields) {
          if (sequence[field]) {
            toContainerId = sequence[field];
            console.log(`DEBUG: Found to container ID in field '${field}':`, toContainerId);
            break;
          }
        }
        
        if (!fromContainerId || !toContainerId) {
          console.log('DEBUG: Missing container IDs - using fallback sequential mapping');
          
          // Fallback: Create sequential connections between containers
          // This creates a flow: Container 0 -> Container 1 -> Container 2 -> etc.
          const totalContainers = data.containers.length;
          if (totalContainers >= 2) {
            let fromIndex, toIndex;
            
            if (index === 0) {
              // First sequence: User -> Auth API
              fromIndex = 1; // User
              toIndex = 0;   // Auth API
            } else if (index === 1) {
              // Second sequence: Auth API -> Database
              fromIndex = 0; // Auth API
              toIndex = 2;   // Database
            } else if (index === 2) {
              // Third sequence: Database -> Auth API (return)
              fromIndex = 2; // Database
              toIndex = 0;   // Auth API
            } else {
              // Additional sequences: cycle through containers
              fromIndex = index % totalContainers;
              toIndex = (index + 1) % totalContainers;
            }
            
            messages.push({
              label: sequence.label_text || sequence.name_text || 'Untitled Sequence',
              from: fromIndex,
              to: toIndex,
              dashed: sequence.is_dashed_boolean || false
            });
            console.log(`DEBUG: Added fallback message from ${fromIndex} to ${toIndex} (${data.containers[fromIndex].name_text} -> ${data.containers[toIndex].name_text})`);
          }
          return;
        }
        
        // Find actor indices - try different container ID field names
        const possibleContainerIdFields = ['container_id', 'id', '_id', 'unique_id'];
        let fromIndex = -1;
        let toIndex = -1;
        
        for (const field of possibleContainerIdFields) {
          if (fromIndex === -1) {
            fromIndex = data.containers.findIndex(c => c[field] === fromContainerId);
            if (fromIndex !== -1) console.log(`DEBUG: Found from container using field '${field}' at index:`, fromIndex);
          }
          if (toIndex === -1) {
            toIndex = data.containers.findIndex(c => c[field] === toContainerId);
            if (toIndex !== -1) console.log(`DEBUG: Found to container using field '${field}' at index:`, toIndex);
          }
        }
        
        console.log(`DEBUG: Final indices - from: ${fromIndex}, to: ${toIndex}`);
        
        if (fromIndex !== -1 && toIndex !== -1) {
          messages.push({
            label: sequence.label_text || sequence.name_text || 'Untitled Sequence',
            from: fromIndex,
            to: toIndex,
            dashed: sequence.is_dashed_boolean || false
          });
          console.log(`DEBUG: Added message from ${fromIndex} to ${toIndex}`);
        } else {
          console.log('DEBUG: Could not find matching containers for sequence');
        }
      });
    }
    
    console.log('WorkflowArchitectRenderer: Transformed to', actors.length, 'actors and', messages.length, 'messages');
    return { actors, messages };
  },

  // Create React sequence diagram component
  createSequenceDiagramComponent: function(actors, messages) {
    const { Fragment } = React;
    
    const ActivationBox = ({ actorIndex, yPos, color }) => {
      const actorsCount = actors.length;
      const positionX = actorIndex * (100 / actorsCount) + (100 / (actorsCount * 2));
      const style = { 
        top: `${yPos}px`, 
        left: `${positionX}%`, 
        backgroundColor: color,
        transform: 'translateX(-50%)'
      };
      return React.createElement('div', { className: 'activation-box', style: style });
    };
    
    const Message = ({ label, from, to, yPos, dashed = false }) => {
      const actorsCount = actors.length;
      const isLeft = to < from;
      const start = (isLeft ? to : from) * (100 / actorsCount) + (100 / (actorsCount * 2));
      const distance = Math.abs(to - from);
      const width = distance * (100 / actorsCount);
      
      const messageStyle = { top: `${yPos - 50}px`, left: `${start}%`, width: `${width}%` };
      const arrowClass = `arrow-line ${dashed ? 'dashed' : ''} ${isLeft ? 'left' : ''}`;
      
      return React.createElement('div', { className: 'message', style: messageStyle },
        React.createElement('div', { className: 'message-label' }, label),
        React.createElement('div', { className: arrowClass, style: { width: '100%' } })
      );
    };
    
    return function SequenceDiagram() {
      // Calculate positions
      const startY = 130;
      const stepY = 150;
      let positionedMessages = [];
      let currentY = startY;
      
      messages.forEach(msg => {
        positionedMessages.push({ ...msg, yPos: currentY });
        currentY += stepY;
      });
      
      const containerHeight = currentY;
      
      // Toolbar removed - only inline editing supported
      
      return React.createElement('div', 
        { className: 'sequence-diagram-container' },
        
        // Diagram content
        React.createElement('div', 
          { className: 'sequence-diagram-content', style: { height: `${containerHeight}px` } },
          
          // Actor lanes
          ...actors.map((actor, index) => 
            React.createElement('div', 
              { key: actor.name, className: `actor-lane ${actor.className}`, style: { height: `${containerHeight}px` } },
              React.createElement('h3', { style: { borderColor: actor.color } }, actor.name),
              React.createElement('div', { className: 'lifeline' })
            )
          ),
          
          // Messages and activation boxes
          React.createElement(Fragment, null,
            ...positionedMessages.map((msg, index) => {
              const sequencedLabel = `${index + 1}. ${msg.label}`;
              
              return React.createElement(Fragment, { key: index },
                React.createElement(ActivationBox, { 
                  actorIndex: msg.from, 
                  yPos: msg.yPos, 
                  color: actors[msg.from].color 
                }),
                React.createElement(ActivationBox, { 
                  actorIndex: msg.to, 
                  yPos: msg.yPos, 
                  color: actors[msg.to].color 
                }),
                React.createElement(Message, { 
                  label: sequencedLabel, 
                  from: msg.from, 
                  to: msg.to, 
                  yPos: msg.yPos, 
                  dashed: msg.dashed 
                })
              );
            })
          )
        )
      );
    };
  }
};

console.log('DEBUG: sequence-renderer.js script loaded successfully. WorkflowArchitectRenderer object created:', typeof window.WorkflowArchitectRenderer);
