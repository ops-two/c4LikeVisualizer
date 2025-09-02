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
        
        // Create drop zones when drag starts
        this.createSequenceDropZones();
        
        // Store sequence data for drop calculations
        e.dataTransfer.setData("text/plain", message.dataset.sequenceId);
      });
      
      message.addEventListener("dragend", (e) => {
        message.classList.remove("dragging");
        this.container.classList.remove("sequence-drag-active");
        document
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
        
        // Clean up drop zones when drag ends
        this.container.querySelectorAll('.sequence-drop-zone').forEach(zone => zone.remove());
      });
    });

    // Setup initial drop zone styles
    this.addDropZoneStyles();
  },

  addDragHandle: function (message) {
    // Add drag handle on hover (following September 1st requirements)
    const dragHandle = document.createElement("div");
    dragHandle.className = "sequence-drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.style.cssText = `
      position: absolute;
      left: -30px;
      top: 50%;
      transform: translateY(-50%);
      width: 25px;
      height: 35px;
      background: #666;
      color: white;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: grab;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      pointer-events: auto;
    `;
    
    // Ensure message has relative positioning
    const currentPosition = window.getComputedStyle(message).position;
    if (currentPosition === 'static') {
      message.style.position = "relative";
    }
    
    message.appendChild(dragHandle);
    console.log("Added drag handle to:", message);
    
    // Create hover area that includes both message and handle
    const hoverArea = document.createElement("div");
    hoverArea.className = "drag-hover-area";
    hoverArea.style.cssText = `
      position: absolute;
      left: -35px;
      top: -10px;
      right: -10px;
      bottom: -10px;
      z-index: 999;
      pointer-events: none;
    `;
    
    message.appendChild(hoverArea);
    
    // Use single hover area to prevent flickering
    let hoverTimeout;
    
    const showHandle = () => {
      clearTimeout(hoverTimeout);
      console.log("Showing drag handle");
      dragHandle.style.display = "flex";
    };
    
    const hideHandleDelayed = () => {
      hoverTimeout = setTimeout(() => {
        if (!message.classList.contains("dragging")) {
          console.log("Hiding drag handle");
          dragHandle.style.display = "none";
        }
      }, 100); // Small delay to prevent flickering
    };
    
    // Hover events on the message
    message.addEventListener("mouseenter", showHandle);
    message.addEventListener("mouseleave", hideHandleDelayed);
    
    // Hover events on the drag handle itself
    dragHandle.addEventListener("mouseenter", showHandle);
    dragHandle.addEventListener("mouseleave", hideHandleDelayed);
  },

  setupDropZones: function () {
    console.log("Setting up drop zones...");
    
    // Create drop zones between sequences and at workflow boundaries
    this.createSequenceDropZones();
    
    // Add CSS for drop zone styling
    this.addDropZoneStyles();
  },

  createSequenceDropZones: function () {
    // Remove existing drop zones
    this.container.querySelectorAll('.sequence-drop-zone').forEach(zone => zone.remove());
    
    // Get all sequence messages grouped by workflow
    const workflows = {};
    const sequenceMessages = this.container.querySelectorAll('.message, .sequence-message');
    
    sequenceMessages.forEach(message => {
      const workflowId = message.dataset.workflowId;
      if (!workflowId) return;
      
      if (!workflows[workflowId]) workflows[workflowId] = [];
      workflows[workflowId].push(message);
    });
    
    // Create drop zones for each workflow
    Object.keys(workflows).forEach(workflowId => {
      const workflowSequences = workflows[workflowId];
      
      // Sort by Y position to maintain visual order
      workflowSequences.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });
      
      // Create drop zones before each sequence and after the last one
      workflowSequences.forEach((sequence, index) => {
        // Drop zone before this sequence
        this.createDropZone(sequence, 'before', workflowId, index);
        
        // Drop zone after last sequence
        if (index === workflowSequences.length - 1) {
          this.createDropZone(sequence, 'after', workflowId, index + 1);
        }
      });
    });
  },

  addDropZoneStyles: function () {
    if (document.getElementById('sequence-drop-zone-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sequence-drop-zone-styles';
    style.textContent = `
      .sequence-drop-zone {
        height: 4px;
        margin: 8px 20px;
        border: none;
        background: transparent;
        border-radius: 2px;
        transition: all 0.2s ease;
        opacity: 0;
        position: relative;
      }
      
      .sequence-drag-active .sequence-drop-zone {
        opacity: 1;
        background: #e0e0e0;
      }
      
      .sequence-drop-zone.drag-over {
        background: #007bff !important;
        height: 6px !important;
        box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
      }
      
      .sequence-drop-zone::before {
        content: '';
        position: absolute;
        left: -10px;
        right: -10px;
        top: -10px;
        bottom: -10px;
        background: transparent;
      }
    `;
    document.head.appendChild(style);
  },

  createDropZone: function (sequence, position, workflowId, orderIndex) {
    const dropZone = document.createElement('div');
    dropZone.className = 'sequence-drop-zone';
    dropZone.dataset.position = position;
    dropZone.dataset.referenceSequenceId = sequence.dataset.sequenceId;
    dropZone.dataset.workflowId = workflowId;
    dropZone.dataset.orderIndex = orderIndex;
    
    // Determine if this is a subgroup drop zone
    const subgroupContainer = sequence.closest('.subgroup-container');
    if (subgroupContainer) {
      dropZone.dataset.subgroupId = subgroupContainer.dataset.subgroupId;
    }
    
    // Add drag over and drop event listeners
    dropZone.addEventListener('dragover', (e) => {
      if (this.draggedSequence) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      }
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (this.draggedSequence) {
        this.handleDropZoneDrop(dropZone);
      }
    });
    
    // Insert drop zone in correct position
    if (position === 'before') {
      sequence.parentNode.insertBefore(dropZone, sequence);
    } else {
      sequence.parentNode.insertBefore(dropZone, sequence.nextSibling);
    }
  },

  handleDropZoneDrop: function (dropZone) {
    if (this.isProcessing || !this.draggedSequence) return;

    try {
      this.isProcessing = true;
      console.log('Processing drop zone drop...');
      
      const draggedSequenceId = this.draggedSequence.dataset.sequenceId;
      const draggedWorkflowId = this.draggedSequence.dataset.workflowId;
      const targetWorkflowId = dropZone.dataset.workflowId;
      const targetSubgroupId = dropZone.dataset.subgroupId || null;
      const orderIndex = parseInt(dropZone.dataset.orderIndex);
      
      console.log('Drop details:', {
        draggedSequenceId,
        draggedWorkflowId,
        targetWorkflowId,
        targetSubgroupId,
        orderIndex
      });

      // Constraint: Only allow vertical dragging within same workflow
      if (draggedWorkflowId !== targetWorkflowId) {
        console.warn('Cross-workflow dragging not allowed');
        return;
      }

      // Get sequence data and calculate new order
      const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
      const draggedSequence = allSequences.find(s => s.id === draggedSequenceId);
      
      if (!draggedSequence) {
        console.error('Dragged sequence not found in data store');
        return;
      }

      // Calculate new order based on position
      const newOrderValue = this.calculateNewOrderFromPosition(
        draggedSequence,
        targetWorkflowId,
        targetSubgroupId,
        orderIndex
      );

      // Prepare update payload
      const payload = {
        entityType: 'sequence',
        entityId: draggedSequenceId,
        fieldName: 'order_index',
        newValue: newOrderValue,
        oldValue: draggedSequence.orderIndex || draggedSequence.order_number,
        workflowId: targetWorkflowId,
        subgroupId: targetSubgroupId
      };

      // Get full sequence data for update
      const fullSequenceData = window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedSequenceId);
      if (fullSequenceData) {
        fullSequenceData.order_index = newOrderValue;
        if (targetSubgroupId) {
          fullSequenceData.subgroupId = targetSubgroupId;
        }
        payload.allData = fullSequenceData;
      }

      // Optimistic UI update
      window.WorkflowArchitectDataStore.updateSequenceOrder(
        draggedSequenceId,
        newOrderValue,
        targetSubgroupId
      );

      // Re-render UI
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.WorkflowArchitectRenderer && mainCanvas.length) {
        window.WorkflowArchitectRenderer.render(mainCanvas);
      }

      // Dispatch event to trigger Bubble update
      document.dispatchEvent(
        new CustomEvent('workflow:update', { detail: payload })
      );

      console.log('Sequence reorder completed:', payload);
      
    } catch (error) {
      console.error('Sequence drag drop error:', error);
    } finally {
      this.isProcessing = false;
      this.draggedSequence = null;
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

  calculateNewOrderFromPosition: function (draggedSequence, workflowId, subgroupId, targetOrderIndex) {
    // Get all sequences in the target workflow/subgroup, sorted by order
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    let targetSequences = allSequences.filter(s => s.workflowId === workflowId);
    
    // Filter by subgroup if specified
    if (subgroupId) {
      targetSequences = targetSequences.filter(s => s.subgroupId === subgroupId);
    } else {
      targetSequences = targetSequences.filter(s => !s.subgroupId);
    }
    
    // Sort by current order
    targetSequences.sort((a, b) => (a.orderIndex || a.order_number || 0) - (b.orderIndex || b.order_number || 0));
    
    // Remove the dragged sequence from calculations
    targetSequences = targetSequences.filter(s => s.id !== draggedSequence.id);
    
    if (targetSequences.length === 0) {
      return 10; // First sequence in this container
    }
    
    if (targetOrderIndex === 0) {
      // Insert at beginning
      const firstOrder = targetSequences[0].orderIndex || targetSequences[0].order_number || 0;
      return Math.max(firstOrder - 10, 1);
    } else if (targetOrderIndex >= targetSequences.length) {
      // Insert at end
      const lastOrder = targetSequences[targetSequences.length - 1].orderIndex || targetSequences[targetSequences.length - 1].order_number || 0;
      return lastOrder + 10;
    } else {
      // Insert between sequences
      const prevOrder = targetSequences[targetOrderIndex - 1].orderIndex || targetSequences[targetOrderIndex - 1].order_number || 0;
      const nextOrder = targetSequences[targetOrderIndex].orderIndex || targetSequences[targetOrderIndex].order_number || 0;
      return (prevOrder + nextOrder) / 2;
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
