// Visual Workflow Architect - Sequence Renderer
// Renders Stripe-style UML sequence diagrams

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

    // Clear the target element
    if (targetElement && targetElement.empty) {
      targetElement.empty();
    }

    // Create sequence diagram container
    const containerId = 'sequence-diagram-' + Date.now();
    const containerHtml = `<div id="${containerId}" style="width: 100%; min-height: 400px;"></div>`;
    
    if (targetElement && targetElement.html) {
      targetElement.html(containerHtml);
    }

    // Add CSS styles
    this.addSequenceDiagramStyles();
    
    // Render sequence diagram
    setTimeout(() => {
      this.renderSequenceDiagram(containerId, data);
    }, 100);

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
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('WorkflowArchitectRenderer: Container not found:', containerId);
      return;
    }

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
    
    // Create actors from containers
    if (data.containers) {
      data.containers.forEach((container, index) => {
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
        // Find actor indices
        const fromIndex = data.containers.findIndex(c => c.container_id === sequence.from_container_id);
        const toIndex = data.containers.findIndex(c => c.container_id === sequence.to_container_id);
        
        if (fromIndex !== -1 && toIndex !== -1) {
          messages.push({
            label: sequence.label_text || 'Untitled Sequence',
            from: fromIndex,
            to: toIndex,
            dashed: sequence.is_dashed_boolean || false
          });
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
