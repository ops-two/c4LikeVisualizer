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
    
    this.publishToWorkflow('pending_update', payload, 'container_updated');
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
  },

  // Handle container creation (simplified to use pending_update)
  handleContainerAdd(event) {
    console.log('SequenceDiagramEventBridge: Container add not supported - only inline editing available');
  },

  // Handle sequence creation (simplified to use pending_update)
  handleSequenceAdd(event) {
    console.log('SequenceDiagramEventBridge: Sequence add not supported - only inline editing available');
  },

  // Handle container deletion (simplified to use pending_update)
  handleContainerDelete(event) {
    console.log('SequenceDiagramEventBridge: Container delete not supported - only inline editing available');
  },

  // Handle sequence deletion (simplified to use pending_update)
  handleSequenceDelete(event) {
    console.log('SequenceDiagramEventBridge: Sequence delete not supported - only inline editing available');
  },

  // Handle drag-and-drop reordering (simplified to use pending_update)
  handleReorder(event) {
    console.log('SequenceDiagramEventBridge: Reordering not supported - only inline editing available');
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
      console.error('SequenceDiagramEventBridge: Error publishing to workflow:', error);
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
