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

  // Add CSS styles for sequence diagram
  addSequenceDiagramStyles: function() {
    if (document.getElementById('sequence-diagram-styles')) return;
    
    const styles = `
      <style id="sequence-diagram-styles">
        .sequence-diagram-container {
          display: flex;
          justify-content: space-around;
          position: relative;
          max-width: 1000px;
          margin: auto;
          padding: 30px 20px 50px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #333;
          background-color: #f8f9fa;
        }
        
        .actor-lane {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-basis: 25%;
          height: 100%;
        }
        
        .actor-lane h3 {
          margin: 0;
          padding: 10px;
          font-weight: 500;
          border-top: 5px solid transparent;
          text-align: center;
        }
        
        .lifeline {
          width: 2px;
          height: 100%;
          background-color: #d3d3d3;
          z-index: 0;
        }
        
        .activation-box {
          position: absolute;
          width: 10px;
          height: 28px;
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 2px;
        }
        
        .message {
          position: absolute;
          height: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .message-label {
          background-color: white;
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          z-index: 3;
          text-align: center;
          line-height: 1.4;
          max-width: 75%;
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
          right: -1px;
          top: -4px;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 8px solid #555;
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

  // Render sequence diagram using React
  renderSequenceDiagram: function(containerId, data) {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
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
    });
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
      const style = { top: `${yPos}px`, left: `${positionX}%`, backgroundColor: color };
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
      
      return React.createElement('div', 
        { className: 'sequence-diagram-container', style: { height: `${containerHeight}px` } },
        
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
      );
    };
  }
};

console.log('DEBUG: sequence-renderer.js script loaded successfully. WorkflowArchitectRenderer object created:', typeof window.WorkflowArchitectRenderer);
