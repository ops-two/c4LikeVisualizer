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

    // Setup drop targets using existing sequence elements (following storymap pattern)
    this.setupDropTargets();
    
    // Add drop target visual styles
    this.addDropTargetStyles();
  },

  setupDropTargets: function () {
    console.log("Setting up drop targets...");
    
    // Use existing sequence messages as drop targets (like storymap)
    const dropTargets = this.container.querySelectorAll(".message, .sequence-message");
    console.log("Found drop targets:", dropTargets.length);
    
    dropTargets.forEach((target, index) => {
      console.log(`Setting up drop target ${index}:`, target.dataset.sequenceId, target.className);
      
      // Ensure target can receive drops
      target.addEventListener("dragover", (e) => {
        if (this.draggedSequence && this.draggedSequence !== target) {
          e.preventDefault();
          e.stopPropagation();
          target.classList.add("drag-over");
          console.log("Drag over target:", target.dataset.sequenceId);
        }
      });
      
      target.addEventListener("dragenter", (e) => {
        if (this.draggedSequence && this.draggedSequence !== target) {
          e.preventDefault();
          console.log("Drag enter target:", target.dataset.sequenceId);
        }
      });
      
      target.addEventListener("dragleave", (e) => {
        target.classList.remove("drag-over");
        console.log("Drag leave target:", target.dataset.sequenceId);
      });
      
      target.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.classList.remove("drag-over");
        if (this.draggedSequence) {
          console.log("Drop detected on target:", target.dataset.sequenceId);
          this.handleSequenceDrop(target);
        }
      });
    });
    
    // Also add container-level fallback
    this.container.addEventListener("dragover", (e) => {
      if (this.draggedSequence) {
        e.preventDefault();
        console.log("Container dragover fallback");
      }
    });
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

  addDropTargetStyles: function () {
    if (document.getElementById('sequence-drop-target-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sequence-drop-target-styles';
    style.textContent = `
      .sequence-drag-active .message,
      .sequence-drag-active .sequence-message {
        transition: all 0.2s ease;
      }
      
      .message.drag-over,
      .sequence-message.drag-over {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3);
        border: 2px solid #007bff;
      }
      
      .message.dragging,
      .sequence-message.dragging {
        opacity: 0.5;
        transform: rotate(5deg);
      }
    `;
    document.head.appendChild(style);
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

  handleSequenceDrop: function (target) {
    if (this.isProcessing || !this.draggedSequence) return;

    try {
      this.isProcessing = true;
      console.log('Processing sequence drop...');
      
      const draggedSequenceId = this.draggedSequence.dataset.sequenceId;
      const targetSequenceId = target.dataset.sequenceId;
      
      // Prevent dropping on self
      if (draggedSequenceId === targetSequenceId) {
        console.log('Cannot drop sequence on itself');
        return;
      }
      
      const draggedWorkflowId = this.draggedSequence.dataset.workflowId;
      const targetWorkflowId = target.dataset.workflowId;
      
      console.log('Drop details:', {
        draggedSequenceId,
        targetSequenceId,
        draggedWorkflowId,
        targetWorkflowId
      });

      // Constraint: Only allow vertical dragging within same workflow
      if (draggedWorkflowId !== targetWorkflowId) {
        console.warn('Cross-workflow dragging not allowed');
        return;
      }

      // Get sequence data from data store
      const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
      const draggedSequence = allSequences.find(s => s.id === draggedSequenceId);
      const targetSequence = allSequences.find(s => s.id === targetSequenceId);
      
      if (!draggedSequence || !targetSequence) {
        console.error('Sequence not found in data store');
        return;
      }

      // Determine subgroup assignment from target
      const targetSubgroupContainer = target.closest('.subgroup-container');
      const targetSubgroupId = targetSubgroupContainer ? targetSubgroupContainer.dataset.subgroupId : null;
      
      // Validate subgroup capacity if dropping into subgroup
      if (targetSubgroupId && !this.validateSubgroupCapacity(targetSubgroupId, draggedSequenceId)) {
        console.warn('Subgroup capacity exceeded - cannot add more sequences');
        return;
      }
      
      // Calculate new order using enhanced workflow/subgroup-aware logic
      const newOrderValue = this.calculateNewOrderWithSubgroupFlow(
        draggedSequence,
        targetSequence,
        targetWorkflowId,
        targetSubgroupId
      );
      
      console.log('Order calculation result:', {
        newOrderValue,
        targetSubgroupId,
        workflowSequenceCount: this.getWorkflowSequenceCount(targetWorkflowId),
        subgroupSequenceCount: targetSubgroupId ? this.getSubgroupSequenceCount(targetSubgroupId) : 0
      });

      // Prepare update payload following Bubble event structure
      const payload = {
        entityType: 'sequence',
        entityId: draggedSequenceId,
        fieldName: 'order_index',
        newValue: newOrderValue,
        oldValue: draggedSequence.orderIndex || draggedSequence.order_number,
        workflowId: targetWorkflowId,
        subgroupId: targetSubgroupId,
        // Add state management fields
        pending_reorder: true,
        current_view: 'workflow_diagram'
      };

      // Get full sequence data for update
      const fullSequenceData = window.WorkflowArchitectDataStore.getSequenceForUpdate(draggedSequenceId);
      if (fullSequenceData) {
        fullSequenceData.order_index = newOrderValue;
        if (targetSubgroupId) {
          fullSequenceData.subgroup_custom_subgroup = targetSubgroupId;
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

      // Set pending state before Bubble update
      this.setPendingState('reorder', true);
      
      // Dispatch sequence_updated event to match Bubble's expected events
      document.dispatchEvent(
        new CustomEvent('sequence_updated', { detail: payload })
      );
      
      // Also dispatch workflow update for broader state management
      document.dispatchEvent(
        new CustomEvent('workflow:update', { detail: payload })
      );
      
      // Clear pending state after short delay
      setTimeout(() => {
        this.setPendingState('reorder', false);
      }, 1000);

      console.log("Sequence drag drop completed:", payload);

    } catch (error) {
      console.error("Sequence drag drop error:", error);
    } finally {
      this.isProcessing = false;
      this.draggedSequence = null;
    }
  },

  validateSubgroupCapacity: function (subgroupId, draggedSequenceId) {
    // Get subgroup data to check capacity
    const subgroup = window.WorkflowArchitectDataStore.getSubgroup(subgroupId);
    if (!subgroup) return true; // Allow if subgroup not found
    
    // Get current sequences in this subgroup
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    const subgroupSequences = allSequences.filter(s => s.subgroupId === subgroupId && s.id !== draggedSequenceId);
    
    // For now, allow unlimited sequences in subgroups
    // TODO: Add capacity limits based on subgroup configuration
    console.log(`Subgroup ${subgroupId} currently has ${subgroupSequences.length} sequences`);
    return true;
  },

  getWorkflowSequenceCount: function (workflowId) {
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    return allSequences.filter(s => s.workflowId === workflowId).length;
  },

  getSubgroupSequenceCount: function (subgroupId) {
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    return allSequences.filter(s => s.subgroupId === subgroupId).length;
  },

  setPendingState: function (operation, isActive) {
    // Update global state to match Bubble's state management
    if (window.WorkflowArchitectDataStore.data) {
      window.WorkflowArchitectDataStore.data.pending_reorder = isActive;
      window.WorkflowArchitectDataStore.data.is_loading = isActive;
    }
    console.log(`Set pending_${operation}:`, isActive);
  },

  calculateNewOrderWithSubgroupFlow: function (draggedSequence, targetSequence, workflowId, targetSubgroupId) {
    // Enhanced order calculation that considers subgroup boundaries
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    
    // Filter sequences based on target container (workflow or subgroup)
    let containerSequences;
    if (targetSubgroupId) {
      // Dropping into subgroup - only consider sequences in that subgroup
      containerSequences = allSequences.filter(s => s.subgroupId === targetSubgroupId);
      console.log(`Calculating order within subgroup ${targetSubgroupId}`);
    } else {
      // Dropping into workflow (outside subgroups) - only consider workflow-level sequences
      containerSequences = allSequences.filter(s => s.workflowId === workflowId && !s.subgroupId);
      console.log(`Calculating order within workflow ${workflowId} (outside subgroups)`);
    }
    
    // Sort by current order
    containerSequences.sort((a, b) => (a.orderIndex || a.order_number || 0) - (b.orderIndex || b.order_number || 0));
    
    const draggedIndex = containerSequences.findIndex(s => s.id === draggedSequence.id);
    const targetIndex = containerSequences.findIndex(s => s.id === targetSequence.id);
    
    console.log('Enhanced order calculation:', { 
      draggedIndex, 
      targetIndex, 
      containerType: targetSubgroupId ? 'subgroup' : 'workflow',
      containerSequenceCount: containerSequences.length
    });
    
    // Use same logic as before but within the correct container scope
    if (draggedIndex > targetIndex) {
      // Moving up - insert before target
      if (targetIndex === 0) {
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        return Math.max(targetOrder - 10, 1);
      } else {
        const prevSequence = containerSequences[targetIndex - 1];
        const prevOrder = prevSequence.orderIndex || prevSequence.order_number || 0;
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        return (prevOrder + targetOrder) / 2;
      }
    } else {
      // Moving down - insert after target
      if (targetIndex === containerSequences.length - 1) {
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        return targetOrder + 10;
      } else {
        const nextSequence = containerSequences[targetIndex + 1];
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        const nextOrder = nextSequence.orderIndex || nextSequence.order_number || 0;
        return (targetOrder + nextOrder) / 2;
      }
    }
  },

  calculateNewOrderBetweenSequences: function (draggedSequence, targetSequence, workflowId) {
    // Get all sequences in the target workflow, sorted by order
    const allSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    const workflowSequences = allSequences
      .filter(s => s.workflowId === workflowId)
      .sort((a, b) => (a.orderIndex || a.order_number || 0) - (b.orderIndex || b.order_number || 0));

    const draggedIndex = workflowSequences.findIndex(s => s.id === draggedSequence.id);
    const targetIndex = workflowSequences.findIndex(s => s.id === targetSequence.id);
    
    console.log('Order calculation:', { draggedIndex, targetIndex });
    
    // Following storymap pattern for position-aware reordering
    if (draggedIndex > targetIndex) {
      // Moving up - insert before target
      if (targetIndex === 0) {
        return targetSequence.orderIndex / 2;
      } else {
        const prevSequence = workflowSequences[targetIndex - 1];
        const prevOrder = prevSequence.orderIndex || prevSequence.order_number || 0;
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        return (prevOrder + targetOrder) / 2;
      }
    } else {
      // Moving down - insert after target
      if (targetIndex === workflowSequences.length - 1) {
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        return targetOrder + 10;
      } else {
        const nextSequence = workflowSequences[targetIndex + 1];
        const targetOrder = targetSequence.orderIndex || targetSequence.order_number || 0;
        const nextOrder = nextSequence.orderIndex || nextSequence.order_number || 0;
        return (targetOrder + nextOrder) / 2;
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
