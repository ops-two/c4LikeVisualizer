// Visual Workflow Architect - Proper Sequence Diagram Renderer
// Based on SequenceFlow.html structure using React + CSS positioning (NOT React Flow)

console.log('DEBUG: sequence-diagram-renderer.js script is loading...');

window.SequenceDiagramRenderer = {
  // Initialize the renderer
  init: function(containerId) {
    console.log('SequenceDiagramRenderer: Initializing for container:', containerId);
    this.containerId = containerId;
    this.isInitialized = true;
    return true;
  },

  // Step 1: Add CSS styles to document
  addStyles: function() {
    const styleId = 'sequence-diagram-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .diagram-container {
        display: flex;
        justify-content: space-around;
        position: relative;
        max-width: 1000px;
        margin: auto;
        padding-top: 30px;
        padding-bottom: 50px;
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
        left: -1px; right: auto; border-left: none; border-right: 8px solid #555;
      }

      .self-message {
        position: absolute;
        z-index: 3;
        display: flex;
        align-items: center;
      }

      .self-message-path {
        position: relative;
        width: 70px;
        height: 100%;
      }
      
      .self-message-path-top,
      .self-message-path-bottom,
      .self-message-path-vertical {
        position: absolute;
        background-color: #555;
      }

      .self-message-path-top {
        width: 100%; height: 2px; top: 0; left: 1px;
      }

      .self-message-path-top::after {
        content: ''; position: absolute; right: -1px; top: -4px; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid #555;
      }

      .self-message-path-vertical {
        width: 2px; height: 100%; top: 0; left: 71px;
      }

      .self-message-path-bottom {
        width: 100%; height: 2px; bottom: 0; left: 1px;
      }

      .self-message-path-bottom::after {
        content: ''; position: absolute; left: -1px; top: -4px; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-right: 8px solid #555;
      }
    `;
    document.head.appendChild(style);
  },

  // Step 2: Create ActivationBox component
  createActivationBox: function() {
    return function ActivationBox({ actorIndex, yPos, color, actorsCount }) {
      const positionX = actorIndex * (100 / actorsCount) + (100 / (actorsCount * 2));
      const style = { 
        top: `${yPos}px`, 
        left: `${positionX}%`, 
        backgroundColor: color,
        position: 'absolute',
        width: '10px',
        height: '28px',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        borderRadius: '2px'
      };
      return React.createElement('div', { className: 'activation-box', style: style });
    };
  },

  // Step 3: Create Message component
  createMessage: function() {
    return function Message({ label, from, to, yPos, dashed = false, actorsCount }) {
      const isLeft = to < from;
      const start = (isLeft ? to : from) * (100 / actorsCount) + (100 / (actorsCount * 2));
      const distance = Math.abs(to - from);
      const width = distance * (100 / actorsCount);
      
      const maxWidthPercentage = distance === 1 ? 75 : 90;
      const labelStyle = { maxWidth: `${maxWidthPercentage}%` };

      const messageStyle = { 
        top: `${yPos - 50}px`, 
        left: `${start}%`, 
        width: `${width}%`,
        position: 'absolute',
        height: '100px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      };
      
      const arrowClass = `arrow-line ${dashed ? 'dashed' : ''} ${isLeft ? 'left' : ''}`;
      
      return React.createElement('div', { className: 'message', style: messageStyle }, [
        React.createElement('div', { 
          key: 'label',
          className: 'message-label', 
          style: labelStyle
        }, label),
        React.createElement('div', { 
          key: 'arrow',
          className: arrowClass, 
          style: { width: '100%' }
        })
      ]);
    };
  },

  // Step 4: Create SelfMessage component
  createSelfMessage: function() {
    return function SelfMessage({ label, actorIndex, yPos, height, actorsCount }) {
      const position = actorIndex * (100 / actorsCount) + (100 / (actorsCount * 2));
      const style = { 
        top: `${yPos}px`, 
        left: `${position}%`, 
        height: `${height}px`,
        position: 'absolute',
        zIndex: 3,
        display: 'flex',
        alignItems: 'center'
      };
      
      return React.createElement('div', { className: 'self-message', style: style }, [
        React.createElement('div', { 
          key: 'path',
          className: 'self-message-path'
        }, [
          React.createElement('div', { key: 'top', className: 'self-message-path-top' }),
          React.createElement('div', { key: 'vertical', className: 'self-message-path-vertical' }),
          React.createElement('div', { key: 'bottom', className: 'self-message-path-bottom' })
        ]),
        React.createElement('div', { 
          key: 'label',
          className: 'message-label', 
          style: { marginLeft: '10px' }
        }, label)
      ]);
    };
  },

  // Step 5: Main render function
  render: function(data, targetElement) {
    console.log('SequenceDiagramRenderer: Rendering proper sequence diagram', data);
    
    // Add CSS styles
    this.addStyles();
    
    // Initialize data store if available
    if (window.WorkflowArchitectDataStore && !window.WorkflowArchitectDataStore.data.isInitialized) {
      console.log('SequenceDiagramRenderer: Initializing data store');
      window.WorkflowArchitectDataStore.init(data);
    }

    // Get containers and sequences from data store or use provided data
    let containers, sequences;
    if (window.WorkflowArchitectDataStore && window.WorkflowArchitectDataStore.data.isInitialized) {
      containers = window.WorkflowArchitectDataStore.getContainersArray();
      sequences = window.WorkflowArchitectDataStore.getSequencesArray();
    } else {
      containers = data.containers || [];
      sequences = data.sequences || [];
    }
    
    console.log('SequenceDiagramRenderer: Using containers:', containers.length, 'sequences:', sequences.length);

    // Create actor data from containers
    const actors = containers.map(container => ({
      name: container.name || container.name_text || 'Container',
      className: (container.type || container.type_text || 'component').toLowerCase().replace(/\s+/g, '-'),
      color: container.colorHex || container.color_hex_text || '#3ea50b',
      id: container.id || container.container_id
    }));

    // Create message data from sequences
    const messages = sequences.map((sequence, index) => {
      const fromIndex = actors.findIndex(a => a.id === (sequence.fromContainerId || sequence.from_container_id));
      const toIndex = actors.findIndex(a => a.id === (sequence.toContainerId || sequence.to_container_id));
      
      return {
        label: sequence.label || sequence.label_text || 'Sequence',
        from: fromIndex,
        to: toIndex,
        dashed: sequence.isDashed || sequence.is_dashed_boolean || false,
        self: fromIndex === toIndex
      };
    }).filter(msg => msg.from >= 0 && msg.to >= 0);

    const actorsCount = actors.length;

    // Pre-calculate Y positions
    const startY = 130;
    const stepY = 150;
    let positionedMessages = [];
    let currentY = startY;

    messages.forEach(msg => {
      positionedMessages.push({ ...msg, yPos: currentY });
      currentY += msg.self ? stepY * 1.2 : stepY;
    });
    
    const containerHeight = currentY;

    // Create components
    const ActivationBox = this.createActivationBox();
    const Message = this.createMessage();
    const SelfMessage = this.createSelfMessage();

    // Main sequence diagram component
    const SequenceDiagram = () => {
      return React.createElement('div', {
        className: 'diagram-container',
        style: { height: `${containerHeight}px` }
      }, [
        // Actor lanes
        ...actors.map(actor => 
          React.createElement('div', {
            key: actor.name,
            className: `actor-lane ${actor.className}`,
            style: { height: `${containerHeight}px` }
          }, [
            React.createElement('h3', {
              key: 'title',
              style: { borderTopColor: actor.color }
            }, actor.name),
            React.createElement('div', {
              key: 'lifeline',
              className: 'lifeline'
            })
          ])
        ),
        
        // Messages and activation boxes
        React.createElement(React.Fragment, { key: 'messages' },
          positionedMessages.map((msg, index) => {
            const sequencedLabel = `${index + 1}. ${msg.label}`;
            
            if (msg.self) {
              const loopHeight = stepY * 0.8;
              return React.createElement(React.Fragment, { key: index }, [
                React.createElement(ActivationBox, {
                  key: `activation-start-${index}`,
                  actorIndex: msg.from,
                  yPos: msg.yPos,
                  color: actors[msg.from].color,
                  actorsCount: actorsCount
                }),
                React.createElement(ActivationBox, {
                  key: `activation-end-${index}`,
                  actorIndex: msg.from,
                  yPos: msg.yPos + loopHeight,
                  color: actors[msg.from].color,
                  actorsCount: actorsCount
                }),
                React.createElement(SelfMessage, {
                  key: `self-message-${index}`,
                  label: sequencedLabel,
                  actorIndex: msg.from,
                  yPos: msg.yPos,
                  height: loopHeight,
                  actorsCount: actorsCount
                })
              ]);
            } else {
              return React.createElement(React.Fragment, { key: index }, [
                React.createElement(ActivationBox, {
                  key: `activation-from-${index}`,
                  actorIndex: msg.from,
                  yPos: msg.yPos,
                  color: actors[msg.from].color,
                  actorsCount: actorsCount
                }),
                React.createElement(ActivationBox, {
                  key: `activation-to-${index}`,
                  actorIndex: msg.to,
                  yPos: msg.yPos,
                  color: actors[msg.to].color,
                  actorsCount: actorsCount
                }),
                React.createElement(Message, {
                  key: `message-${index}`,
                  label: sequencedLabel,
                  from: msg.from,
                  to: msg.to,
                  yPos: msg.yPos,
                  dashed: !!msg.dashed,
                  actorsCount: actorsCount
                })
              ]);
            }
          })
        )
      ]);
    };

    // Render to target element
    try {
      const container = targetElement[0] || targetElement;
      if (container) {
        const reactRoot = window.ReactDOM.createRoot ? 
          window.ReactDOM.createRoot(container) : 
          null;
          
        if (reactRoot) {
          reactRoot.render(React.createElement(SequenceDiagram));
        } else {
          window.ReactDOM.render(React.createElement(SequenceDiagram), container);
        }
        
        console.log('SequenceDiagramRenderer: Successfully rendered sequence diagram');
      } else {
        console.error('SequenceDiagramRenderer: Target container not found');
      }
    } catch (error) {
      console.error('SequenceDiagramRenderer: Render error:', error);
      if (targetElement && targetElement.html) {
        targetElement.html('<div style="padding:20px; color: red;">Render error: ' + error.message + '</div>');
      }
    }
  }
};

// Create alias for backward compatibility
window.WorkflowArchitectRenderer = window.SequenceDiagramRenderer;

console.log('DEBUG: sequence-diagram-renderer.js script loaded successfully. SequenceDiagramRenderer object created:', typeof window.SequenceDiagramRenderer);
console.log('DEBUG: WorkflowArchitectRenderer alias created:', typeof window.WorkflowArchitectRenderer);
