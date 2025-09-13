// Visual Workflow Sequence Drag and Drop - Refactored for Simplicity and Reliability
// Follows the proven patterns from the storymapper plugin

window.WorkflowArchitectSequenceDragDrop = {
  draggedSequence: null,
  isProcessing: false,
  container: null,

  init: function (container) {
    this.container = container;
    this.setupSequenceDragging();
  },
  createDragImageCanvas: function (labelText) {
    const PADDING = 10;
    const FONT_SIZE = 14;
    const FONT = `${FONT_SIZE}px Arial`;
    const ARROW_LENGTH = 50;
    const ARROW_HEAD_SIZE = 5;

    // 1. Create a temporary canvas to measure text
    const tempCtx = document.createElement("canvas").getContext("2d");
    tempCtx.font = FONT;
    const textWidth = tempCtx.measureText(labelText).width;

    // 2. Define final canvas dimensions
    const canvas = document.createElement("canvas");
    canvas.width = ARROW_LENGTH + textWidth + PADDING * 2;
    canvas.height = FONT_SIZE + PADDING * 2;
    const ctx = canvas.getContext("2d");

    // 3. Style the drawing
    ctx.font = FONT;
    ctx.fillStyle = "#333";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;

    // 4. Draw the arrow line
    const startY = canvas.height / 2;
    const startX = PADDING;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + ARROW_LENGTH, startY);
    ctx.stroke();

    // 5. Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(startX + ARROW_LENGTH, startY);
    ctx.lineTo(
      startX + ARROW_LENGTH - ARROW_HEAD_SIZE,
      startY - ARROW_HEAD_SIZE
    );
    ctx.lineTo(
      startX + ARROW_LENGTH - ARROW_HEAD_SIZE,
      startY + ARROW_HEAD_SIZE
    );
    ctx.closePath();
    ctx.fill();

    // 6. Draw the text
    ctx.fillText(
      labelText,
      startX + ARROW_LENGTH + PADDING / 2,
      startY + FONT_SIZE / 3
    );

    return canvas;
  },
  setupSequenceDragging: function () {
    const sequenceLabels = this.container.querySelectorAll(".sequence-label");
    const dropZones = this.container.querySelectorAll(".sequence-drop-zone");
    const diagramContainer = this.container.querySelector(".diagram-container");

    // Setup listeners for the draggable labels
    sequenceLabels.forEach((label) => {
      if (label.dataset.dragSetup === "true") return;
      label.dataset.dragSetup = "true";
      label.draggable = true;

      label.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        this.draggedSequence = label;
        setTimeout(() => {
          label.classList.add("dragging");
          if (diagramContainer) {
            // Activate pointer events on drop zones
            diagramContainer.classList.add("sequence-drag-active");
          }
        }, 0);
        e.dataTransfer.setData("text/plain", label.dataset.sequenceId);

        const labelText = label.dataset.labelText || "Sequence";
        const dragImage = this.createDragImageCanvas(labelText);
        dragImage.style.position = "absolute";
        dragImage.style.top = "-1000px";
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 70, 17);
        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 0);
      });

      label.addEventListener("dragend", (e) => {
        e.stopPropagation();
        if (this.draggedSequence) {
          this.draggedSequence.classList.remove("dragging");
        }
        if (diagramContainer) {
          // Deactivate pointer events on drop zones
          diagramContainer.classList.remove("sequence-drag-active");
        }
        // Failsafe cleanup for any leftover visual indicators
        dropZones.forEach((zone) => zone.classList.remove("drag-over"));
        this.draggedSequence = null;
      });
    });

    // Setup listeners for the drop zones
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault(); // This is crucial to allow a drop
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", (e) => {
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", e => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove("drag-over");

        if (!this.draggedSequence || this.isProcessing) return;

        try {
            this.isProcessing = true;
            const draggedId = this.draggedSequence.dataset.sequenceId;
            
            // 1. Read the new position and parent info directly from the drop zone.
            const orderBefore = parseFloat(zone.dataset.orderBefore);
            const orderAfter = parseFloat(zone.dataset.orderAfter);
            const newOrderValue = (orderBefore + orderAfter) / 2;
            const newWorkflowId = zone.dataset.workflowId || null;
            const newSubgroupId = zone.dataset.subgroupId || null;

            // 2. --- FIX: Perform the optimistic UI update FIRST ---
            // This ensures the data store has the correct, new information.
            const localSeq = window.WorkflowArchitectDataStore.getSequence(draggedId);
            if (localSeq) {
                localSeq.orderIndex = newOrderValue;
                localSeq.workflowId = newWorkflowId;
                localSeq.subgroupId = newSubgroupId;
            }
            
            // 3. --- NOW, prepare the payload from the UPDATED data ---
            const fullSequenceData = window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedId);

            const payload = {
                entityType: "sequence",
                entityId: draggedId,
                fieldName: "order_index_and_parents",
                newValue: newOrderValue,
                allData: fullSequenceData, // This will now contain the correct new workflowId
                // Add top-level keys for easy backend parsing
                order_index: newOrderValue,
                workflowId: newWorkflowId,
                subgroupId: newSubgroupId
            };

            // 4. Dispatch events to re-render and save to Bubble.
            document.dispatchEvent(new CustomEvent("workflow-architect:rerender", { detail: {} }));
            if (window.WorkflowArchitectEventBridge) {
                window.WorkflowArchitectEventBridge.handleSequenceDragDrop(payload);
            }
        } catch (error) {
            console.error("Error during sequence drop:", error);
        } finally {
            this.isProcessing = false;
        }
      });
    });
  },

  destroy: function () {
    // This can be expanded if more complex cleanup is needed in the future
    this.draggedSequence = null;
    this.isProcessing = false;
    this.container = null;
  },
};
