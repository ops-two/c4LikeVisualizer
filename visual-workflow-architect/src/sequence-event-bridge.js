// Visual Workflow Architect - Sequence Event Bridge
// Handles communication between sequence diagram interactions and Bubble workflows
// Based on proven storymap-grid event-driven architecture

console.log('DEBUG: sequence-event-bridge.js script is loading...');

window.SequenceDiagramEventBridge = {
  instance: null,
  isInitialized: false,

  // Initialize the event bridge with Bubble instance
  init(instance) {
    if (this.isInitialized) return;
    
    this.instance = instance;
    this.isInitialized = true;
    
    console.log('SequenceDiagramEventBridge: Initializing with Bubble instance');
    this.setupEventListeners();
    console.log('SequenceDiagramEventBridge: Initialization complete');
  },

  // Set up custom event listeners for sequence diagram interactions
  setupEventListeners() {
    // Container operations
    document.addEventListener('sequence:container_updated', this.handleContainerUpdate.bind(this));
    document.addEventListener('sequence:container_added', this.handleContainerAdd.bind(this));
    document.addEventListener('sequence:container_deleted', this.handleContainerDelete.bind(this));
    
    // Sequence operations
    document.addEventListener('sequence:sequence_updated', this.handleSequenceUpdate.bind(this));
    document.addEventListener('sequence:sequence_added', this.handleSequenceAdd.bind(this));
    document.addEventListener('sequence:sequence_deleted', this.handleSequenceDelete.bind(this));
    
    // Reordering operations
    document.addEventListener('sequence:reorder', this.handleReorder.bind(this));
    
    console.log('SequenceDiagramEventBridge: Event listeners registered');
  },

  // Handle container name updates
  handleContainerUpdate(event) {
    console.log('SequenceDiagramEventBridge: Handling container update:', event.detail);
    
    const payload = {
      entityType: 'container',
      entityId: event.detail.containerId,
      fieldName: 'name_text',
      newValue: event.detail.newName,
      oldValue: event.detail.oldName,
      allData: event.detail.containerData || {}
    };
    
    this.publishToWorkflow('pending_update', payload, 'diagram_layout_changed');
  },

  // Handle sequence label updates
  handleSequenceUpdate(event) {
    console.log('SequenceDiagramEventBridge: Handling sequence update:', event.detail);
    
    const payload = {
      entityType: 'sequence',
      entityId: event.detail.sequenceId,
      fieldName: 'label_text',
      newValue: event.detail.newLabel,
      oldValue: event.detail.oldLabel,
      allData: event.detail.sequenceData || {}
    };
    
    this.publishToWorkflow('pending_update', payload, 'sequence_updated');
    
    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle container creation
  handleContainerAdd(event) {
    console.log('SequenceDiagramEventBridge: Handling container add:', event.detail);
    
    // Calculate next order_index intelligently (like storymap-grid does)
    const nextOrderIndex = this.getNextOrderIndex('container', event.detail.featureId);
    
    const payload = {
      entityType: 'container',
      name_text: event.detail.name,
      type_text: event.detail.type || 'Component',
      color_hex_text: event.detail.color || '#3ea50b',
      feature_id: event.detail.featureId,
      order_index_number: event.detail.orderIndex || nextOrderIndex
    };
    
    this.publishToWorkflow('pending_add', payload, 'container_added');
    
    // Re-render UI after successful operation (like storymap-grid does)
    this.reRenderDiagram();
  },

  // Handle sequence creation
  handleSequenceAdd(event) {
    console.log('SequenceDiagramEventBridge: Handling sequence add:', event.detail);
    
    // Calculate next order_index intelligently for sequences
    const nextOrderIndex = this.getNextOrderIndex('sequence', event.detail.featureId);
    
    const payload = {
      entityType: 'sequence',
      label_text: event.detail.label,
      from_container_id: event.detail.fromContainerId,
      to_container_id: event.detail.toContainerId,
      feature_id: event.detail.featureId,
      is_dashed_boolean: event.detail.isDashed || false,
      color_hex_text: event.detail.color || '#1976d2',
      order_index_number: event.detail.orderIndex || nextOrderIndex
    };
    
    this.publishToWorkflow('pending_add', payload, 'sequence_added');
    
    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle container deletion
  handleContainerDelete(event) {
    console.log('SequenceDiagramEventBridge: Handling container delete:', event.detail);
    
    const payload = {
      entityType: 'container',
      entityId: event.detail.containerId,
      cascadeDelete: event.detail.cascadeSequences || true
    };
    
    this.publishToWorkflow('pending_delete', payload, 'container_deleted');
    
    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle sequence deletion
  handleSequenceDelete(event) {
    console.log('SequenceDiagramEventBridge: Handling sequence delete:', event.detail);
    
    const payload = {
      entityType: 'sequence',
      entityId: event.detail.sequenceId
    };
    
    this.publishToWorkflow('pending_delete', payload, 'sequence_deleted');
    
    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle drag-and-drop reordering
  handleReorder(event) {
    console.log('SequenceDiagramEventBridge: Handling reorder:', event.detail);
    
    const payload = {
      entityType: event.detail.entityType,
      reorderData: event.detail.items.map(item => ({
        entityId: item.id,
        order_index_number: item.newOrder
      }))
    };
    
    this.publishToWorkflow('pending_reorder', payload, `${event.detail.entityType}_reordered`);
  },

  // Core function to publish data to Bubble and trigger workflows
  publishToWorkflow(stateKey, payload, eventName) {
    if (!this.instance) {
      console.error('SequenceDiagramEventBridge: No Bubble instance available');
      return;
    }

    try {
      // Publish the JSON payload to Bubble state
      const jsonPayload = JSON.stringify(payload);
      console.log(`SequenceDiagramEventBridge: Publishing ${stateKey}:`, jsonPayload);
      
      this.instance.publishState(stateKey, jsonPayload);
      
      // Trigger the corresponding Bubble workflow event
      console.log(`SequenceDiagramEventBridge: Triggering event: ${eventName}`);
      this.instance.triggerEvent(eventName);
      
    } catch (error) {
      console.error('SequenceDiagramEventBridge: Error in publishToWorkflow:', error);
    }
  },

  // Calculate next order_index intelligently (like storymap-grid does)
  getNextOrderIndex(entityType, featureId) {
    if (!window.SequenceDiagramDataStore) {
      console.warn('SequenceDiagramEventBridge: Data store not available, using fallback order_index');
      return 0;
    }

    try {
      const entities = entityType === 'container' 
        ? window.SequenceDiagramDataStore.getAllContainers()
        : window.SequenceDiagramDataStore.getAllSequences();
      
      // Filter by feature and get max order
      const featureEntities = entities.filter(e => e.featureId === featureId);
      const maxOrder = Math.max(...featureEntities.map(e => e.orderIndex), -1);
      const nextOrder = maxOrder + 1;
      
      console.log(`SequenceDiagramEventBridge: Calculated next ${entityType} order_index: ${nextOrder}`);
      return nextOrder;
    } catch (error) {
      console.error('SequenceDiagramEventBridge: Error calculating order_index:', error);
      return 0;
    }
  },

  // Re-render the diagram after successful operations (like storymap-grid does)
  reRenderDiagram() {
    try {
      // Find the main plugin container (similar to storymap-grid pattern)
      const mainCanvas = document.querySelector('.sequence-diagram-container[data-plugin-id]');
      
      if (mainCanvas && window.WorkflowArchitectRenderer) {
        console.log('SequenceDiagramEventBridge: Re-rendering diagram after operation');
        
        // Get the current feature data from DOM attributes
        const featureId = mainCanvas.getAttribute('data-feature-id');
        
        if (featureId && window.SequenceDiagramDataStore) {
          // Re-render with current data
          const currentData = window.SequenceDiagramDataStore.getAllData();
          window.WorkflowArchitectRenderer.render(currentData, mainCanvas);
        }
      } else {
        console.warn('SequenceDiagramEventBridge: Cannot re-render - missing container or renderer');
      }
    } catch (error) {
      console.error('SequenceDiagramEventBridge: Error re-rendering diagram:', error);
    }
  },

  // Utility function to dispatch custom events from UI interactions
  dispatchContainerUpdate(containerId, newName, oldName, containerData) {
    const event = new CustomEvent('sequence:container_updated', {
      detail: {
        containerId,
        newName,
        oldName,
        containerData
      }
    });
    document.dispatchEvent(event);
  },

  dispatchSequenceUpdate(sequenceId, newLabel, oldLabel, sequenceData) {
    const event = new CustomEvent('sequence:sequence_updated', {
      detail: {
        sequenceId,
        newLabel,
        oldLabel,
        sequenceData
      }
    });
    document.dispatchEvent(event);
  },

  dispatchContainerAdd(name, type, color, featureId, orderIndex) {
    const event = new CustomEvent('sequence:container_added', {
      detail: {
        name,
        type,
        color,
        featureId,
        orderIndex
      }
    });
    document.dispatchEvent(event);
  },

  dispatchSequenceAdd(label, fromContainerId, toContainerId, featureId, isDashed, color, orderIndex) {
    const event = new CustomEvent('sequence:sequence_added', {
      detail: {
        label,
        fromContainerId,
        toContainerId,
        featureId,
        isDashed,
        color,
        orderIndex
      }
    });
    document.dispatchEvent(event);
  },

  dispatchReorder(entityType, items) {
    const event = new CustomEvent('sequence:reorder', {
      detail: {
        entityType,
        items
      }
    });
    document.dispatchEvent(event);
  }
};

console.log('DEBUG: sequence-event-bridge.js script loaded successfully. SequenceDiagramEventBridge object created:', typeof window.SequenceDiagramEventBridge);
