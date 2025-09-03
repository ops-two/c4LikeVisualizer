// Visual Workflow Sequence Drag and Drop Implementation
// Following storymap pattern for consistency

window.WorkflowArchitectSequenceDragDrop = {
  draggedSequence: null,
  isProcessing: false,
  container: null,

  init: function (container) {
    this.container = container;
    this.setupSequenceDragging();
  },

  setupSequenceDragging: function () {
    console.log("Setting up sequence dragging...");

    // Setup dragging for sequence messages - target both .message and .sequence-message classes
    const sequenceMessages = this.container.querySelectorAll(
      ".message, .sequence-message"
    );
    console.log("Found sequence messages:", sequenceMessages.length);

    sequenceMessages.forEach((message) => {
      if (message.dataset.dragSetup === "true") return;
      message.dataset.dragSetup = "true";

      console.log("Setting up drag for message:", message);

      // Add drag handle
      this.addDragHandle(message);

      message.draggable = true;
      message.addEventListener("dragstart", (e) => {
        console.log("Drag started for:", message);
        this.draggedSequence = message;
        setTimeout(() => message.classList.add("dragging"), 0);
        this.container.classList.add("sequence-drag-active");

        // Store sequence data for drop calculations
        e.dataTransfer.setData("text/plain", message.dataset.sequenceId);
      });

      message.addEventListener("dragend", (e) => {
        message.classList.remove("dragging");
        this.container.classList.remove("sequence-drag-active");
        document
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });
    });

    // Setup drop targets using existing sequence elements (following storymap pattern)
    this.setupDropTargets();

    // Add drop target visual styles
    this.addDropTargetStyles();
  },

  setupDropTargets: function () {
    const dropTargets = this.container.querySelectorAll(
      ".message, .sequence-message"
    );
    dropTargets.forEach((target) => {
      target.addEventListener("dragover", (e) => {
        if (this.draggedSequence && this.draggedSequence !== target) {
          e.preventDefault();
          target.classList.add("drag-over");
        }
      });

      target.addEventListener("dragleave", (e) => {
        target.classList.remove("drag-over");
      });

      target.addEventListener("drop", (e) => {
        e.preventDefault();
        target.classList.remove("drag-over");
        if (this.draggedSequence) {
          this.handleDrop(target); // Use the new, simplified handler
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

      if (!draggedSeq) {
        console.error("Dragged sequence not found in data store");
        this.isProcessing = false;
        return;
      }

      // Filter for sequences in the same context (workflow) to determine order
      const workflowId = draggedSeq.workflowId;
      const sortedList = allSequences
        .filter((s) => s.workflowId === workflowId)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const draggedIndex = sortedList.findIndex(
        (item) => item.id === draggedId
      );
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        this.isProcessing = false;
        return;
      }

      let newOrderValue;
      const targetItem = sortedList[targetIndex];

      // --- PROVEN RE-INDEXING LOGIC FROM STORYMAPPER ---
      if (draggedIndex > targetIndex) {
        // Moving UP (e.g., from index 5 to index 2)
        if (targetIndex === 0) {
          newOrderValue = targetItem.orderIndex / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.orderIndex + targetItem.orderIndex) / 2;
        }
      } else {
        // Moving DOWN (e.g., from index 2 to index 5)
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          newOrderValue = (targetItem.orderIndex + nextItem.orderIndex) / 2;
        } else {
          // Dropped on the last item
          newOrderValue = targetItem.orderIndex + 10;
        }
      }

      // --- DISPATCH UPDATE (FOLLOWING STORYMAP PATTERN) ---

      // Prepare payload with all necessary data
      const fullSequenceData =
        window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedId);
      if (fullSequenceData) {
        fullSequenceData.order_index = newOrderValue;
      }

      const payload = {
        entityType: "sequence",
        entityId: draggedId,
        fieldName: "order_index_number", // Use the correct Bubble field name
        newValue: newOrderValue,
        oldValue: draggedSeq.orderIndex,
        allData: fullSequenceData,
      };

      // 1. Optimistically update the local data store
      window.WorkflowArchitectDataStore.updateSequenceOrder(
        draggedId,
        newOrderValue
      );

      // 2. Trigger a re-render using the custom event
      document.dispatchEvent(
        new CustomEvent("workflow-architect:rerender", {
          detail: {}, // Pass data store data if needed, or let renderer pull it
        })
      );

      // 3. Dispatch the update to the event-bridge to be sent to Bubble
      if (window.WorkflowArchitectEventBridge) {
        // The event bridge is already listening for a 'workflow:update' event
        // Let's create one that matches the old pattern for compatibility
        const bridgePayload = { ...payload }; // Clone payload
        window.WorkflowArchitectEventBridge.handleSequenceDragDrop(
          bridgePayload
        );
      }
    } catch (error) {
      console.error("Error during sequence drop:", error);
    } finally {
      this.isProcessing = false;
      this.draggedSequence = null;
    }
  },

  // Cleanup method
  destroy: function () {
    if (this.container) {
      this.container.classList.remove("sequence-drag-active");
      const dragHandles = this.container.querySelectorAll(
        ".sequence-drag-handle"
      );
      dragHandles.forEach((handle) => handle.remove());
    }

    this.draggedSequence = null;
    this.isProcessing = false;
    this.container = null;
  },
};
