// Visual Workflow Architect - Event Bridge
// Bubble communication layer for real-time updates
// Based on proven patterns from storymap-grid implementation

console.log('DEBUG: event-bridge.js script is loading...');

window.WorkflowArchitectEventBridge = {
  // Bubble instance reference
  bubbleInstance: null,
  
  // Processing state to prevent race conditions
  isProcessing: false,
  
  // Debounce timer for batching updates
  debounceTimer: null,
  debounceDelay: 300, // 300ms delay as proven in storymap-grid
  
  // Pending updates queue
  pendingUpdates: [],

  // Initialize with Bubble instance
  init: function(bubbleInstance) {
    console.log('WorkflowArchitectEventBridge: Initializing with Bubble instance');
    this.bubbleInstance = bubbleInstance;
    this.isProcessing = false;
    this.pendingUpdates = [];
    
    if (!bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance provided');
      return false;
    }
    
    console.log('WorkflowArchitectEventBridge: Initialization complete');
    return true;
  },

  // Handle container updates
  handleContainerUpdate: function(containerId, updateData) {
    console.log('WorkflowArchitectEventBridge: Container update requested', containerId, updateData);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    try {
      // Update local data store first
      const success = window.WorkflowArchitectDataStore.updateEntity('container', containerId, updateData);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to update local data store');
        return false;
      }

      // Get formatted data for Bubble
      const bubbleUpdateData = window.WorkflowArchitectDataStore.getEntityForUpdate('container', containerId);
      if (!bubbleUpdateData) {
        console.error('WorkflowArchitectEventBridge: Failed to format update data for Bubble');
        return false;
      }

      // Send to Bubble with debouncing
      this.debouncedBubbleUpdate('container_updated', bubbleUpdateData);
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Container update failed', error);
      return false;
    }
  },

  // Handle sequence updates
  handleSequenceUpdate: function(sequenceId, updateData) {
    console.log('WorkflowArchitectEventBridge: Sequence update requested', sequenceId, updateData);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    try {
      // Update local data store first
      const success = window.WorkflowArchitectDataStore.updateEntity('sequence', sequenceId, updateData);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to update local data store');
        return false;
      }

      // Get formatted data for Bubble
      const bubbleUpdateData = window.WorkflowArchitectDataStore.getEntityForUpdate('sequence', sequenceId);
      if (!bubbleUpdateData) {
        console.error('WorkflowArchitectEventBridge: Failed to format update data for Bubble');
        return false;
      }

      // Send to Bubble with debouncing
      this.debouncedBubbleUpdate('sequence_updated', bubbleUpdateData);
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Sequence update failed', error);
      return false;
    }
  },

  // Handle workflow updates
  handleWorkflowUpdate: function(workflowId, updateData) {
    console.log('WorkflowArchitectEventBridge: Workflow update requested', workflowId, updateData);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    try {
      // Update local data store first
      const success = window.WorkflowArchitectDataStore.updateEntity('workflow', workflowId, updateData);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to update local data store');
        return false;
      }

      // Get formatted data for Bubble
      const bubbleUpdateData = window.WorkflowArchitectDataStore.getEntityForUpdate('workflow', workflowId);
      if (!bubbleUpdateData) {
        console.error('WorkflowArchitectEventBridge: Failed to format update data for Bubble');
        return false;
      }

      // Send to Bubble with debouncing
      this.debouncedBubbleUpdate('workflow_updated', bubbleUpdateData);
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Workflow update failed', error);
      return false;
    }
  },

  // Handle entity creation
  handleEntityAdd: function(entityType, entityData) {
    console.log('WorkflowArchitectEventBridge: Entity add requested', entityType, entityData);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    try {
      // Add to local data store first (generates temporary ID)
      const tempId = window.WorkflowArchitectDataStore.addEntity(entityType, entityData);
      if (!tempId) {
        console.error('WorkflowArchitectEventBridge: Failed to add entity to local data store');
        return false;
      }

      // Get formatted data for Bubble
      const bubbleCreateData = window.WorkflowArchitectDataStore.getEntityForUpdate(entityType, tempId);
      if (!bubbleCreateData) {
        console.error('WorkflowArchitectEventBridge: Failed to format create data for Bubble');
        return false;
      }

      // Mark as new entity (temporary ID)
      bubbleCreateData.isNew = true;
      bubbleCreateData.tempId = tempId;

      // Send to Bubble
      const eventName = `${entityType}_added`;
      this.sendToBubble(eventName, bubbleCreateData, 'pending_add');
      
      // Trigger UI re-render after successful addition
      setTimeout(() => {
        console.log('WorkflowArchitectEventBridge: Triggering reRenderUI after container add');
        this.reRenderUI();
      }, 100);
      
      return tempId;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Entity add failed', error);
      return false;
    }
  },

  // Handle entity deletion
  handleEntityDelete: function(entityType, entityId) {
    console.log('WorkflowArchitectEventBridge: Entity delete requested', entityType, entityId);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    try {
      // Get entity data before deletion for Bubble
      const entityData = window.WorkflowArchitectDataStore.getEntityForUpdate(entityType, entityId);
      if (!entityData) {
        console.error('WorkflowArchitectEventBridge: Entity not found for deletion');
        return false;
      }

      // Remove from local data store (includes cascading)
      const success = window.WorkflowArchitectDataStore.removeEntity(entityType, entityId);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to remove entity from local data store');
        return false;
      }

      // Send deletion event to Bubble
      const eventName = `${entityType}_deleted`;
      this.sendToBubble(eventName, { entityId: entityId });
      
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Entity delete failed', error);
      return false;
    }
  },

  // Handle drag-and-drop reordering
  handleReorder: function(entityType, entityId, newOrderIndex) {
    console.log('WorkflowArchitectEventBridge: Reorder requested', entityType, entityId, newOrderIndex);
    
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available');
      return false;
    }

    // Prevent overlapping reorder operations
    if (this.isProcessing) {
      console.log('WorkflowArchitectEventBridge: Reorder already in progress, skipping');
      return false;
    }

    try {
      this.isProcessing = true;

      // Update order index in local data store
      const updateData = { orderIndex: newOrderIndex };
      const success = window.WorkflowArchitectDataStore.updateEntity(entityType, entityId, updateData);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to update order in local data store');
        this.isProcessing = false;
        return false;
      }

      // Get formatted data for Bubble
      const bubbleUpdateData = window.WorkflowArchitectDataStore.getEntityForUpdate(entityType, entityId);
      if (!bubbleUpdateData) {
        console.error('WorkflowArchitectEventBridge: Failed to format reorder data for Bubble');
        this.isProcessing = false;
        return false;
      }

      // Send reorder event to Bubble
      const eventName = `${entityType}_reordered`;
      this.sendToBubble(eventName, bubbleUpdateData);

      // Clear processing flag after delay
      setTimeout(() => {
        this.isProcessing = false;
      }, this.debounceDelay);

      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Reorder failed', error);
      this.isProcessing = false;
      return false;
    }
  },

  // Debounced update to prevent rapid-fire updates
  debouncedBubbleUpdate: function(eventName, updateData) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Add to pending updates
    this.pendingUpdates.push({ eventName, updateData, timestamp: Date.now() });

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.processPendingUpdates();
    }, this.debounceDelay);
  },

  // Process all pending updates
  processPendingUpdates: function() {
    if (this.pendingUpdates.length === 0) {
      return;
    }

    console.log('WorkflowArchitectEventBridge: Processing', this.pendingUpdates.length, 'pending updates');

    // Group updates by entity to avoid duplicates
    const latestUpdates = {};
    this.pendingUpdates.forEach(update => {
      const key = `${update.eventName}_${update.updateData.entityId}`;
      if (!latestUpdates[key] || update.timestamp > latestUpdates[key].timestamp) {
        latestUpdates[key] = update;
      }
    });

    // Send latest updates to Bubble
    Object.values(latestUpdates).forEach(update => {
      this.sendToBubble(update.eventName, update.updateData);
    });

    // Clear pending updates
    this.pendingUpdates = [];
    this.debounceTimer = null;
  },

  // Send data to Bubble  // Core method to send data to Bubble
  sendToBubble: function(eventName, data, stateKey = 'pending_update') {
    if (!this.bubbleInstance) {
      console.error('WorkflowArchitectEventBridge: No Bubble instance available for', eventName);
      return false;
    }

    try {
      console.log('WorkflowArchitectEventBridge: Sending to Bubble:', eventName, data);

      // Set custom state with the data payload using the specified state key
      this.bubbleInstance.publishState(stateKey, JSON.stringify(data));

      // Trigger the event
      this.bubbleInstance.triggerEvent(eventName);

      console.log('WorkflowArchitectEventBridge: Successfully sent', eventName, 'to Bubble');
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Failed to send to Bubble:', eventName, error);
      return false;
    }
  },

  // Handle Bubble data refresh (when data changes externally)
  handleDataRefresh: function(newBubbleData) {
    console.log('WorkflowArchitectEventBridge: Data refresh requested');
    
    try {
      // Re-initialize data store with fresh data
      const success = window.WorkflowArchitectDataStore.init(newBubbleData);
      if (!success) {
        console.error('WorkflowArchitectEventBridge: Failed to refresh data store');
        return false;
      }

      // Clear any pending updates (they're now stale)
      this.pendingUpdates = [];
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      console.log('WorkflowArchitectEventBridge: Data refresh complete');
      return true;

    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Data refresh failed', error);
      return false;
    }
  },

  // Calculate precise order index for drag-drop positioning
  calculateOrderIndex: function(entityType, targetPosition, entities) {
    // Use decimal positioning system from storymap-grid
    if (entities.length === 0) {
      return 1.0;
    }

    if (targetPosition <= 0) {
      // Insert at beginning
      const firstEntity = entities[0];
      return firstEntity.orderIndex - 1.0;
    }

    if (targetPosition >= entities.length) {
      // Insert at end
      const lastEntity = entities[entities.length - 1];
      return lastEntity.orderIndex + 1.0;
    }

    // Insert between two entities
    const prevEntity = entities[targetPosition - 1];
    const nextEntity = entities[targetPosition];
    return (prevEntity.orderIndex + nextEntity.orderIndex) / 2.0;
  },

  // Get current status
  getStatus: function() {
    return {
      isInitialized: !!this.bubbleInstance,
      isProcessing: this.isProcessing,
      pendingUpdates: this.pendingUpdates.length,
      debounceActive: !!this.debounceTimer
    };
  },

  // Force flush all pending updates (for testing)
  flush: function() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.processPendingUpdates();
    }
  },

  // Re-render UI after data changes
  reRenderUI: function() {
    console.log('WorkflowArchitectEventBridge: Re-rendering UI');
    
    try {
      // Get latest data from data store
      if (window.WorkflowArchitectDataStore && window.WorkflowArchitectDataStore.data.isInitialized) {
        const latestData = {
          containers: window.WorkflowArchitectDataStore.getContainersArray(),
          sequences: window.WorkflowArchitectDataStore.getSequencesArray(),
          workflows: window.WorkflowArchitectDataStore.getWorkflowsArray(),
          feature: window.WorkflowArchitectDataStore.getFeature()
        };
        
        // Trigger rerender via custom event (following storymap-grid pattern)
        const rerenderEvent = new CustomEvent('workflow-architect:rerender', {
          detail: latestData
        });
        document.dispatchEvent(rerenderEvent);
        
        console.log('WorkflowArchitectEventBridge: Rerender event dispatched with data:', latestData);
      }
    } catch (error) {
      console.error('WorkflowArchitectEventBridge: Failed to re-render UI', error);
    }
  }
};

console.log('DEBUG: event-bridge.js script loaded successfully. WorkflowArchitectEventBridge object created:', typeof window.WorkflowArchitectEventBridge);
