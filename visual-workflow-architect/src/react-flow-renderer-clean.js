// Visual Workflow Architect - Proper Sequence Diagram Renderer
// Based on SequenceFlow.html structure using React + CSS positioning (NOT React Flow)

console.log("DEBUG: react-flow-renderer-clean.js script is loading...");

// Add rerender event listener (following storymap-grid pattern)
document.addEventListener('workflow-architect:rerender', function(event) {
  console.log('RERENDER: Event received with data:', event.detail);
  
  // Find the container and re-render
  const container = document.getElementById('sequence-diagram-container');
  console.log('RERENDER: Container found:', !!container);
  console.log('RERENDER: SequenceDiagramRenderer available:', !!window.SequenceDiagramRenderer);
  
  if (container && window.SequenceDiagramRenderer) {
    // Clear existing content
    container.innerHTML = '';
    console.log('RERENDER: Container cleared, calling render...');
    
    // Re-render with new data
    window.SequenceDiagramRenderer.render(container, event.detail);
    console.log('RERENDER: UI re-rendered successfully');
  } else {
    console.warn('RERENDER: Container or renderer not found for rerender');
  }
});

// Import inline editing functionality from legacy reference
window.InlineEditSystem = {
  currentEdit: null,

  // Initialize inline editing for sequence diagram elements
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Double-click editing for container names and sequence labels
    document.addEventListener("dblclick", (e) => {
      if (e.target.classList.contains("container-name")) {
        e.preventDefault();
        e.stopPropagation();
        this.startEdit(e.target, "container");
      } else if (e.target.classList.contains("sequence-label")) {
        e.preventDefault();
        e.stopPropagation();
        this.startEdit(e.target, "sequence");
      }
    });

    // Click outside to save
    document.addEventListener("click", (e) => {
      if (this.currentEdit && !this.currentEdit.input.contains(e.target)) {
        this.saveEdit();
      }
    });
  },

  startEdit(element, entityType) {
    if (this.currentEdit) this.cancelEdit();

    const entityId = element.dataset[entityType + "Id"];
    if (!entityId) return;

    const currentText = element.textContent.trim();
    this.createEditInput(element, currentText, entityType, entityId);
  },

  createEditInput(element, currentText, entityType, entityId) {
    this.currentEdit = {
      element,
      originalText: currentText,
      entityType,
      entityId,
      input: null,
    };

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "sequence-inline-edit-input";

    // Position input over element
    const rect = element.getBoundingClientRect();
    input.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${Math.max(rect.width, 100)}px;
      height: ${rect.height}px;
      font-size: inherit;
      font-family: inherit;
      background: white;
      border: 2px solid #1976d2;
      border-radius: 4px;
      padding: 4px 8px;
      z-index: 1000;
      outline: none;
    `;

    // Event handlers
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => this.currentEdit && this.saveEdit(), 100);
    });

    element.style.visibility = "hidden";
    document.body.appendChild(input);
    this.currentEdit.input = input;

    input.focus();
    input.select();
  },

  saveEdit() {
    if (!this.currentEdit) return;

    const newText = this.currentEdit.input.value.trim();
    const oldText = this.currentEdit.originalText;

    if (newText !== oldText && newText.length > 0) {
      this.currentEdit.element.textContent = newText;

      // Dispatch update event to event bridge
      if (this.currentEdit.entityType === "container") {
        this.dispatchContainerUpdate(
          this.currentEdit.entityId,
          newText,
          oldText
        );
      } else if (this.currentEdit.entityType === "sequence") {
        this.dispatchSequenceUpdate(
          this.currentEdit.entityId,
          newText,
          oldText
        );
      }
    }

    this.cleanupEdit();
  },

  cancelEdit() {
    this.cleanupEdit();
  },

  cleanupEdit() {
    if (!this.currentEdit) return;

    this.currentEdit.element.style.visibility = "visible";
    if (this.currentEdit.input && this.currentEdit.input.parentNode) {
      this.currentEdit.input.parentNode.removeChild(this.currentEdit.input);
    }
    this.currentEdit = null;
  },

  dispatchContainerUpdate(containerId, newName, oldName) {
    if (window.WorkflowArchitectEventBridge) {
      window.WorkflowArchitectEventBridge.handleContainerUpdate(containerId, {
        name: newName,
      });
    }
  },

  dispatchSequenceUpdate(sequenceId, newLabel, oldLabel) {
    if (window.WorkflowArchitectEventBridge) {
      window.WorkflowArchitectEventBridge.handleSequenceUpdate(sequenceId, {
        label: newLabel,
      });
    }
  },
};

window.SequenceDiagramRenderer = {
  // Initialize the renderer
  init: function (containerId) {
    console.log(
      "SequenceDiagramRenderer: Initializing for container:",
      containerId
    );
    this.containerId = containerId;
    this.isInitialized = true;
    return true;
  },

  // Step 1: Add CSS styles to document
  addStyles: function () {
    const styleId = "sequence-diagram-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .sequence-diagram-container {
        width: 100%;
        height: 100vh;
        max-height: 800px;
        overflow-y: auto;
        overflow-x: auto;
        min-height: 400px;
        background: #f8f9fa;
        position: relative;
        box-sizing: border-box;
      }

      .diagram-container {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 600px;
        overflow-x: auto;
        overflow-y: visible;
      }

      .actor-lane {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        min-height: 600px;
        width: 180px;
        flex-shrink: 0;
      }

      .actor-lane h3 {
        margin: 0;
        padding: 8px 4px;
        font-weight: 500;
        border-top: 5px solid transparent;
        max-width: 160px;
        text-align: center;
        font-size: 13px;
        line-height: 1.2;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .lifeline {
        width: 2px;
        height: 100%;
        min-height: 600px;
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

      .message-label.sequence-label {
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        transition: background-color 0.2s;
      }
      
      .message-label.sequence-label:hover {
        background-color: rgba(25, 118, 210, 0.1);
      }

      .sequence-inline-edit-input {
        position: fixed;
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

      .toolbar {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
      
      .container-name {
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        transition: background-color 0.2s;
      }
      
      .container-name:hover {
        background-color: rgba(25, 118, 210, 0.1);
      }

      .arrow-line {
        position: absolute;
        top: 50%;
        height: 2px;
        background-color: #555;
        z-index: 2;
        transform: translateY(-50%);
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
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
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
  createActivationBox: function () {
    return function ActivationBox({ actorIndex, yPos, color, actorsCount }) {
      const positionX = actorIndex * 180 + 90; // Fixed spacing: 180px per lane, center at 90px
      const style = {
        top: `${yPos}px`,
        left: `${positionX}px`,
        backgroundColor: color,
        position: "absolute",
        width: "10px",
        height: "28px",
        transform: "translate(-50%, -50%)",
        zIndex: 1,
        borderRadius: "2px",
      };
      return React.createElement("div", {
        className: "activation-box",
        style: style,
      });
    };
  },

  // Step 3: Create Message component
  createMessage: function () {
    return function Message({
      label,
      from,
      to,
      yPos,
      dashed = false,
      actorsCount,
      sequenceId,
    }) {
      const isLeft = to < from;
      const startActor = isLeft ? to : from;
      const endActor = isLeft ? from : to;

      // Calculate positions using fixed spacing (180px per lane)
      const startActorIndex = isLeft ? to : from;
      const endActorIndex = isLeft ? from : to;
      const startX = startActorIndex * 180 + 90; // Center of start lane
      const endX = endActorIndex * 180 + 90; // Center of end lane
      const width = Math.abs(endX - startX);

      const messageStyle = {
        top: `${yPos - 50}px`,
        left: `${Math.min(startX, endX)}px`,
        width: `${width}px`,
        position: "absolute",
        height: "100px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      };

      const arrowClass = `arrow-line ${dashed ? "dashed" : ""} ${
        isLeft ? "left" : ""
      }`;

      return React.createElement(
        "div",
        { className: "message", style: messageStyle },
        [
          React.createElement(
            "div",
            {
              key: "label",
              className: "message-label sequence-label",
              style: { maxWidth: "90%", textAlign: "center" },
              "data-sequence-id": sequenceId,
              title: "Double-click to edit",
            },
            label
          ),
          React.createElement("div", {
            key: "arrow",
            className: arrowClass,
            style: { width: "100%" },
          }),
        ]
      );
    };
  },

  // Step 4: Create SelfMessage component
  createSelfMessage: function () {
    return function SelfMessage({
      label,
      actorIndex,
      yPos,
      height,
      actorsCount,
      sequenceId,
    }) {
      const position = actorIndex * 180 + 90; // Fixed spacing: 180px per lane, center at 90px
      const style = {
        top: `${yPos}px`,
        left: `${position}px`,
        height: `${height}px`,
        position: "absolute",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
      };

      return React.createElement(
        "div",
        { className: "self-message", style: style },
        [
          React.createElement(
            "div",
            {
              key: "path",
              className: "self-message-path",
            },
            [
              React.createElement("div", {
                key: "top",
                className: "self-message-path-top",
              }),
              React.createElement("div", {
                key: "vertical",
                className: "self-message-path-vertical",
              }),
              React.createElement("div", {
                key: "bottom",
                className: "self-message-path-bottom",
              }),
            ]
          ),
          React.createElement(
            "div",
            {
              key: "label",
              className: "message-label sequence-label",
              style: { marginLeft: "10px" },
              "data-sequence-id": sequenceId,
              title: "Double-click to edit",
            },
            label
          ),
        ]
      );
    };
  },

  // Step 5: Main render function
  render: function (data, targetElement) {
    console.log(
      "SequenceDiagramRenderer: Rendering proper sequence diagram",
      data
    );

    // Add CSS styles
    this.addStyles();

    // Initialize data store if available
    if (
      window.WorkflowArchitectDataStore &&
      !window.WorkflowArchitectDataStore.data.isInitialized
    ) {
      console.log("SequenceDiagramRenderer: Initializing data store");
      window.WorkflowArchitectDataStore.init(data);
    }

    // Initialize inline editing system
    if (window.InlineEditSystem && !window.InlineEditSystem.isInitialized) {
      window.InlineEditSystem.init();
    }

    // Get containers and sequences from data store or use provided data
    let containers, sequences;
    if (
      window.WorkflowArchitectDataStore &&
      window.WorkflowArchitectDataStore.data.isInitialized
    ) {
      containers = window.WorkflowArchitectDataStore.getContainersArray();
      sequences = window.WorkflowArchitectDataStore.getSequencesArray();
    } else {
      containers = data.containers || [];
      sequences = data.sequences || [];
    }

    console.log(
      "SequenceDiagramRenderer: Using containers:",
      containers.length,
      "sequences:",
      sequences.length
    );

    // Create actor data from containers
    const actors = containers.map((container) => ({
      name: container.name || container.name_text || "Container",
      className: (container.type || container.type_text || "component")
        .toLowerCase()
        .replace(/\s+/g, "-"),
      color: container.colorHex || container.color_hex_text || "#3ea50b",
      id: container.id || container.container_id,
    }));

    // Create message data from sequences
    const messages = sequences
      .map((sequence, index) => {
        const fromIndex = actors.findIndex(
          (a) =>
            a.id === (sequence.fromContainerId || sequence.from_container_id)
        );
        const toIndex = actors.findIndex(
          (a) => a.id === (sequence.toContainerId || sequence.to_container_id)
        );

        return {
          label: sequence.label || sequence.label_text || "Sequence",
          from: fromIndex,
          to: toIndex,
          dashed: sequence.isDashed || sequence.is_dashed_boolean || false,
          self: fromIndex === toIndex,
          id: sequence.id || sequence.sequence_id,
        };
      })
      .filter((msg) => msg.from >= 0 && msg.to >= 0);

    const actorsCount = actors.length;

    // Pre-calculate Y positions
    const startY = 130;
    const stepY = 150;
    let positionedMessages = [];
    let currentY = startY;

    messages.forEach((msg) => {
      positionedMessages.push({ ...msg, yPos: currentY });
      currentY += msg.self ? stepY * 1.2 : stepY;
    });

    const containerHeight = currentY;

    // Create components
    const ActivationBox = this.createActivationBox();
    const Message = this.createMessage();
    const SelfMessage = this.createSelfMessage();

    // Toolbar event handlers
    const handleAddContainer = () => {
      console.log("Add Container clicked");

      // Get feature ID from data store
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      const featureId = feature?.id;

      if (!featureId) {
        console.error("No feature ID available for new container");
        return;
      }

      // Create container with default values
      const newContainerData = {
        name: "New Container",
        type: "Component",
        colorHex: "#3ea50b",
        featureId: featureId,
      };

      // Use event bridge to handle the addition
      if (window.WorkflowArchitectEventBridge) {
        const tempId = window.WorkflowArchitectEventBridge.handleEntityAdd(
          "container",
          newContainerData
        );
        console.log("Container add initiated with temp ID:", tempId);
      } else {
        console.error("WorkflowArchitectEventBridge not available");
      }
    };

    const handleAddSequence = () => {
      console.log("Add Sequence clicked");

      // Check if we have at least 2 containers
      if (actors.length < 2) {
        console.log("Need at least 2 containers to create a sequence");
        return;
      }

      // Get feature ID from data store
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      const featureId = feature?.id;

      if (!featureId) {
        console.error("No feature ID available for new sequence");
        return;
      }

      // Create sequence between first two containers
      const newSequenceData = {
        label: "New Sequence",
        fromContainerId: actors[0].id,
        toContainerId: actors[1].id,
        actionType: "Data Flow",
        isDashed: false,
        featureId: featureId,
      };

      // Use event bridge to handle the addition
      if (window.WorkflowArchitectEventBridge) {
        const tempId = window.WorkflowArchitectEventBridge.handleEntityAdd(
          "sequence",
          newSequenceData
        );
        console.log("Sequence add initiated with temp ID:", tempId);
      } else {
        console.error("WorkflowArchitectEventBridge not available");
      }
    };

    // Main sequence diagram component
    const SequenceDiagram = () => {
      return React.createElement(
        "div",
        {
          style: { width: "100%", height: "auto", padding: "20px" },
        },
        [
          // Toolbar
          React.createElement(
            "div",
            {
              key: "toolbar",
              className: "toolbar",
            },
            [
              React.createElement(
                "button",
                {
                  key: "add-container",
                  className: "toolbar-button",
                  onClick: handleAddContainer,
                },
                "+ Add Container"
              ),
              React.createElement(
                "button",
                {
                  key: "add-sequence",
                  className: "toolbar-button",
                  onClick: handleAddSequence,
                  disabled: actors.length < 2,
                },
                "+ Add Sequence"
              ),
            ]
          ),

          // Diagram container
          React.createElement(
            "div",
            {
              key: "diagram",
              className: "diagram-container",
              style: { height: `${containerHeight}px` },
            },
            [
              // Actor lanes
              ...actors.map((actor) =>
                React.createElement(
                  "div",
                  {
                    key: actor.name,
                    className: `actor-lane ${actor.className}`,
                    style: { height: `${containerHeight}px` },
                  },
                  [
                    React.createElement(
                      "h3",
                      {
                        key: "title",
                        style: { borderTopColor: actor.color },
                        className: "container-name",
                        "data-container-id": actor.id,
                        title: "Double-click to edit",
                      },
                      actor.name
                    ),
                    React.createElement("div", {
                      key: "lifeline",
                      className: "lifeline",
                    }),
                  ]
                )
              ),

              // Messages and activation boxes
              React.createElement(
                React.Fragment,
                { key: "messages" },
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
                        actorsCount: actorsCount,
                      }),
                      React.createElement(ActivationBox, {
                        key: `activation-end-${index}`,
                        actorIndex: msg.from,
                        yPos: msg.yPos + loopHeight,
                        color: actors[msg.from].color,
                        actorsCount: actorsCount,
                      }),
                      React.createElement(SelfMessage, {
                        key: `self-message-${index}`,
                        label: sequencedLabel,
                        actorIndex: msg.from,
                        yPos: msg.yPos,
                        height: loopHeight,
                        actorsCount: actorsCount,
                        sequenceId: msg.id,
                      }),
                    ]);
                  } else {
                    return React.createElement(React.Fragment, { key: index }, [
                      React.createElement(ActivationBox, {
                        key: `activation-from-${index}`,
                        actorIndex: msg.from,
                        yPos: msg.yPos,
                        color: actors[msg.from].color,
                        actorsCount: actorsCount,
                      }),
                      React.createElement(ActivationBox, {
                        key: `activation-to-${index}`,
                        actorIndex: msg.to,
                        yPos: msg.yPos,
                        color: actors[msg.to].color,
                        actorsCount: actorsCount,
                      }),
                      React.createElement(Message, {
                        key: `message-${index}`,
                        label: sequencedLabel,
                        from: msg.from,
                        to: msg.to,
                        yPos: msg.yPos,
                        dashed: !!msg.dashed,
                        actorsCount: actorsCount,
                        sequenceId: msg.id,
                      }),
                    ]);
                  }
                })
              ),
            ]
          ),
        ]
      );
    };

    // Render to target element
    try {
      const container = targetElement[0] || targetElement;
      if (container) {
        const reactRoot = window.ReactDOM.createRoot
          ? window.ReactDOM.createRoot(container)
          : null;

        if (reactRoot) {
          reactRoot.render(React.createElement(SequenceDiagram));
        } else {
          window.ReactDOM.render(
            React.createElement(SequenceDiagram),
            container
          );
        }

        console.log(
          "SequenceDiagramRenderer: Successfully rendered sequence diagram"
        );
      } else {
        console.error("SequenceDiagramRenderer: Target container not found");
      }
    } catch (error) {
      console.error("SequenceDiagramRenderer: Render error:", error);
      if (targetElement && targetElement.html) {
        targetElement.html(
          '<div style="padding:20px; color: red;">Render error: ' +
            error.message +
            "</div>"
        );
      }
    }
  },
};

// Create alias for backward compatibility
window.WorkflowArchitectRenderer = window.SequenceDiagramRenderer;

console.log(
  "DEBUG: sequence-diagram-renderer.js script loaded successfully. SequenceDiagramRenderer object created:",
  typeof window.SequenceDiagramRenderer
);
console.log(
  "DEBUG: WorkflowArchitectRenderer alias created:",
  typeof window.WorkflowArchitectRenderer
);
