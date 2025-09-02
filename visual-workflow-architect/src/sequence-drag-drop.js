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
    const sequenceMessages = this.container.querySelectorAll(".message, .sequence-message");
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

    // Setup drop zones - between sequences and at workflow boundaries
    this.setupDropZones();
  },

  addDragHandle: function (message) {
    // Add drag handle on hover (following September 1st requirements)
    const dragHandle = document.createElement("div");
    dragHandle.className = "sequence-drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.style.cssText = `
      position: absolute;
      left: -25px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 30px;
      background: #666;
      color: white;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: grab;
      border-radius: 3px;
      font-size: 12px;
      line-height: 1;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    // Ensure message has relative positioning
    const currentPosition = window.getComputedStyle(message).position;
    if (currentPosition === 'static') {
      message.style.position = "relative";
    }
    
    message.appendChild(dragHandle);
    console.log("Added drag handle to:", message);
    
    // Show handle on hover
    message.addEventListener("mouseenter", () => {
      console.log("Mouse enter - showing drag handle");
      dragHandle.style.display = "flex";
    });
    
    message.addEventListener("mouseleave", () => {
      if (!message.classList.contains("dragging")) {
        console.log("Mouse leave - hiding drag handle");
        dragHandle.style.display = "none";
      }
    });
  },

  setupDropZones: function () {
    // Create drop zones between sequences within same workflow
    const workflows = this.container.querySelectorAll(".workflow-group");
    
    workflows.forEach((workflow) => {
      const sequences = workflow.querySelectorAll(".sequence-message");
      
      // Add drop zones between sequences
      sequences.forEach((sequence, index) => {
        this.createDropZone(sequence, "before");
        
        // Add drop zone after last sequence
        if (index === sequences.length - 1) {
          this.createDropZone(sequence, "after");
        }
      });
    });

    // Setup drop event handlers
    const dropZones = this.container.querySelectorAll(".sequence-drop-zone");
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        if (this.draggedSequence) {
          e.preventDefault();
          zone.classList.add("drag-over");
        }
      });
      
      zone.addEventListener("dragleave", (e) => {
        zone.classList.remove("drag-over");
      });
      
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        if (this.draggedSequence) {
          this.handleDrop(zone);
        }
      });
    });
  },

  createDropZone: function (sequence, position) {
    const dropZone = document.createElement("div");
    dropZone.className = "sequence-drop-zone";
    dropZone.dataset.position = position;
    dropZone.dataset.referenceSequenceId = sequence.dataset.sequenceId;
    dropZone.dataset.workflowId = sequence.dataset.workflowId;
    
    dropZone.style.cssText = `
      height: 20px;
      margin: 5px 0;
      border: 2px dashed transparent;
      border-radius: 4px;
      transition: all 0.2s ease;
    `;
    
    // Add visual feedback styles
    const style = document.createElement("style");
    style.textContent = `
      .sequence-drop-zone.drag-over {
        border-color: #007bff !important;
        background-color: rgba(0, 123, 255, 0.1) !important;
      }
      .sequence-drag-active .sequence-drop-zone {
        border-color: #ddd !important;
      }
    `;
    document.head.appendChild(style);
    
    if (position === "before") {
      sequence.parentNode.insertBefore(dropZone, sequence);
    } else {
      sequence.parentNode.insertBefore(dropZone, sequence.nextSibling);
    }
  },

  handleDrop: function (dropZone) {
    if (this.isProcessing || !this.draggedSequence) return;

    try {
      this.isProcessing = true;
      
      const draggedSequenceId = this.draggedSequence.dataset.sequenceId;
      const draggedWorkflowId = this.draggedSequence.dataset.workflowId;
      const targetWorkflowId = dropZone.dataset.workflowId;
      const referenceSequenceId = dropZone.dataset.referenceSequenceId;
      const position = dropZone.dataset.position;

      // Constraint: Only allow vertical dragging within same workflow
      if (draggedWorkflowId !== targetWorkflowId) {
        console.warn("Cross-workflow dragging not allowed");
        return;
      }

      // Get all sequences from data store
      const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
      const draggedSequence = allSequences.find(s => s.id === draggedSequenceId);
      
      if (!draggedSequence) {
        console.error("Dragged sequence not found in data store");
        return;
      }

      // Calculate new order index following storymap pattern
      const newOrderValue = this.calculateNewOrder(
        draggedSequence,
        referenceSequenceId,
        position,
        targetWorkflowId
      );

      // Prepare payload following storymap pattern
      const payload = {
        entityType: "sequence",
        entityId: draggedSequenceId,
        fieldName: "order_index",
        newValue: newOrderValue,
        oldValue: draggedSequence.orderIndex || draggedSequence.order_number,
        workflowId: targetWorkflowId
      };

      // Get full sequence data for update (prevents data loss)
      const fullSequenceData = window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedSequenceId);
      if (fullSequenceData) {
        fullSequenceData.order_index = newOrderValue;
        payload.allData = fullSequenceData;
      }

      // Optimistic UI update (following storymap pattern)
      window.WorkflowArchitectDataStore.updateSequenceOrder(
        draggedSequenceId,
        newOrderValue
      );

      // Re-render UI
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.WorkflowArchitectRenderer && mainCanvas.length) {
        window.WorkflowArchitectRenderer.render(mainCanvas);
      }

      // Dispatch event to trigger Bubble update (following storymap pattern)
      document.dispatchEvent(
        new CustomEvent("workflow:update", { detail: payload })
      );

      console.log("Sequence drag drop completed:", payload);

    } catch (error) {
      console.error("Sequence drag drop error:", error);
    } finally {
      this.isProcessing = false;
      this.draggedSequence = null;
    }
  },

  calculateNewOrder: function (draggedSequence, referenceSequenceId, position, workflowId) {
    // Get all sequences in the target workflow, sorted by order
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    const workflowSequences = allSequences
      .filter(s => s.workflowId === workflowId)
      .sort((a, b) => (a.orderIndex || a.order_number || 0) - (b.orderIndex || b.order_number || 0));

    const referenceSequence = workflowSequences.find(s => s.id === referenceSequenceId);
    if (!referenceSequence) {
      // Default to end of list
      const lastSequence = workflowSequences[workflowSequences.length - 1];
      return lastSequence ? (lastSequence.orderIndex || lastSequence.order_number || 0) + 10 : 10;
    }

    const referenceIndex = workflowSequences.findIndex(s => s.id === referenceSequenceId);
    const referenceOrder = referenceSequence.orderIndex || referenceSequence.order_number || 0;

    if (position === "before") {
      if (referenceIndex === 0) {
        // Insert at beginning
        return referenceOrder / 2;
      } else {
        // Insert between previous and reference
        const prevSequence = workflowSequences[referenceIndex - 1];
        const prevOrder = prevSequence.orderIndex || prevSequence.order_number || 0;
        return (prevOrder + referenceOrder) / 2;
      }
    } else { // position === "after"
      if (referenceIndex === workflowSequences.length - 1) {
        // Insert at end
        return referenceOrder + 10;
      } else {
        // Insert between reference and next
        const nextSequence = workflowSequences[referenceIndex + 1];
        const nextOrder = nextSequence.orderIndex || nextSequence.order_number || 0;
        return (referenceOrder + nextOrder) / 2;
      }
    }
  },

  // Cleanup method
  destroy: function () {
    if (this.container) {
      this.container.classList.remove("sequence-drag-active");
      const dragHandles = this.container.querySelectorAll(".sequence-drag-handle");
      dragHandles.forEach(handle => handle.remove());
      
      const dropZones = this.container.querySelectorAll(".sequence-drop-zone");
      dropZones.forEach(zone => zone.remove());
    }
    
    this.draggedSequence = null;
    this.isProcessing = false;
    this.container = null;
  }
};
