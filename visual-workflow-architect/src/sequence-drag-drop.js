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
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedSequence.dataset.sequenceId;
      const targetId = target.dataset.sequenceId;

      if (!draggedId || !targetId || draggedId === targetId) {
        return;
      }

      const allSequences =
        window.WorkflowArchitectDataStore.getSequencesArray();
      const draggedSeq = allSequences.find((s) => s.id === draggedId);

      if (!draggedSeq) {
        console.error("Dragged sequence not found in data store");
        return;
      }

      const workflowId = draggedSeq.workflowId;
      const sortedList = allSequences
        .filter((s) => s.workflowId === workflowId)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const draggedIndex = sortedList.findIndex(
        (item) => item.id === draggedId
      );
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return;
      }

      let newOrderValue;
      const targetItem = sortedList[targetIndex];

      // --- PROVEN RE-INDEXING LOGIC FROM STORYMAPPER ---
      if (draggedIndex > targetIndex) {
        if (targetIndex === 0) {
          newOrderValue = targetItem.orderIndex / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.orderIndex + targetItem.orderIndex) / 2;
        }
      } else {
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          newOrderValue = (targetItem.orderIndex + nextItem.orderIndex) / 2;
        } else {
          newOrderValue = targetItem.orderIndex + 10;
        }
      }

      const fullSequenceData =
        window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedId);
      if (fullSequenceData) {
        fullSequenceData.order_index_number = newOrderValue;
      }

      const payload = {
        entityType: "sequence",
        entityId: draggedId,
        fieldName: "order_index_number",
        newValue: newOrderValue,
        oldValue: draggedSeq.orderIndex,
        allData: fullSequenceData,
      };

      window.WorkflowArchitectDataStore.updateSequenceOrder(
        draggedId,
        newOrderValue
      );

      // Let the main update function handle the re-render by detecting the hash change
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
