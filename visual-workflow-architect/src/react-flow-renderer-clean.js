// Visual Workflow Architect - Proper Sequence Diagram Renderer
// Based on SequenceFlow.html structure using React + CSS positioning (NOT React Flow)

// Add rerender event listener (following storymap-grid pattern)
document.addEventListener("workflow-architect:rerender", function (event) {
  // Find the container and re-render
  const container = document.getElementById("sequence-diagram-container");

  if (container && window.SequenceDiagramRenderer) {
    // Clear existing content
    container.innerHTML = "";

    // Re-render with new data
    window.SequenceDiagramRenderer.render(container, event.detail);
  } else {
    console.warn("RERENDER: Container or renderer not found for rerender");
  }
});

// Initialize inline editing modules
if (window.WorkflowArchitectInlineEdit) {
  window.WorkflowArchitectInlineEdit.init();
}

// Initialize workflow inline editing module
if (window.WorkflowArchitectWorkflowInlineEdit) {
  window.WorkflowArchitectWorkflowInlineEdit.init();
}

window.SequenceDiagramRenderer = {
  // Initialize the renderer
  init: function (containerId) {
    this.containerId = containerId;
    this.isInitialized = true;
    return true;
  },

  // Step 1: Add CSS styles to document (now empty - styles moved to main.css)
  addStyles: function (containerHeight = 600) {
    return;
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

  // JavaScript logic to handle hover with delay
  initContainerHoverLogic: function (container) {
    const wrappers = container.querySelectorAll(".container-master-wrapper");
    wrappers.forEach((wrapper) => {
      if (wrapper.dataset.hoverInit === "true") return;
      wrapper.dataset.hoverInit = "true";

      const icons = wrapper.querySelectorAll(
        ".container-icon-button, .add-container-btn"
      );
      let hideTimer;

      const showIcons = () => {
        clearTimeout(hideTimer);
        wrapper.classList.add("is-visible");
      };

      const startHideTimer = () => {
        hideTimer = setTimeout(() => {
          wrapper.classList.remove("is-visible");
        }, 300); // 300ms delay
      };

      wrapper.addEventListener("mouseenter", showIcons);
      wrapper.addEventListener("mouseleave", startHideTimer);

      icons.forEach((icon) => {
        icon.addEventListener("mouseenter", showIcons);
        icon.addEventListener("mouseleave", startHideTimer);
      });
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
    const WORKFLOW_PADDING_TOP = 80;
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

        // Adjust Y increment based on sequence type - self-messages need more space
        const yIncrement = isSelfMessage
          ? SEQUENCE_HEIGHT * 1.4
          : SEQUENCE_HEIGHT;
        currentY += yIncrement;
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

    const handleAddContainerAfter = (index) => {
      const feature = window.WorkflowArchitectDataStore?.getFeature();
      if (!feature || !feature.id) {
        return;
      }

      console.log("Adding container after index:", index);
      const containers =
        window.WorkflowArchitectDataStore?.getContainersArray() || [];
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
      const nextOrderIndex = allPositionedMessages.length + 1;

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
        window.WorkflowArchitectEventBridge.handleWorkflowAdd(newWorkflowData);
      }
    };

    const handleAddWorkflowAfter = (currentOrderIndex) => {
      console.log(
        "Add Workflow After clicked - order index:",
        currentOrderIndex
      );

      const feature = window.WorkflowArchitectDataStore?.getFeature();
      if (!feature || !feature.id) {
        console.error("No feature ID available for new workflow");
        return;
      }

      // Get all workflows to calculate proper order index
      const allWorkflows =
        window.WorkflowArchitectDataStore?.getWorkflowsArray() || [];

      // Find the next workflow after the current one
      const sortedWorkflows = allWorkflows.sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
      );
      const currentIndex = sortedWorkflows.findIndex(
        (w) => (w.orderIndex || 0) === currentOrderIndex
      );

      let newOrderIndex;
      if (currentIndex >= 0 && currentIndex < sortedWorkflows.length - 1) {
        // There is a next workflow, insert between current and next
        const nextWorkflow = sortedWorkflows[currentIndex + 1];
        const nextOrder = nextWorkflow.orderIndex || (currentIndex + 2) * 10;
        newOrderIndex = (currentOrderIndex + nextOrder) / 2;
      } else {
        // This is the last workflow, add after it
        newOrderIndex = currentOrderIndex + 10;
      }

      console.log("Calculated new workflow order index:", newOrderIndex);

      const newWorkflowData = {
        name: "New Workflow",
        featureId: feature.id,
        orderIndex: newOrderIndex,
        colorHex: "#4caf50",
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
                key: "add-workflow",
                className: "toolbar-button",
                onClick: handleAddWorkflow,
              },
              "+ Add Workflow"
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
              // Render Actor Lanes first, they are the base layer
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
                        key: `wrapper-${actor.id}`,
                        className: "container-master-wrapper",
                      },
                      [
                        React.createElement(
                          "h3",
                          {
                            key: "title",
                            className: "container-name",
                            "data-container-id": actor.id,
                            "data-label-text": actor.name,
                            title: "Double-click to edit",
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
                                "data-container-id": actor.id,
                                "data-label-text": actor.name,
                                title: "Double-click to edit",
                              },
                              actor.name
                            ),
                          ]
                        ),
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

              // Render all workflow backgrounds
              ...Object.values(allWorkflowBounds).map((bounds) => {
                if (bounds.isEmpty) {
                  return React.createElement(
                    "div",
                    {
                      key: `empty-wf-${bounds.workflow.id}`,
                      className:
                        "workflow-background empty-workflow-background",
                      style: {
                        position: "absolute",
                        left: `${bounds.x}px`,
                        top: `${bounds.y}px`,
                        width: bounds.width,
                        height: `${bounds.height}px`,
                        backgroundColor:
                          (bounds.workflow.colorHex || "#e3f2fd") + "1A",
                        borderColor:
                          (bounds.workflow.colorHex || "#e3f2fd") + "33",
                      },
                    },
                    [
                      React.createElement(
                        "h4",
                        { key: "title", className: "empty-workflow-title" },
                        bounds.workflow.name || "Workflow"
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "drop-zone",
                          className:
                            "empty-workflow-drop-message sequence-drop-zone",
                          "data-order-before": 0,
                          "data-order-after": 20,
                          "data-workflow-id": bounds.workflow.id,
                          "data-subgroup-id": "",
                        },
                        "Drop Sequence Here"
                      ),
                    ]
                  );
                } else {
                  return React.createElement(
                    "div",
                    {
                      key: `wf-bg-${bounds.workflow.id}`,
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
                    [
                      React.createElement(
                        "div",
                        {
                          key: "label",
                          className: "workflow-label",
                          style: {
                            backgroundColor:
                              bounds.workflow.colorHex || "#4caf50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          },
                          "data-workflow-id": bounds.workflow.id,
                          "data-label-text": bounds.workflow.name || "Workflow",
                          title: "Double-click to edit workflow",
                        },
                        [
                          React.createElement(
                            "span",
                            {
                              key: "doc-icon",
                              className: "doc-icon",
                              style: {
                                fontSize: "14px",
                              },
                            },
                            "📄"
                          ),
                          React.createElement(
                            "span",
                            {
                              key: "text",
                              style: {
                                flex: "1",
                              },
                            },
                            bounds.workflow.name || "Workflow"
                          ),
                        ]
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "add-workflow-plus",
                          className: "add-workflow-plus-icon",
                          style: {
                            position: "absolute",
                            bottom: "-15px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#4caf50",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            zIndex: "10",
                            transition: "all 0.2s ease",
                          },
                          "data-workflow-order":
                            bounds.workflow.orderIndex || 0,
                          onClick: (e) =>
                            handleAddWorkflowAfter(
                              bounds.workflow.orderIndex || 0
                            ),
                          onMouseEnter: (e) => {
                            e.target.style.transform =
                              "translateX(-50%) scale(1.1)";
                            e.target.style.backgroundColor = "#45a049";
                          },
                          onMouseLeave: (e) => {
                            e.target.style.transform =
                              "translateX(-50%) scale(1)";
                            e.target.style.backgroundColor = "#4caf50";
                          },
                        },
                        "+"
                      ),
                    ]
                  );
                }
              }),

              // Add top and bottom drop zones for populated workflows
              ...Object.values(allWorkflowBounds).flatMap((bounds) => {
                if (bounds.isEmpty) return []; // Skip empty workflows - they already have their own drop zone

                const workflowSequences = allPositionedMessages.filter(
                  (msg) => msg.workflowId === bounds.workflow.id
                );
                if (workflowSequences.length === 0) return []; // No sequences in this workflow

                const firstSequence = workflowSequences[0];
                const lastSequence =
                  workflowSequences[workflowSequences.length - 1];

                const topDropZone = React.createElement("div", {
                  key: `top-drop-zone-${bounds.workflow.id}`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${bounds.y + 30}px`, // Position below workflow label
                  },
                  "data-order-before": firstSequence.originalOrderIndex - 10,
                  "data-order-after": firstSequence.originalOrderIndex,
                  "data-workflow-id": bounds.workflow.id,
                  "data-subgroup-id": "",
                });

                const bottomDropZone = React.createElement("div", {
                  key: `bottom-drop-zone-${bounds.workflow.id}`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${bounds.y + bounds.height - 30}px`, // Position near workflow bottom
                  },
                  "data-order-before": lastSequence.originalOrderIndex,
                  "data-order-after": lastSequence.originalOrderIndex + 10,
                  "data-workflow-id": bounds.workflow.id,
                  "data-subgroup-id": "",
                });

                return [topDropZone, bottomDropZone];
              }),

              // SVG Overlay to contain all arrows
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

              // HTML elements (Labels, Nodes, Drop Zones)
              ...allPositionedMessages.flatMap((msg, index, arr) => {
                const prevMsg = arr[index - 1];
                const nextMsg = arr[index + 1];
                const isLastSequence = index === arr.length - 1;

                const orderBefore = prevMsg
                  ? prevMsg.originalOrderIndex
                  : msg.originalOrderIndex - 10;

                // Drop zone BEFORE this sequence
                const dropZoneBefore = React.createElement("div", {
                  key: `drop-zone-before-${msg.sequenceId}`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${msg.yPos - SEQUENCE_HEIGHT / 4}px`,
                  },
                  "data-order-before": orderBefore,
                  "data-order-after": msg.originalOrderIndex,
                  "data-workflow-id": msg.workflowId || "",
                  "data-subgroup-id": msg.subgroupId || "",
                });

                // Drop zone AFTER this sequence (especially important for last sequence)
                const dropZoneAfter = React.createElement("div", {
                  key: `drop-zone-after-${msg.sequenceId}`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${msg.yPos + SEQUENCE_HEIGHT / 2}px`,
                  },
                  "data-order-before": msg.originalOrderIndex,
                  "data-order-after": nextMsg
                    ? nextMsg.originalOrderIndex
                    : msg.originalOrderIndex + 10,
                  "data-workflow-id": msg.workflowId || "",
                  "data-subgroup-id": msg.subgroupId || "",
                });

                const labelLeft = msg.self
                  ? msg.from * 180 + 90 + 50
                  : ((msg.from + msg.to) / 2) * 180 + 90;
                const labelTop = msg.self
                  ? msg.yPos + (SEQUENCE_HEIGHT * 0.8) / 2
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
                      transform: "translate(-50%, -50%)",
                      zIndex: 5,
                    },
                    "data-sequence-id": msg.sequenceId,
                    "data-label-text": msg.labelText,
                  },
                  msg.label
                );

                const nodes = msg.self
                  ? [
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
                    ]
                  : [
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

                return [dropZoneBefore, sequenceLabel, ...nodes, dropZoneAfter];
              }),

              // Final drop zone after the last item
              (() => {
                if (
                  allPositionedMessages.length === 0 &&
                  emptyWorkflows.length === 0
                )
                  return null;
                let lastY = 0;
                let lastItemOrderIndex = 0;
                let lastItemWorkflowId = "";
                let lastItemSubgroupId = "";

                if (allPositionedMessages.length > 0) {
                  const lastMsg =
                    allPositionedMessages[allPositionedMessages.length - 1];
                  lastY = lastMsg.yPos + SEQUENCE_HEIGHT / 2;
                  lastItemOrderIndex = lastMsg.originalOrderIndex;
                  lastItemWorkflowId = lastMsg.workflowId || "";
                  lastItemSubgroupId = lastMsg.subgroupId || "";
                } else if (emptyWorkflows.length > 0) {
                  // If there are only empty workflows, the last Y is the bottom of the last empty workflow
                  const lastWorkflowBounds =
                    allWorkflowBounds[
                      emptyWorkflows[emptyWorkflows.length - 1].id
                    ];
                  lastY = lastWorkflowBounds.y + lastWorkflowBounds.height + 20;
                  lastItemOrderIndex = 10; // A default starting order
                  lastItemWorkflowId =
                    emptyWorkflows[emptyWorkflows.length - 1].id;
                }

                return React.createElement("div", {
                  key: `drop-zone-final`,
                  className: "sequence-drop-zone",
                  style: {
                    left: "10px",
                    width: "calc(100% - 20px)",
                    top: `${lastY}px`,
                  },
                  "data-order-before": lastItemOrderIndex,
                  "data-order-after": lastItemOrderIndex + 20,
                  "data-workflow-id": lastItemWorkflowId,
                  "data-subgroup-id": lastItemSubgroupId,
                });
              })(),
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
          console.log(
            "SequenceDiagramRenderer: Container hover logic initialized"
          );
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

window.WorkflowArchitectRenderer = window.SequenceDiagramRenderer;
