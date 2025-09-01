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
  addStyles: function () {
    const styleId = "sequence-diagram-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .sequence-diagram-container {
        width: 100%;
        height: 100vh;
        max-height: none;
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
        height: 100vh;
        min-height: 600px;
        overflow-x: auto;
        overflow-y: scroll;
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
      .workflow-background {
        position: absolute;
        background: rgba(227, 242, 253, 0.3); /* Light blue with transparency */
        border: 2px solid #e3f2fd;
        border-radius: 8px;
        z-index: 1; /* Above diagram background but behind sequences */
        pointer-events: none;
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
      labelText,
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
              "data-label-text": labelText,
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
      labelText,
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
              "data-label-text": labelText,
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
    let containers, sequences, workflows;
    if (
      window.WorkflowArchitectDataStore &&
      window.WorkflowArchitectDataStore.data.isInitialized
    ) {
      containers = window.WorkflowArchitectDataStore.getContainersArray();
      sequences = window.WorkflowArchitectDataStore.getSequencesArray();
      // Use the proper method to get workflows as array, then convert to object for compatibility
      const workflowsArray = window.WorkflowArchitectDataStore.getWorkflowsArray();
      workflows = {};
      workflowsArray.forEach(workflow => {
        workflows[workflow.id] = workflow;
      });
      
      console.log("DEBUG - Workflows loaded from data store:", {
        workflowsArrayLength: workflowsArray.length,
        workflowsObject: workflows,
        workflowIds: Object.keys(workflows)
      });
    } else {
      containers = data.containers || [];
      sequences = data.sequences || [];
      workflows = {};

      // Transform raw Bubble workflow data if available
      if (data.workflows && Array.isArray(data.workflows)) {
        data.workflows.forEach((workflow) => {
          if (workflow && typeof workflow.get === "function") {
            const transformedWorkflow = {
              id: workflow.get("_id"),
              name:
                workflow.get("name_text") ||
                workflow.get("label") ||
                "New Workflow",
              colorHex: workflow.get("color_hex_text") || "#e3f2fd",
              description: workflow.get("description_text") || "",
              orderIndex: workflow.get("order_index_number") || 0,
            };
            workflows[transformedWorkflow.id] = transformedWorkflow;
          }
        });
      }
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

    // Group sequences by workflow
    const groupSequencesByWorkflow = (sequences, workflows) => {
      const workflowGroups = {};
      const ungroupedSequences = [];

      sequences.forEach((sequence) => {
        if (sequence.workflowId && workflows[sequence.workflowId]) {
          if (!workflowGroups[sequence.workflowId]) {
            workflowGroups[sequence.workflowId] = {
              workflow: workflows[sequence.workflowId],
              sequences: [],
            };
          }
          workflowGroups[sequence.workflowId].sequences.push(sequence);
        } else {
          ungroupedSequences.push(sequence);
        }
      });

      return { workflowGroups, ungroupedSequences };
    };

    // workflows variable is already declared above in the data loading section

    // Group sequences by workflow
    const { workflowGroups, ungroupedSequences } = groupSequencesByWorkflow(
      sequences,
      workflows
    );

    console.log("DEBUG - Workflow grouping:", {
      workflowGroups: Object.keys(workflowGroups),
      ungroupedCount: ungroupedSequences.length,
      totalWorkflows: Object.keys(workflows).length,
      workflowData: workflows,
      sequenceWorkflowIds: sequences.map((s) => ({
        id: s.id,
        workflowId: s.workflowId,
      })),
    });

    // Calculate workflow boundaries from sequence positions
    const calculateWorkflowBounds = (workflowGroups, positionedMessages) => {
      const workflowBounds = {};

      Object.keys(workflowGroups).forEach((workflowId) => {
        const workflowSequences = workflowGroups[workflowId].sequences;
        const sequencePositions = positionedMessages.filter((msg) =>
          workflowSequences.some((seq) => seq.id === msg.id)
        );

        if (sequencePositions.length > 0) {
          const minY =
            Math.min(...sequencePositions.map((pos) => pos.yPos)) - 30;
          const maxY =
            Math.max(...sequencePositions.map((pos) => pos.yPos)) + 50;
          const minX = 0;
          const maxX = actors.length * 180;

          workflowBounds[workflowId] = {
            x: minX,
            y: minY,
            width: maxX,
            height: maxY - minY,
            workflow: workflowGroups[workflowId].workflow,
          };
        }
      });

      return workflowBounds;
    };

    // Process sequences and create positioned messages
    const positionedMessages = sequences
      .map((sequence, index) => {
        const fromActor = actors.find(
          (a) =>
            a.id === (sequence.fromContainerId || sequence.from_container_id)
        );
        const toActor = actors.find(
          (a) => a.id === (sequence.toContainerId || sequence.to_container_id)
        );

        const orderIndex =
          sequence.order_number || sequence.order_index || index + 1;
        let labelText = sequence.label_text || sequence.label || "Sequence";

        // Debug logging to see what's happening
        console.log("DEBUG - Processing sequence:", {
          id: sequence.id,
          raw_label_text: sequence.label_text,
          raw_label: sequence.label,
          orderIndex: orderIndex,
          labelText_before_strip: labelText,
          workflowId: sequence.workflowId,
        });

        // Strip any existing order index prefix from label text to prevent duplication
        // Matches patterns like "1. ", "2. ", etc. at the start of the string
        labelText = labelText.replace(/^\d+\.\s*/, "");

        console.log("DEBUG - After stripping:", {
          labelText_after_strip: labelText,
          final_label: `${orderIndex}. ${labelText}`,
        });

        if (!fromActor || !toActor) {
          console.warn("DEBUG - Skipping sequence due to missing actors:", {
            sequenceId: sequence.id,
            fromActor: !!fromActor,
            toActor: !!toActor,
          });
          return null;
        }

        return {
          label: `${orderIndex}. ${labelText}`,
          labelText: labelText, // Pure label text for editing
          yPos: 130 + index * 150,
          from: actors.indexOf(fromActor),
          to: actors.indexOf(toActor),
          dashed:
            sequence.dashed_text === "true" ||
            sequence.is_dashed_boolean ||
            sequence.isDashed ||
            false,
          self: fromActor.id === toActor.id,
          id: sequence.id || sequence.sequence_id,
          workflowId: sequence.workflowId, // Add workflow ID to positioned message
        };
      })
      .filter((msg) => msg !== null);

    // Calculate workflow boundaries
    const workflowBounds = calculateWorkflowBounds(
      workflowGroups,
      positionedMessages
    );

    console.log("DEBUG - Workflow bounds:", workflowBounds);
    console.log(
      "DEBUG - Workflow bounds count:",
      Object.keys(workflowBounds).length
    );
    console.log(
      "DEBUG - Positioned messages count:",
      positionedMessages.length
    );

    // Update container height based on content
    const containerHeight = Math.max(
      600,
      130 + positionedMessages.length * 150 + 100
    );

    const actorsCount = actors.length;

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
              // Workflow backgrounds (render first, behind everything)
              ...Object.keys(workflowBounds).map((workflowId) =>
                React.createElement(
                  "div",
                  {
                    key: `workflow-${workflowId}`,
                    className: "workflow-background",
                    style: {
                      left: `${workflowBounds[workflowId].x}px`,
                      top: `${workflowBounds[workflowId].y}px`,
                      width: `${workflowBounds[workflowId].width}px`,
                      height: `${workflowBounds[workflowId].height}px`,
                      backgroundColor:
                        (workflowBounds[workflowId].workflow.colorHex ||
                          "#e3f2fd") + "30",
                    },
                  },
                  [
                    React.createElement(
                      "div",
                      {
                        key: "label",
                        className: "workflow-label",
                        style: {
                          backgroundColor:
                            workflowBounds[workflowId].workflow.colorHex ||
                            "#4caf50",
                        },
                      },
                      workflowBounds[workflowId].workflow.name || "Workflow"
                    ),
                  ]
                )
              ),

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
                  const sequencedLabel = msg.label; // Use the already formatted label

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
                        labelText: msg.labelText,
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
                        labelText: msg.labelText,
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
