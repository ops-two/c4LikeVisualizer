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
        border-radius: 6px;
        padding: 8px 16px;
        margin-top: 20px;
        font-weight: 500;
        font-size: 13px;
        max-width: 140px;
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
        min-height: 600px;
        border-left: 2px dotted #cccccc; /* Create the line using a dotted border */
        z-index: 0;
      }
      
    .sequence-node {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%; /* This makes it a circle */
        border: 2px solid white;
        transform: translate(-50%, -50%);
        z-index: 2; /* Ensure it's above the lifeline */
        box-shadow: 0 0 5px rgba(0,0,0,0.1);
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

    // Get containers, sequences, workflows, and subgroups from data store or use provided data
    let containers, sequences, workflows, subgroups;
    if (
      window.WorkflowArchitectDataStore &&
      window.WorkflowArchitectDataStore.data.isInitialized
    ) {
      containers = window.WorkflowArchitectDataStore.getContainersArray();
      sequences = window.WorkflowArchitectDataStore.getSequencesArray();

      // Use the proper method to get workflows as array, then convert to object for compatibility
      const workflowsArray =
        window.WorkflowArchitectDataStore.getWorkflowsArray();
      workflows = {};
      workflowsArray.forEach((workflow) => {
        workflows[workflow.id] = workflow;
      });

      // Get subgroups as array, then convert to object for compatibility
      const subgroupsArray =
        window.WorkflowArchitectDataStore.getSubgroupsArray();
      subgroups = {};
      subgroupsArray.forEach((subgroup) => {
        subgroups[subgroup.id] = subgroup;
      });

      console.log("DEBUG - Data loaded from store:", {
        workflowsCount: workflowsArray.length,
        subgroupsCount: subgroupsArray.length,
        workflowIds: Object.keys(workflows),
        subgroupIds: Object.keys(subgroups),
        rawSubgroupsArray: subgroupsArray,
        subgroupsObject: subgroups,
        sequencesWithSubgroups: sequences.filter((s) => s.subgroupId).length,
        allSequenceSubgroupIds: sequences
          .map((s) => s.subgroupId)
          .filter(Boolean),
        firstSequenceDetails: sequences[0]
          ? {
              id: sequences[0].id,
              subgroupId: sequences[0].subgroupId,
              workflowId: sequences[0].workflowId,
              allFields: Object.keys(sequences[0]),
            }
          : null,
      });
    } else {
      containers = data.containers || [];
      sequences = data.sequences || [];
      workflows = {};
      subgroups = {};

      // Transform raw Bubble workflow data if available
      if (data.workflows && Array.isArray(data.workflows)) {
        data.workflows.forEach((workflow) => {
          if (workflow && typeof workflow.get === "function") {
            const transformedWorkflow = {
              id: workflow.get("_id"),
              name: workflow.get("label_text") || "New Workflow",
              colorHex: workflow.get("color_hex_text") || "#e3f2fd",
              description: workflow.get("description_text") || "",
              orderIndex: workflow.get("order_index_number") || 0,
            };
            workflows[transformedWorkflow.id] = transformedWorkflow;
          }
        });
      }

      // Transform raw Bubble subgroup data if available
      if (data.subgroups && Array.isArray(data.subgroups)) {
        data.subgroups.forEach((subgroup) => {
          if (subgroup && typeof subgroup.get === "function") {
            const workflowRef = subgroup.get("Workflow");
            const transformedSubgroup = {
              id: subgroup.get("_id"),
              label: subgroup.get("Label") || "New Subgroup",
              colorHex: subgroup.get("color_Hex") || "#f5f5f5",
              workflowId: workflowRef ? workflowRef.get("_id") : null,
              // No orderIndex needed for subgroups
            };
            subgroups[transformedSubgroup.id] = transformedSubgroup;
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

    console.log("DEBUG - Actors created:", actors.length);
    console.log("DEBUG - About to start sequence grouping...");

    // Group sequences by workflow and subgroup (nested structure)
    const groupSequencesByWorkflowAndSubgroup = (
      sequences,
      workflows,
      subgroups
    ) => {
      const workflowGroups = {};
      const ungroupedSequences = [];

      sequences.forEach((sequence) => {
        if (sequence.workflowId && workflows[sequence.workflowId]) {
          // Initialize workflow group if not exists
          if (!workflowGroups[sequence.workflowId]) {
            workflowGroups[sequence.workflowId] = {
              workflow: workflows[sequence.workflowId],
              subgroups: {},
              ungroupedSequences: [],
            };
          }

          const workflowGroup = workflowGroups[sequence.workflowId];

          if (sequence.subgroupId && subgroups[sequence.subgroupId]) {
            // Sequence belongs to a subgroup within this workflow
            if (!workflowGroup.subgroups[sequence.subgroupId]) {
              workflowGroup.subgroups[sequence.subgroupId] = {
                subgroup: subgroups[sequence.subgroupId],
                sequences: [],
              };
            }
            workflowGroup.subgroups[sequence.subgroupId].sequences.push(
              sequence
            );
          } else {
            // Sequence belongs to workflow but no subgroup
            workflowGroup.ungroupedSequences.push(sequence);
          }
        } else {
          // Sequence has no workflow
          ungroupedSequences.push(sequence);
        }
      });

      return { workflowGroups, ungroupedSequences };
    };

    // Group sequences by workflow and subgroup
    console.log("DEBUG - Calling groupSequencesByWorkflowAndSubgroup...");
    const { workflowGroups, ungroupedSequences } =
      groupSequencesByWorkflowAndSubgroup(sequences, workflows, subgroups);
    console.log("DEBUG - Sequence grouping completed successfully");

    // Add margin between workflow groups and subgroups (matching mockup spacing)
    const WORKFLOW_MARGIN = 20;
    const SUBGROUP_MARGIN = 10;

    // Calculate workflow and subgroup boundaries from sequence positions
    const calculateNestedBounds = (workflowGroups, positionedMessages) => {
      const workflowBounds = {};
      const subgroupBounds = {};

      Object.keys(workflowGroups).forEach((workflowId) => {
        const workflowGroup = workflowGroups[workflowId];
        let allWorkflowSequences = [...workflowGroup.ungroupedSequences];

        // Calculate subgroup bounds first - optimized to span only relevant actor lanes
        Object.keys(workflowGroup.subgroups).forEach((subgroupId) => {
          const subgroupData = workflowGroup.subgroups[subgroupId];
          const subgroupSequencePositions = positionedMessages.filter((msg) =>
            subgroupData.sequences.some((seq) => seq.id === msg.sequenceId)
          );

          if (subgroupSequencePositions.length > 0) {
            const minY = Math.min(
              ...subgroupSequencePositions.map((pos) => pos.yPos)
            );
            const maxY = Math.max(
              ...subgroupSequencePositions.map((pos) => pos.yPos)
            );

            // Calculate involved actor indices for precise bounds
            const involvedActorIndices = [];
            subgroupSequencePositions.forEach((pos) => {
              involvedActorIndices.push(pos.from, pos.to);
            });
            const uniqueActorIndices = [...new Set(involvedActorIndices)];
            const minActorIndex = Math.min(...uniqueActorIndices);
            const maxActorIndex = Math.max(...uniqueActorIndices);

            // Calculate precise bounds spanning only involved lanes
            const LANE_WIDTH = 180;
            const LANE_PADDING = 45;
            const minX = minActorIndex * LANE_WIDTH + LANE_PADDING;
            const maxX = (maxActorIndex + 1) * LANE_WIDTH - LANE_PADDING;
            const width = maxX - minX;

            console.log(`DEBUG - Subgroup ${subgroupId} bounds:`, {
              involvedActors: uniqueActorIndices,
              minActorIndex,
              maxActorIndex,
              minX,
              maxX,
              width,
              sequences: subgroupData.sequences.length,
            });

            subgroupBounds[subgroupId] = {
              x: minX,
              y: minY - 35,
              width: width,
              height: maxY - minY + 90,
              subgroup: subgroupData.subgroup,
            };
          }

          // Add subgroup sequences to workflow total
          allWorkflowSequences = allWorkflowSequences.concat(
            subgroupData.sequences
          );
        });

        // Calculate workflow bounds encompassing all sequences (grouped and ungrouped)
        const allWorkflowPositions = positionedMessages.filter((msg) =>
          allWorkflowSequences.some((seq) => seq.id === msg.sequenceId)
        );

        if (allWorkflowPositions.length > 0) {
          const minY = Math.min(...allWorkflowPositions.map((pos) => pos.yPos));
          const maxY = Math.max(...allWorkflowPositions.map((pos) => pos.yPos));
          const minX = 0;
          const maxX = actors.length * 180;

          workflowBounds[workflowId] = {
            x: minX,
            y: minY - 50,
            width: maxX,
            height: maxY - minY + 140,
            workflow: workflowGroup.workflow,
          };
        }
      });

      return { workflowBounds, subgroupBounds };
    };

    console.log("DEBUG - Nested grouping:", {
      workflowGroups: Object.keys(workflowGroups),
      ungroupedCount: ungroupedSequences.length,
      totalWorkflows: Object.keys(workflows).length,
      totalSubgroups: Object.keys(subgroups).length,
      workflowData: workflows,
      subgroupData: subgroups,
      nestedStructure: Object.keys(workflowGroups).map((wId) => ({
        workflowId: wId,
        subgroupCount: Object.keys(workflowGroups[wId].subgroups).length,
        ungroupedSequenceCount: workflowGroups[wId].ungroupedSequences.length,
      })),
      sequenceSubgroupIds: sequences.map((s) => ({
        id: s.id,
        subgroupId: s.subgroupId,
        workflowId: s.workflowId,
      })),
    });

    // Create positioned messages from sequences
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
          sequenceId: sequence.id,
          workflowId: sequence.workflowId,
          subgroupId: sequence.subgroupId,
        };
      })
      .filter((msg) => msg !== null);

    // Calculate workflow and subgroup boundaries
    const { workflowBounds, subgroupBounds } = calculateNestedBounds(
      workflowGroups,
      positionedMessages
    );

    console.log("DEBUG - Nested bounds:", {
      workflowBounds: workflowBounds,
      subgroupBounds: subgroupBounds,
      workflowCount: Object.keys(workflowBounds).length,
      subgroupCount: Object.keys(subgroupBounds).length,
      positionedMessagesCount: positionedMessages.length,
    });

    // Update container height based on content
    const containerHeight = Math.max(
      600,
      130 + positionedMessages.length * 150 + 100
    );

    const actorsCount = actors.length;

    // Create components
    const SequenceNode = this.createSequenceNode(); // Use the new function

    const Message = this.createMessage();
    const SelfMessage = this.createSelfMessage();

    // Toolbar event handlers
    // ... existing code
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
              React.createElement(
                "button",
                {
                  key: "add-subgroup",
                  className: "toolbar-button",
                  onClick: handleAddSubgroup,
                  disabled: Object.keys(workflows).length === 0,
                },
                "+ Add Subgroup"
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
                          "#e3f2fd") + "1A", // 0.10 opacity in hex
                      borderColor:
                        (workflowBounds[workflowId].workflow.colorHex ||
                          "#e3f2fd") + "33", // 0.2 opacity in hex
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

              // Subgroup backgrounds (render after workflows, before actor lanes)
              ...Object.keys(subgroupBounds).map((subgroupId) => {
                return React.createElement(
                  "div",
                  {
                    key: `subgroup-${subgroupId}`,
                    className: "subgroup-background",
                    style: {
                      left: `${subgroupBounds[subgroupId].x}px`,
                      top: `${subgroupBounds[subgroupId].y}px`,
                      width: `${subgroupBounds[subgroupId].width}px`,
                      height: `${subgroupBounds[subgroupId].height}px`,
                      backgroundColor:
                        (subgroupBounds[subgroupId].subgroup.colorHex ||
                          "#f5f5f5") + "26", // 0.15 opacity in hex
                      borderColor:
                        (subgroupBounds[subgroupId].subgroup.colorHex ||
                          "#f5f5f5") + "80", // 0.5 opacity for better visibility
                      borderStyle: "dashed", // Dashed border for visual distinction
                      borderWidth: "2px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      zIndex: 10, // Above workflows but below sequences
                      pointerEvents: "none", // Disable interaction
                    },
                  },
                  [
                    React.createElement(
                      "div",
                      {
                        key: "label",
                        className: "subgroup-label",
                        style: {
                          backgroundColor:
                            subgroupBounds[subgroupId].subgroup.colorHex ||
                            "#9e9e9e",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          position: "absolute",
                          top: "-12px",
                          left: "8px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          pointerEvents: "none", // Prevent label from interfering with drops
                        },
                      },
                      subgroupBounds[subgroupId].subgroup.label || "Subgroup"
                    ),
                  ]
                );
              }),

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
                        style: {
                          backgroundColor: actor.color + "20", // Use color with ~12% opacity
                          borderColor: actor.color,
                          color: actor.color, // Use the main color for the text
                        },
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
                      React.createElement(SequenceNode, {
                        key: `activation-start-${index}`,
                        actorIndex: msg.from,
                        yPos: msg.yPos,
                        color: actors[msg.from].color,
                        actorsCount: actorsCount,
                      }),
                      React.createElement(SequenceNode, {
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
                        sequenceId: msg.sequenceId,
                        subgroupId: msg.subgroupId,
                        workflowId: msg.workflowId,
                      }),
                    ]);
                  } else {
                    return React.createElement(React.Fragment, { key: index }, [
                      React.createElement(SequenceNode, {
                        key: `activation-from-${index}`,
                        actorIndex: msg.from,
                        yPos: msg.yPos,
                        color: actors[msg.from].color,
                        actorsCount: actorsCount,
                      }),
                      React.createElement(SequenceNode, {
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
                        sequenceId: msg.sequenceId,
                        subgroupId: msg.subgroupId,
                        workflowId: msg.workflowId,
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
