// Visual Workflow Architect - Proper Sequence Diagram Renderer
// Based on SequenceFlow.html structure using React + CSS positioning (NOT React Flow)

console.log("DEBUG: react-flow-renderer-clean.js script is loading...");

// Add rerender event listener (following storymap-grid pattern)
document.addEventListener("workflow-architect:rerender", function (event) {
  console.log("RERENDER: Event received with data:", event.detail);

  // Find the container and re-render
  const container = document.getElementById("sequence-diagram-container");
  console.log("RERENDER: Container found:", !!container);
  console.log(
    "RERENDER: SequenceDiagramRenderer available:",
    !!window.SequenceDiagramRenderer
  );

  if (container && window.SequenceDiagramRenderer) {
    // Clear existing content
    container.innerHTML = "";
    console.log("RERENDER: Container cleared, calling render...");

    // Re-render with new data
    window.SequenceDiagramRenderer.render(container, event.detail);
    console.log("RERENDER: UI re-rendered successfully");
  } else {
    console.warn("RERENDER: Container or renderer not found for rerender");
  }
});

// Initialize inline editing module
if (window.WorkflowArchitectInlineEdit) {
  window.WorkflowArchitectInlineEdit.init();
}

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
  addStyles: function (containerHeight = 600) {
    const styleId = "sequence-diagram-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .sequence-diagram-container {
        width: 100%;
        max-height: none;
        overflow-y: hidden !important; 
        overflow-x: scroll !important;
        min-height: 400px;
        background: #f8f9fa;
        position: relative;
        box-sizing: border-box;
      }

      .workflow-architect-container {
        // overflow: hidden;
      }

      .diagram-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        position: relative;
        width: fit-content;
        height: auto;
        min-height: auto;
        overflow: visible;
      }

      .actor-lane {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        min-height: auto;
        width: 180px;
        flex-shrink: 0;
      }

      .actor-lane h3 {
        border-radius: 6px;
        padding: 8px 16px;
        margin-top: 20px;
        font-weight: 500;
        font-size: 14px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 170px; /* Increased from 140px to allow more text */
        text-align: center;
        line-height: 1.3;
        transition: all 0.2s ease-in-out;
        background-color: #e3f2fd; 
        border: 1px solid #90caf9;
        color: #1e88e5;
      }
      .lifeline {
        width: 0px; /* The element itself has no width */
        height: 100%;
        min-height: auto; /* Will be updated dynamically */
        border-left: 2px dotted #cccccc; /* Create the line using a dotted border */
        z-index: 0;
      }
      
      .sequence-node {
        position: absolute;
        width: 38px; /* Reduced by 20% from 48px */
        height: 38px; /* Reduced by 20% from 48px */
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 2; /* Keep it above the lifeline (z-index: 1) and below the arrow (z-index: 3) */
        box-shadow: 0 2px 4px rgba(0,0,0,0.15); /* Enhanced shadow for more "pop" */
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
        transition: all 0.2s ease;
        position: relative;
      }
      
      .message-label.sequence-label:hover {
        background-color: rgba(25, 118, 210, 0.1);
        outline: 2px solid #1976d2;
        outline-offset: 2px;
      }
      

      .message.drag-over,
      .sequence-message.drag-over {
        box-shadow: 0 0 0 2px #1976d2; /* Blue outline for drop target */
      }
      
      .message.dragging,
      .sequence-message.dragging {
        opacity: 0.5;
        transform: rotate(3deg);
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

      .container-master-wrapper {
        position: relative;
        display: inline-block; /* Make wrapper fit its content */
        margin-top: 20px;
      }

      .actor-lane h3.container-name {
        /* The visible box */
        margin-top: 0;
        padding: 8px 16px 8px 16px; /* Add padding on the right for the doc icon to appear in */
        max-width: 170px;
        text-align: center;
        border-radius: 6px;
        border: 1px solid;
        transition: background-color 0.2s;
        cursor: pointer;
      }
      
      .container-name span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .container-icon-button {
        /* Positioned absolutely, relative to the wrapper */
        position: absolute;
        top: 50%;
        right: 4px; /* Position INSIDE the h3's padding area */
        transform: translateY(-50%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in-out;
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        background-color: white;
        border: 1px solid #ddd; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        cursor: pointer; 
        z-index: 10;
      }
      
      .add-container-btn {
        /* Positioned absolutely, relative to the wrapper */
        position: absolute;
        top: 50%;
        right: 0; /* Position ON the border */
        transform: translate(50%, -50%); /* Center it on the border */
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease-in-out;
        /* Visuals */
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 1px solid #cccccc;
        background-color: white; 
        color: #888888; 
        font-size: 18px;
        display: flex; 
        align-items: center; 
        justify-content: center; 
        cursor: pointer; 
        z-index: 10;
        padding: 0;
        line-height: 1;
      }

      /* VISIBILITY IS NOW CONTROLLED BY THIS JS-ADDED CLASS */
      .container-master-wrapper.is-visible .container-icon-button,
      .container-master-wrapper.is-visible .add-container-btn {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(-50%) scale(1); /* Ensure this is present for the '+' icon */
      }
      
      .container-icon-button svg {
        width: 14px;
        height: 14px;
        color: #555;
      }
      .sequence-icon-button {
        position: absolute;
        width: 16px;
        height: 16px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        cursor: pointer;
        z-index: 15;
        pointer-events: none;
        right: 4px;
        top: 4px;
      }

      .sequence-label:hover .sequence-icon-button {
        opacity: 1;
        pointer-events: auto;
      }

      .sequence-icon-button:hover {
        background-color: #f5f5f5;
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
      .workflow-background {
        position: absolute;
        background: rgba(227, 242, 253, 0.10); /* Reduced opacity to 0.10 */
        border: 2px solid rgba(227, 242, 253, 0.2); /* Border opacity 0.2 */
        border-radius: 8px;
        z-index: 1; /* Above diagram background but behind sequences */
        pointer-events: none;
      }
      
      .subgroup-background {
        position: absolute;
        background: rgba(245, 245, 245, 0.15); /* Light gray with transparency */
        border: 1px solid rgba(245, 245, 245, 0.3);
        border-radius: 6px;
        z-index: 1.5; /* Above workflow background but behind sequences */
        pointer-events: none;
        margin: 5px;
      }

      .subgroup-label {
        position: absolute;
        background: #9e9e9e;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        top: -10px;
        left: 6px;
        z-index: 2.5; /* Above subgroup background */
      }

      .workflow-label {
        position: absolute;
        background: #4caf50;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        top: -12px;
        left: 8px;
        z-index: 2; /* Above workflow background */
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
        width: 30px; /* Further reduced to prevent workflow background overlap */
        height: 100%;
      }
      
      .self-message-path-top,
      .self-message-path-bottom,
      .self-message-path-vertical {
        position: absolute;
        background-color: #555;
      }

      .self-message-path-top {
        width: 30px; height: 2px; top: 0; left: 19px; /* Start from circle edge (19px radius) */
      }

      .self-message-path-top::after {
        content: ''; position: absolute; right: -1px; top: -3px; 
        width: 0; height: 0;
        border-top: 3px solid transparent; 
        border-bottom: 3px solid transparent; 
        border-left: 8px solid #555;
      }

      .self-message-path-vertical {
        width: 2px; height: 100%; top: 0; left: 49px; /* Adjusted for 30px width */
      }

      .self-message-path-bottom {
        width: 30px; height: 2px; bottom: 0; left: 19px; /* Start from circle edge */
      }

      .self-message-path-bottom::after {
        content: ''; position: absolute; left: -1px; top: -3px; 
        width: 0; height: 0;
        border-top: 3px solid transparent; 
        border-bottom: 3px solid transparent; 
        border-right: 8px solid #555;
      }
        .sequence-drop-zone {
        position: absolute;
        height: 20px; /* The clickable/hoverable height */
        z-index: 4; /* Above backgrounds but below labels */
        pointer-events: none; /* Initially not interactive */
        transform: translateY(-50%);
        transition: background-color 0.2s ease;
      }
   .sequence-drop-zone::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 2px; /* MODIFIED: Thinner line */
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        background-color: rgba(25, 118, 210, 0.6); /* MODIFIED: Faded color */
        border-radius: 1px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      /* NEW: Styles for the 'Drop here' text label */
      .sequence-drop-zone::after {
        content: 'Drop Here';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(25, 118, 210, 0.9);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      /* This class will be added by JS during a drag operation to show both indicators */
      .sequence-drop-zone.drag-over::before,
      .sequence-drop-zone.drag-over::after {
        opacity: 1;
      }
      /* This class will be added by JS during a drag operation */
      .sequence-drop-zone.drag-over::before {
        opacity: 1;
      }
         .empty-workflows-container {
        padding: 0 20px;
        margin-top: 20px;
      }
      .empty-workflow-wrapper {
        background-color: #f0f4f8;
        border: 2px dashed #b0c4de;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 15px;
      }
      .empty-workflow-wrapper h4 {
        margin: 0 0 10px 5px;
        font-size: 13px;
        color: #4a6a8a;
        font-weight: 600;
      }
      .empty-workflow-drop-zone {
        padding: 25px;
        text-align: center;
        border-radius: 6px;
        background-color: rgba(255,255,255, 0.6);
        transition: background-color 0.2s ease;
        position: relative; /* Needed for pseudo-elements */
      }
      .empty-workflow-drop-zone.drag-over {
        background-color: #e3f2fd;
      }
      .empty-workflow-drop-zone span {
        font-size: 14px;
        font-weight: 500;
        color: #7b98b7;
        pointer-events: none; /* Make sure the span doesn't interfere with drop events */
      }
      /* This class will be added to the main container during a drag operation */
      .diagram-container.sequence-drag-active .sequence-drop-zone {
        pointer-events: auto; /* Make zones interactive ONLY during a drag */
      }
 
    `;
    document.head.appendChild(style);
  },

  // Step 2: Create SequenceNode component
  createSequenceNode: function () {
    return function SequenceNode({ actorIndex, yPos, color }) {
      const positionX = actorIndex * 180 + 90; // Fixed spacing: 180px per lane, center at 90px
      const style = {
        top: `${yPos}px`,
        left: `${positionX}px`,
        backgroundColor: color,
      };
      return React.createElement("div", {
        className: "sequence-node", // Use the new CSS class
        style: style,
      });
    };
  },

  // Step 3: Create Message component
  createMessage: function () {
    return function Message({
      label,
      labelText,
      from,
      to,
      yPos,
      dashed = false,
      actorsCount,
      sequenceId,
      subgroupId,
      workflowId,
    }) {
      const isLeft = to < from;

      // Use the proven, pixel-based positioning system
      const startX = (isLeft ? to : from) * 180 + 90; // Center of start lane
      const endX = (isLeft ? from : to) * 180 + 90; // Center of end lane
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
        {
          className: "message sequence-message",
          style: messageStyle,
          "data-sequence-id": sequenceId,
          "data-workflow-id": workflowId,
        },
        [
          React.createElement(
            "div",
            {
              key: "label",
              className: "message-label sequence-label",
              style: { maxWidth: "90%", textAlign: "center" },
              "data-sequence-id": sequenceId,
              "data-label-text": labelText,
              title: "Double-click to edit",
            },
            [
              label,
              React.createElement(
                "div",
                {
                  key: "icon-button",
                  className: "sequence-icon-button",
                  onClick: (e) => {
                    e.stopPropagation();
                    console.log(`SEQUENCE ICON CLICKED: ${sequenceId}`);
                    // Trigger sequence_clicked event
                    if (window.WorkflowArchitectEventBridge) {
                      window.WorkflowArchitectEventBridge.handleSequenceClick(
                        sequenceId
                      );
                    }
                  },
                },
                React.createElement(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                  },
                  [
                    React.createElement("path", {
                      key: "path1",
                      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
                    }),
                    React.createElement("polyline", {
                      key: "path2",
                      points: "14,2 14,8 20,8",
                    }),
                    React.createElement("line", {
                      key: "path3",
                      x1: "16",
                      y1: "13",
                      x2: "8",
                      y2: "13",
                    }),
                    React.createElement("line", {
                      key: "path4",
                      x1: "16",
                      y1: "17",
                      x2: "8",
                      y2: "17",
                    }),
                    React.createElement("polyline", {
                      key: "path5",
                      points: "10,9 9,9 8,9",
                    }),
                  ]
                )
              ),
            ]
          ),
          React.createElement("div", {
            key: "arrow",
            className: arrowClass,
            style: {
              width: "100%",
              backgroundColor: "#555",
              height: "2px",
            },
          }),
        ]
      );
    };
  },
  createSelfMessage: function () {
    return function SelfMessage({
      label,
      labelText,
      actorIndex,
      yPos,
      height,
      actorsCount,
      sequenceId,
      subgroupId,
      workflowId,
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
        {
          className: "self-message",
          style: style,
        },
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
              style: {
                marginLeft: "10px",
              },
              "data-sequence-id": sequenceId,
              "data-label-text": labelText,
              title: "Double-click to edit",
            },
            [
              label,
              React.createElement(
                "div",
                {
                  key: "icon-button",
                  className: "sequence-icon-button",
                  onClick: (e) => {
                    e.stopPropagation();
                    console.log(`SEQUENCE ICON CLICKED: ${sequenceId}`);
                    // Trigger sequence_clicked event
                    if (window.WorkflowArchitectEventBridge) {
                      window.WorkflowArchitectEventBridge.handleSequenceClick(
                        sequenceId
                      );
                    }
                  },
                },
                React.createElement(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                  },
                  [
                    React.createElement("path", {
                      key: "path1",
                      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
                    }),
                    React.createElement("polyline", {
                      key: "path2",
                      points: "14,2 14,8 20,8",
                    }),
                    React.createElement("line", {
                      key: "path3",
                      x1: "16",
                      y1: "13",
                      x2: "8",
                      y2: "13",
                    }),
                    React.createElement("line", {
                      key: "path4",
                      x1: "16",
                      y1: "17",
                      x2: "8",
                      y2: "17",
                    }),
                    React.createElement("polyline", {
                      key: "path5",
                      points: "10,9 9,9 8,9",
                    }),
                  ]
                )
              ),
            ]
          ),
        ]
      );
    };
  },

  // Step 5: Main render function
  // JavaScript logic to handle hover with delay
  initContainerHoverLogic: function(container) {
    const wrappers = container.querySelectorAll('.container-master-wrapper');
    wrappers.forEach(wrapper => {
      // Prevent adding listeners multiple times
      if (wrapper.dataset.hoverInit === 'true') return;
      wrapper.dataset.hoverInit = 'true';

      const docIcon = wrapper.querySelector('.container-icon-button');
      const addBtn = wrapper.querySelector('.add-container-btn');
      let hideTimer;

      const showIcons = () => {
        clearTimeout(hideTimer);
        wrapper.classList.add('is-visible');
      };

      const startHideTimer = () => {
        hideTimer = setTimeout(() => {
          wrapper.classList.remove('is-visible');
        }, 100); // 100ms delay
      };

      wrapper.addEventListener('mouseenter', showIcons);
      wrapper.addEventListener('mouseleave', startHideTimer);

      // Make the icons "self-aware"
      if (docIcon) {
        docIcon.addEventListener('mouseenter', showIcons);
        docIcon.addEventListener('mouseleave', startHideTimer);
      }
      if (addBtn) {
        addBtn.addEventListener('mouseenter', showIcons);
        addBtn.addEventListener('mouseleave', startHideTimer);
      }
    });
  },

  render: function (data, targetElement) {
    console.log(
      "SequenceDiagramRenderer: Rendering proper sequence diagram",
      data
    );

    // Add CSS styles with default height (will be updated later)
    this.addStyles();
    const container = targetElement[0] || targetElement;
    if (container) {
      container.classList.add("sequence-diagram-container");
    }
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

    // Get containers, sequences, workflows, and subgroups from data store or use provided data
    let containers, allSequences, workflows, subgroups; // Declare variables in the outer scope

    if (
      window.WorkflowArchitectDataStore &&
      window.WorkflowArchitectDataStore.data.isInitialized
    ) {
      // If the data store is ready, get data from it.
      containers = window.WorkflowArchitectDataStore.getContainersArray();
      allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
      workflows = window.WorkflowArchitectDataStore.getWorkflowsArray().reduce(
        (acc, wf) => {
          acc[wf.id] = wf;
          return acc;
        },
        {}
      );
      subgroups = window.WorkflowArchitectDataStore.getSubgroupsArray().reduce(
        (acc, sg) => {
          acc[sg.id] = sg;
          return acc;
        },
        {}
      );
    } else {
      containers = data.containers || [];
      allSequences = data.sequences || [];
      workflows = {};
      subgroups = {};
    }

    console.log("DEBUG - About to create actors...");
    // Create actor data from containers
    const actors = containers.map((container) => ({
      name: container.name || container.name_text || "Container",
      className: (container.type || container.type_text || "component")
        .toLowerCase()
        .replace(/\s+/g, "-"),
      color: container.colorHex || container.color_hex_text || "#3ea50b",
      id: container.id || container.container_id,
    }));

    // --- PREPARATION FOR PHASE 1: UNIFIED WORKFLOW LAYOUT ---
    // --- NEW ARCHITECTURE: DATA PREPARATION FOR "RENDER LIST" ---
    let renderList = [];
    const sequencesByWorkflow = allSequences.reduce((acc, seq) => {
      const wfId = seq.workflowId || "ungrouped";
      if (!acc[wfId]) {
        acc[wfId] = [];
      }
      acc[wfId].push(seq);
      return acc;
    }, {});

    // Create render items for ungrouped sequences and populated workflows
    for (const id in sequencesByWorkflow) {
      const sequences = sequencesByWorkflow[id];
      if (id === "ungrouped") {
        sequences.forEach((seq) =>
          renderList.push({
            type: "SEQUENCE",
            data: seq,
            sortKey: seq.orderIndex,
          })
        );
      } else {
        const workflow = window.WorkflowArchitectDataStore.getWorkflow(id);
        if (workflow) {
          sequences.sort((a, b) => a.orderIndex - b.orderIndex);
          renderList.push({
            type: "WORKFLOW_BLOCK",
            data: { workflow: workflow, sequences: sequences },
            sortKey: sequences[0].orderIndex,
          });
        }
      }
    }
    renderList.sort((a, b) => a.sortKey - b.sortKey);

    let currentY = 130;
    let allPositionedMessages = [];
    let allWorkflowBounds = {};
    const WORKFLOW_MARGIN = 40;
    const WORKFLOW_PADDING_TOP = 50;
    const WORKFLOW_PADDING_BOTTOM = 70;
    const SEQUENCE_HEIGHT = 90;
    const allWorkflowObjects =
      window.WorkflowArchitectDataStore.getWorkflowsArray();
    const populatedWorkflowIds = Object.keys(sequencesByWorkflow).filter(
      (id) => id !== "ungrouped"
    );
    const emptyWorkflows = allWorkflowObjects
      .filter((wf) => !populatedWorkflowIds.includes(wf.id))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    // Loop 1: Process the interleaved list of sequences and populated workflow blocks
    renderList.forEach((item) => {
      const startY = currentY;

      if (item.type === "SEQUENCE") {
        const sequence = item.data;
        const fromActor = actors.find((a) => a.id === sequence.fromContainerId);
        const toActor = actors.find((a) => a.id === sequence.toContainerId);
        if (!fromActor || !toActor) return;

        const positionalIndex = allPositionedMessages.length + 1;
        let labelText = (sequence.label || "Sequence").replace(/^\d+\.\s*/, "");
        const isSelfMessage = fromActor.id === toActor.id;

        allPositionedMessages.push({
          originalOrderIndex: sequence.orderIndex,
          label: `${positionalIndex}. ${labelText}`,
          labelText: labelText,
          yPos: startY,
          from: actors.indexOf(fromActor),
          to: actors.indexOf(toActor),
          self: isSelfMessage,
          dashed: sequence.isDashed || false,
          sequenceId: sequence.id,
          workflowId: sequence.workflowId,
          subgroupId: sequence.subgroupId,
        });

        currentY += SEQUENCE_HEIGHT; // Increment Y by the height of a single sequence
      } else if (item.type === "WORKFLOW_BLOCK") {
        const { workflow, sequences } = item.data;
        const workflowHeight =
          WORKFLOW_PADDING_TOP +
          sequences.length * SEQUENCE_HEIGHT +
          WORKFLOW_PADDING_BOTTOM -
          SEQUENCE_HEIGHT;

        // Position the sequences within this block
        sequences.forEach((sequence, index) => {
          const fromActor = actors.find(
            (a) => a.id === sequence.fromContainerId
          );
          const toActor = actors.find((a) => a.id === sequence.toContainerId);
          if (!fromActor || !toActor) return;

          const positionalIndex = allPositionedMessages.length + 1;
          let labelText = (sequence.label || "Sequence").replace(
            /^\d+\.\s*/,
            ""
          );
          const isSelfMessage = fromActor.id === toActor.id;

          allPositionedMessages.push({
            originalOrderIndex: sequence.orderIndex,
            label: `${positionalIndex}. ${labelText}`,
            labelText: labelText,
            yPos: startY + WORKFLOW_PADDING_TOP + index * SEQUENCE_HEIGHT,
            from: actors.indexOf(fromActor),
            to: actors.indexOf(toActor),
            self: isSelfMessage,
            dashed: sequence.isDashed || false,
            sequenceId: sequence.id,
            workflowId: sequence.workflowId,
            subgroupId: sequence.subgroupId,
          });
        });

        // Calculate the workflow's background bounds
        const actorIndicesInWorkflow = [
          ...new Set(
            sequences
              .flatMap((s) => [
                containers.findIndex((c) => c.id === s.fromContainerId),
                containers.findIndex((c) => c.id === s.toContainerId),
              ])
              .filter((i) => i !== -1)
          ),
        ];
        const minActor = Math.min(...actorIndicesInWorkflow);
        const maxActor = Math.max(...actorIndicesInWorkflow);
        const PADDING = 20;
        const minX = minActor * 180 + 10 - PADDING;
        const maxX = maxActor * 180 + 100 + PADDING;

        allWorkflowBounds[workflow.id] = {
          x: minX,
          y: startY,
          width: maxX - minX,
          height: workflowHeight,
          workflow: workflow,
        };

        currentY += workflowHeight + WORKFLOW_MARGIN; // Increment Y by the height of the whole block
      }
    });

    // Loop 2: Process the empty workflows, appending them at the end
    emptyWorkflows.forEach((workflow) => {
      const EMPTY_WORKFLOW_HEIGHT = 100;
      const startY = currentY;

      allWorkflowBounds[workflow.id] = {
        x: 10,
        y: startY,
        width: "calc(100% - 20px)",
        height: EMPTY_WORKFLOW_HEIGHT,
        workflow: workflow,
        isEmpty: true,
      };

      currentY += EMPTY_WORKFLOW_HEIGHT + WORKFLOW_MARGIN;
    });
    const finalContainerHeight = currentY;
    const actorsCount = actors.length;

    const USE_SVG_ARROWS = true;

    // Phase 2: SVG Overlay System - Coordinate calculation functions
    const laneToPixel = (laneIndex) => laneIndex * 180 + 90;
    const sequenceToY = (orderIndex) => 130 + orderIndex * 90;
    const getCircleCenter = (laneIndex, orderIndex) => ({
      x: laneToPixel(laneIndex),
      y: sequenceToY(orderIndex),
    });

    // Phase 3: Circle edge intersection calculation
    const getCircleEdgePoint = (centerX, centerY, targetX, targetY, radius) => {
      const dx = targetX - centerX;
      const dy = targetY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Avoid division by zero
      if (distance === 0) return { x: centerX, y: centerY };

      return {
        x: centerX + (dx / distance) * radius,
        y: centerY + (dy / distance) * radius,
      };
    };

    // SVG Arrow Component for precise circle-to-circle positioning
    const SVGArrow = ({ from, to, yPos, label, dashed = false }) => {
      const startCenter = getCircleCenter(from, yPos / 90 - 130 / 90);
      const endCenter = getCircleCenter(to, yPos / 90 - 130 / 90);

      // Phase 3: Calculate circle edge points (19px radius for 38px diameter, touching edges)
      const circleRadius = 19; // 19px radius to touch circle edges directly
      const startEdge = getCircleEdgePoint(
        startCenter.x,
        startCenter.y,
        endCenter.x,
        endCenter.y,
        circleRadius
      );
      const endEdge = getCircleEdgePoint(
        endCenter.x,
        endCenter.y,
        startCenter.x,
        startCenter.y,
        circleRadius
      );

      const strokeDashArray = dashed ? "5,5" : "none";

      return [
        React.createElement("line", {
          key: "line",
          x1: startEdge.x,
          y1: startEdge.y,
          x2: endEdge.x,
          y2: endEdge.y,
          stroke: "#555",
          strokeWidth: "2",
          strokeDasharray: strokeDashArray,
          markerEnd: "url(#arrowhead)",
        }),
        // Note: Label is now rendered as HTML overlay, not SVG text
      ];
    };

    // SVG Self-Message Component for consistent arrow styling
    const SVGSelfMessage = ({ actorIndex, yPos, height, dashed = false }) => {
      const centerX = actorIndex * 180 + 90;
      const circleRadius = 19;
      const loopWidth = 80; // Increased width to prevent workflow conflicts

      // Calculate path points
      const startX = centerX + circleRadius;
      const endX = centerX + circleRadius;
      const rightX = centerX + loopWidth;
      const topY = yPos;
      const bottomY = yPos + height;

      const strokeDashArray = dashed ? "5,5" : "none";

      return [
        // Top horizontal line (right arrow)
        React.createElement("line", {
          key: "top-line",
          x1: startX,
          y1: topY,
          x2: rightX,
          y2: topY,
          stroke: "#555",
          strokeWidth: "2",
          strokeDasharray: strokeDashArray,
          markerEnd: "url(#arrowhead)",
        }),
        // Vertical line
        React.createElement("line", {
          key: "vertical-line",
          x1: rightX,
          y1: topY,
          x2: rightX,
          y2: bottomY,
          stroke: "#555",
          strokeWidth: "2",
          strokeDasharray: strokeDashArray,
        }),
        // Bottom horizontal line (right arrow pointing into circle)
        React.createElement("line", {
          key: "bottom-line",
          x1: rightX,
          y1: bottomY,
          x2: endX,
          y2: bottomY,
          stroke: "#555",
          strokeWidth: "2",
          strokeDasharray: strokeDashArray,
          markerEnd: "url(#arrowhead)",
        }),
      ];
    };

    // Create components
    const SequenceNode = this.createSequenceNode(); // Use the new function

    const Message = this.createMessage();
    const SelfMessage = this.createSelfMessage();

    // Toolbar event handlers
    // ... existing code
    const handleAddContainerAfter = (index) => {
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      if (!feature || !feature.id) {
        return;
      }

      console.log("Adding container after index:", index);
      console.log("Containers array:", containers);
      console.log("Container at index:", containers[index]);

      // Calculate order_index to insert container after the specified index
      // Following storymap-grid pattern with beforeOrder/afterOrder
      let newOrderIndex;
      const currentContainer = containers[index];
      const nextContainer = containers[index + 1];

      // Use correct Bubble property name: order_index1_number
      const currentOrder =
        currentContainer?.order_index1_number ||
        currentContainer?.orderIndex ||
        currentContainer?.order ||
        (index + 1) * 10;

      let nextOrder;
      if (nextContainer) {
        // There is a next container, insert between current and next
        nextOrder =
          nextContainer.order_index1_number ||
          nextContainer.orderIndex ||
          nextContainer.order ||
          (index + 2) * 10;
        newOrderIndex = (currentOrder + nextOrder) / 2;
      } else {
        // This is the last container, add after it
        newOrderIndex = currentOrder + 1;
      }

      console.log(
        "Current order:",
        currentOrder,
        "Next order:",
        nextOrder,
        "New order:",
        newOrderIndex
      );

      console.log("Calculated new order index:", newOrderIndex);

      const newContainerData = {
        name_text: "New Container",
        color_hex: "#3ea50b",
        feature_id: feature.id,
        order_index: newOrderIndex,
      };

      console.log("Sending container data:", newContainerData);

      if (window.WorkflowArchitectEventBridge) {
        window.WorkflowArchitectEventBridge.handleContainerAdd(
          newContainerData
        );
      }
    };

    const handleAddContainer = () => {
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      if (!feature || !feature.id) {
        return;
      }
      const newContainerData = {
        name_text: "New Container",
        color_hex: "#3ea50b",
        feature_id: feature.id,
      };
      if (window.WorkflowArchitectEventBridge) {
        // CORRECTED: Call the specific handleContainerAdd function
        window.WorkflowArchitectEventBridge.handleContainerAdd(
          newContainerData
        );
      }
    };
    const handleAddSequence = () => {
      console.log("Add Sequence clicked - triggering Bubble workflow");

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

      // Calculate next order index for new sequence
      const nextOrderIndex = sequences.length + 1;

      // Trigger Bubble workflow event to show sequence creation popup
      // This follows the StoryMapper pattern where button click triggers workflow
      const eventData = {
        type: "add_sequence_clicked",
        featureId: featureId,
        nextOrderIndex: nextOrderIndex,
        timestamp: Date.now(),
      };

      // Use event bridge to trigger sequence creation popup
      if (window.WorkflowArchitectEventBridge) {
        console.log("Triggering sequence creation popup via event bridge");
        window.WorkflowArchitectEventBridge.handleSequenceCreationTrigger(
          eventData
        );
      } else {
        console.error("WorkflowArchitectEventBridge not available");
      }
    };
    const handleAddWorkflow = () => {
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      if (!feature || !feature.id) {
        return;
      }
      const nextOrderIndex =
        workflows.length > 0
          ? Math.max(...workflows.map((w) => w.orderIndex || 0)) + 10
          : 10;
      const newWorkflowData = {
        name: "New Workflow",
        featureId: feature.id,
        orderIndex: nextOrderIndex,
      };
      if (window.WorkflowArchitectEventBridge) {
        window.WorkflowArchitectEventBridge.handleEntityAdd(
          "workflow",
          newWorkflowData
        );
      }
    };
    const handleAddSubgroup = () => {
      console.log("Add Subgroup clicked - triggering Bubble workflow");

      // Get feature ID from data store
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      const featureId = feature?.id;

      if (!featureId) {
        console.error("No feature ID available for new subgroup");
        return;
      }

      // Prepare event data for subgroup creation
      const eventData = {
        type: "subgroup_added",
        featureId: featureId,
        availableWorkflows: Object.keys(workflows).map((wId) => ({
          id: wId,
          name: workflows[wId].name,
        })),
        timestamp: Date.now(),
      };

      // Use event bridge to trigger subgroup creation popup
      if (window.WorkflowArchitectEventBridge) {
        console.log("Triggering subgroup creation popup via event bridge");
        window.WorkflowArchitectEventBridge.handleSubgroupCreationTrigger(
          eventData
        );
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
          React.createElement("div", { key: "toolbar", className: "toolbar" }, [
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
          ]),

          // Diagram container
          React.createElement(
            "div",
            {
              key: "diagram",
              className: "diagram-container",
              style: { height: `${finalContainerHeight}px` },
            },
            [
              // --- RENDER ALL WORKFLOW BACKGROUNDS (POPULATED AND EMPTY) ---
              ...Object.values(allWorkflowBounds).map((bounds) => {
                if (bounds.isEmpty) {
                  // Render the new "empty workflow" component
                  return React.createElement(
                    "div",
                    {
                      key: `empty-wf-bg-${bounds.workflow.id}`,
                      className: "empty-workflow-wrapper",
                      style: {
                        position: "absolute",
                        top: `${bounds.y}px`,
                        left: `${bounds.x}px`,
                        width: bounds.width,
                        height: `${bounds.height}px`,
                        backgroundColor: bounds.workflow.colorHex || "#f0f4f8",
                      },
                    },
                    [
                      React.createElement(
                        "h4",
                        { key: "title" },
                        bounds.workflow.name
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "drop-zone",
                          className:
                            "empty-workflow-drop-zone sequence-drop-zone",
                          "data-order-before": 0,
                          "data-order-after": 20,
                          "data-workflow-id": bounds.workflow.id,
                          "data-subgroup-id": "",
                        },
                        React.createElement("span", null, "Drop Sequence Here")
                      ),
                    ]
                  );
                } else {
                  // Render the standard "populated workflow" background
                  return React.createElement(
                    "div",
                    {
                      key: `workflow-${bounds.workflow.id}`,
                      className: "workflow-background",
                      style: {
                        left: `${bounds.x}px`,
                        top: `${bounds.y}px`,
                        width: `${bounds.width}px`,
                        height: `${bounds.height}px`,
                        backgroundColor:
                          (bounds.workflow.colorHex || "#e3f2fd") + "1A",
                        borderColor:
                          (bounds.workflow.colorHex || "#e3f2fd") + "33",
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        key: "label",
                        className: "workflow-label",
                        style: {
                          backgroundColor:
                            bounds.workflow.colorHex || "#4caf50",
                        },
                      },
                      bounds.workflow.name || "Workflow"
                    )
                  );
                }
              }),

              // Actor lanes
              ...actors.map((actor, index) =>
                React.createElement(
                  "div",
                  {
                    key: actor.id,
                    className: `actor-lane ${actor.className}`,
                    style: { height: `${finalContainerHeight}px` },
                  },
                  [
                    // The Master Wrapper is the hover trigger and positioning context for ALL items.
                    React.createElement(
                      "div",
                      {
                        key: "container-master-wrapper",
                        className: "container-master-wrapper",
                      },
                      [
                        // 1. The visible, colored box (H3) - now only contains the text.
                        React.createElement(
                          "h3",
                          {
                            key: "title",
                            className: "container-name",
                            "data-container-id": actor.id,
                            style: {
                              backgroundColor: actor.color + "20",
                              borderColor: actor.color,
                              color: actor.color,
                            },
                          },
                          [
                            React.createElement(
                              "span",
                              {
                                key: "actor-name",
                              },
                              actor.name
                            ),
                          ]
                        ),
                        // 2. The Document Icon - sibling to the H3.
                        React.createElement(
                          "div",
                          {
                            key: `doc-icon-${actor.id}`,
                            className: "container-icon-button",
                            onClick: (e) => {
                              e.stopPropagation();
                              if (window.WorkflowArchitectEventBridge) {
                                window.WorkflowArchitectEventBridge.handleContainerClick(
                                  actor.id
                                );
                              }
                            },
                          },
                          React.createElement(
                            "svg",
                            {
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "currentColor",
                              strokeWidth: "2",
                            },
                            [
                              React.createElement("path", {
                                key: "path1",
                                d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
                              }),
                              React.createElement("polyline", {
                                key: "path2",
                                points: "14,2 14,8 20,8",
                              }),
                            ]
                          )
                        ),
                        // 3. The Plus Button - sibling to the H3.
                        React.createElement(
                          "button",
                          {
                            key: `add-btn-${index}`,
                            className: "add-container-btn",
                            title: "Add container after",
                            onClick: (e) => {
                              e.stopPropagation();
                              handleAddContainerAfter(index);
                            },
                          },
                          "+"
                        ),
                      ]
                    ),
                    React.createElement("div", {
                      key: "lifeline",
                      className: "lifeline",
                    }),
                  ]
                )
              ),

              // SVG Overlay for all arrows
              React.createElement(
                "svg",
                {
                  key: "svg-overlay",
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 2,
                  },
                  viewBox: `0 0 ${actors.length * 180} ${finalContainerHeight}`,
                },
                [
                  React.createElement("defs", { key: "defs" }, [
                    React.createElement(
                      "marker",
                      {
                        key: "arrowhead",
                        id: "arrowhead",
                        markerWidth: "8",
                        markerHeight: "6",
                        refX: "8",
                        refY: "3",
                        orient: "auto",
                      },
                      [
                        React.createElement("polygon", {
                          key: "arrow-poly",
                          points: "0 0, 8 3, 0 6",
                          fill: "#555",
                        }),
                      ]
                    ),
                  ]),
                  ...allPositionedMessages.map((msg, index) => {
                    if (msg.self) {
                      return React.createElement(SVGSelfMessage, {
                        key: `svg-${index}`,
                        actorIndex: msg.from,
                        yPos: msg.yPos,
                        height: SEQUENCE_HEIGHT * 0.8,
                        dashed: msg.dashed,
                      });
                    } else {
                      return React.createElement(SVGArrow, {
                        key: `svg-${index}`,
                        from: msg.from,
                        to: msg.to,
                        yPos: msg.yPos,
                        dashed: msg.dashed,
                      });
                    }
                  }),
                ]
              ),

              // HTML Labels and Drop Zones for all sequences
              ...allPositionedMessages.flatMap((msg, index, arr) => {
                const prevMsg =
                  index > 0
                    ? arr[index - 1]
                    : arr.find(
                        (m) => m.originalOrderIndex < msg.originalOrderIndex
                      );
                const orderBefore = prevMsg
                  ? prevMsg.originalOrderIndex
                  : msg.originalOrderIndex - 10;

                const dropZone = React.createElement("div", {
                  key: `drop-zone-${msg.sequenceId}`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${msg.yPos - SEQUENCE_HEIGHT / 2}px`,
                  },
                  "data-order-before": orderBefore,
                  "data-order-after": msg.originalOrderIndex,
                  "data-workflow-id": msg.workflowId || "",
                  "data-subgroup-id": msg.subgroupId || "",
                });

                const labelLeft = msg.self
                  ? msg.from * 180 + 90 + 90
                  : ((msg.from + msg.to) / 2) * 180 + 90;
                const labelTop = msg.self
                  ? msg.yPos + (SEQUENCE_HEIGHT * 0.8) / 2 - 12
                  : msg.yPos - 35;

                const sequenceLabel = React.createElement(
                  "div",
                  {
                    key: `label-${msg.sequenceId}`,
                    className: "message-label sequence-label",
                    style: {
                      position: "absolute",
                      left: `${labelLeft}px`,
                      top: `${labelTop}px`,
                      transform: "translateX(-50%)",
                      zIndex: 5,
                    },
                    "data-sequence-id": msg.sequenceId,
                    "data-label-text": msg.labelText,
                  },
                  msg.label
                );

                return [dropZone, sequenceLabel];
              }),

              // Nodes for all sequences
              ...allPositionedMessages.flatMap((msg, index) => {
                if (msg.self) {
                  return [
                    React.createElement(SequenceNode, {
                      key: `start-node-${index}`,
                      actorIndex: msg.from,
                      yPos: msg.yPos,
                      color: actors[msg.from].color,
                    }),
                    React.createElement(SequenceNode, {
                      key: `end-node-${index}`,
                      actorIndex: msg.from,
                      yPos: msg.yPos + SEQUENCE_HEIGHT * 0.8,
                      color: actors[msg.from].color,
                    }),
                  ];
                } else {
                  return [
                    React.createElement(SequenceNode, {
                      key: `from-node-${index}`,
                      actorIndex: msg.from,
                      yPos: msg.yPos,
                      color: actors[msg.from].color,
                    }),
                    React.createElement(SequenceNode, {
                      key: `to-node-${index}`,
                      actorIndex: msg.to,
                      yPos: msg.yPos,
                      color: actors[msg.to].color,
                    }),
                  ];
                }
              }),
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

        // Initialize interactive modules
        setTimeout(() => {
          if (window.WorkflowArchitectSequenceDragDrop) {
            window.WorkflowArchitectSequenceDragDrop.init(container);
            console.log("SequenceDiagramRenderer: Drag and drop initialized");
          }
          // Initialize hover logic
          this.initContainerHoverLogic(container);
          console.log("SequenceDiagramRenderer: Container hover logic initialized");
        }, 100); // Small delay to ensure DOM is ready
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
