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

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove("drag-over");
        if (this.draggedSequence) {
          // We will implement this in the next step.
          // For now, it just finalizes the drop visually.
          console.log("Dropped on zone:", zone.dataset);
        }
      });
    });
  },

  handleDrop: function (target) {
    if (this.isProcessing || !this.draggedSequence) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedSequence.dataset.sequenceId;
      const targetId = target.dataset.sequenceId;

      if (!draggedId || !targetId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      const allSequences =
        window.WorkflowArchitectDataStore.getSequencesArray();
      const draggedSeq = allSequences.find((s) => s.id === draggedId);
      const targetSeq = allSequences.find((s) => s.id === targetId);

      if (!draggedSeq || !targetSeq) {
        this.isProcessing = false;
        return;
      }

      // ALWAYS determine the workflow from the TARGET sequence. This is the key to fixing both bugs.
      const targetWorkflowId = targetSeq.workflowId;

      let newOrderValue;

      // This logic now correctly handles reordering within a workflow, or dropping into a new one.
      const targetWorkflowSequences = allSequences
        .filter((s) => s.workflowId === targetWorkflowId)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      // We must remove the dragged item if it was already in this list to calculate the index correctly.
      const listWithoutDragged = targetWorkflowSequences.filter(
        (s) => s.id !== draggedId
      );
      const targetIndex = listWithoutDragged.findIndex(
        (item) => item.id === targetId
      );

      if (targetIndex === -1 && listWithoutDragged.length > 0) {
        // Failsafe if target isn't found, drop at the end.
        const lastItem = listWithoutDragged[listWithoutDragged.length - 1];
        newOrderValue = lastItem.orderIndex + 10;
      } else if (listWithoutDragged.length === 0) {
        // Dropping into an empty workflow
        newOrderValue = 10;
      } else {
        // Use mouse position for a more intuitive drop, like the storymapper
        const targetRect = target.getBoundingClientRect();
        const dropOnTopHalf =
          event.clientY < targetRect.top + targetRect.height / 2;

        if (dropOnTopHalf) {
          // Drop BEFORE the target
          if (targetIndex === 0) {
            newOrderValue = listWithoutDragged[targetIndex].orderIndex / 2;
          } else {
            const prevItem = listWithoutDragged[targetIndex - 1];
            newOrderValue =
              (prevItem.orderIndex +
                listWithoutDragged[targetIndex].orderIndex) /
              2;
          }
        } else {
          // Drop AFTER the target
          const nextItem = listWithoutDragged[targetIndex + 1];
          if (nextItem) {
            newOrderValue =
              (listWithoutDragged[targetIndex].orderIndex +
                nextItem.orderIndex) /
              2;
          } else {
            newOrderValue = listWithoutDragged[targetIndex].orderIndex + 10;
          }
        }
      }

      // --- PREPARE A COMPLETE PAYLOAD ---
      const fullSequenceData =
        window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedId);
      if (fullSequenceData) {
        fullSequenceData.order_index_number = newOrderValue;
        // This is the critical fix: ALWAYS include the target workflow ID.
        fullSequenceData.workflow_custom_workflows = targetWorkflowId;
      }

      const payload = {
        entityType: "sequence",
        entityId: draggedId,
        // Tell Bubble to update both fields, preventing data loss.
        fieldName: "order_index_and_workflow",
        newValue: newOrderValue,
        workflowId: targetWorkflowId, // CORRECTED: Renamed 'newParentId' to 'workflowId' for backend compatibility
        oldValue: draggedSeq.orderIndex,
        allData: fullSequenceData,
      };

      // --- DISPATCH AND RENDER ---
      // 1. Optimistically update the local data store, including the new workflow.
      const localSeq = window.WorkflowArchitectDataStore.getSequence(draggedId);
      if (localSeq) {
        localSeq.workflowId = targetWorkflowId;
      }
      window.WorkflowArchitectDataStore.updateSequenceOrder(
        draggedId,
        newOrderValue
      );

      // 2. Trigger an immediate, optimistic re-render.
      document.dispatchEvent(
        new CustomEvent("workflow-architect:rerender", { detail: {} })
      );

      // 3. Send the complete update to Bubble.
      if (window.WorkflowArchitectEventBridge) {
        window.WorkflowArchitectEventBridge.handleSequenceDragDrop(payload);
      }
    } catch (error) {
      console.error("Error during sequence drop:", error);
    } finally {
      this.isProcessing = false;
      this.draggedSequence = null;
    }
  },

  destroy: function () {
    // This can be expanded if more complex cleanup is needed in the future
    this.draggedSequence = null;
    this.isProcessing = false;
    this.container = null;
  },
};
