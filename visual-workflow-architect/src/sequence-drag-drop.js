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

  setupSequenceDragging: function () {
    const sequenceMessages = this.container.querySelectorAll(
      ".message, .sequence-message"
    );

    sequenceMessages.forEach((message) => {
      if (message.dataset.dragSetup === "true") return;
      message.dataset.dragSetup = "true";

      message.draggable = true;

      // DRAG START: Set the dragged item and add a visual class
      message.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        this.draggedSequence = message;
        setTimeout(() => message.classList.add("dragging"), 0);
        e.dataTransfer.setData("text/plain", message.dataset.sequenceId);
      });

      // DRAG END: Clean up all visuals
      message.addEventListener("dragend", (e) => {
        e.stopPropagation();
        // A failsafe to ensure dragging class is removed
        if (this.draggedSequence) {
          this.draggedSequence.classList.remove("dragging");
        }
        document
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
        this.draggedSequence = null;
      });

      // DRAG OVER: Add visual feedback to the potential drop target
      message.addEventListener("dragover", (e) => {
        if (this.draggedSequence && this.draggedSequence !== message) {
          e.preventDefault();
          message.classList.add("drag-over");
        }
      });

      // DRAG LEAVE: Remove visual feedback
      message.addEventListener("dragleave", (e) => {
        message.classList.remove("drag-over");
      });

      // DROP: Handle the reordering logic
      message.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        message.classList.remove("drag-over");
        if (this.draggedSequence) {
          this.handleDrop(message);
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
        newParentId: targetWorkflowId, // Pass the workflowId here
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
