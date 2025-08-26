// Visual Workflow Architect - Sequence Data Store
// Manages local state for containers and sequences with optimistic updates
// Based on proven storymap-grid data management patterns

console.log('DEBUG: sequence-data-store.js script is loading...');

window.SequenceDiagramDataStore = {
  // Local data maps for entities
  containers: new Map(),
  sequences: new Map(),
  feature: null,
  isInitialized: false,

  // Initialize the data store
  init(featureData, containersData, sequencesData) {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('SequenceDiagramDataStore: Initializing data store');
    
    this.loadData(featureData, containersData, sequencesData);
    console.log('SequenceDiagramDataStore: Initialization complete');
  },

  // Update feature info without reinitializing everything
  updateFeature(featureData) {
    console.log('SequenceDiagramDataStore: Updating feature info only');
    this.feature = featureData;
  },

  // Load initial data from Bubble
  loadData(featureData, containersData, sequencesData) {
    // Store feature context
    this.feature = featureData;
    
    // Load containers into Map
    this.containers.clear();
    if (containersData && Array.isArray(containersData)) {
      containersData.forEach(container => {
        this.containers.set(container._id, {
          id: container._id,
          name: container.name_text || 'Unnamed Container',
          type: container.type_text || 'Component',
          color: container.color_hex_text || '#3ea50b',
          orderIndex: container.order_index_number || 0,
          featureId: container.feature_id
        });
      });
    }
    
    // Load sequences into Map
    this.sequences.clear();
    if (sequencesData && Array.isArray(sequencesData)) {
      sequencesData.forEach(sequence => {
        this.sequences.set(sequence._id, {
          id: sequence._id,
          label: sequence.label_text || 'Unnamed Sequence',
          fromContainerId: sequence.from_container_id,
          toContainerId: sequence.to_container_id,
          isDashed: sequence.is_dashed_boolean || false,
          color: sequence.color_hex_text || '#1976d2',
          orderIndex: sequence.order_index_number || 0,
          featureId: sequence.feature_id
        });
      });
    }
    
    console.log(`SequenceDiagramDataStore: Loaded ${this.containers.size} containers and ${this.sequences.size} sequences`);
  },

  // Container operations
  getContainer(containerId) {
    return this.containers.get(containerId);
  },

  getAllContainers() {
    return Array.from(this.containers.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  updateContainerName(containerId, newName) {
    const container = this.containers.get(containerId);
    if (container) {
      container.name = newName;
      console.log(`SequenceDiagramDataStore: Updated container ${containerId} name to "${newName}"`);
    }
  },

  addContainer(containerData) {
    const tempId = 'temp_' + Date.now();
    const container = {
      id: tempId,
      name: containerData.name || 'New Container',
      type: containerData.type || 'Component',
      color: containerData.color || '#3ea50b',
      orderIndex: containerData.orderIndex || this.getNextContainerOrder(),
      featureId: containerData.featureId || this.feature?.feature_id,
      isTemp: true
    };
    
    this.containers.set(tempId, container);
    console.log('SequenceDiagramDataStore: Added temporary container:', container);
    console.log('SequenceDiagramDataStore: Container featureId:', container.featureId);
    console.log('SequenceDiagramDataStore: Current feature:', this.feature);
    return container;
  },

  removeContainer(containerId) {
    const removed = this.containers.delete(containerId);
    if (removed) {
      // Also remove sequences connected to this container
      const sequencesToRemove = [];
      this.sequences.forEach((sequence, id) => {
        if (sequence.fromContainerId === containerId || sequence.toContainerId === containerId) {
          sequencesToRemove.push(id);
        }
      });
      
      sequencesToRemove.forEach(id => this.sequences.delete(id));
      console.log(`SequenceDiagramDataStore: Removed container ${containerId} and ${sequencesToRemove.length} related sequences`);
    }
    return removed;
  },

  // Sequence operations
  getSequence(sequenceId) {
    return this.sequences.get(sequenceId);
  },

  getAllSequences() {
    return Array.from(this.sequences.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  updateSequenceLabel(sequenceId, newLabel) {
    const sequence = this.sequences.get(sequenceId);
    if (sequence) {
      sequence.label = newLabel;
      console.log(`SequenceDiagramDataStore: Updated sequence ${sequenceId} label to "${newLabel}"`);
    }
  },

  addSequence(sequenceData) {
    const tempId = 'temp_' + Date.now();
    const sequence = {
      id: tempId,
      label: sequenceData.label || 'New Sequence',
      fromContainerId: sequenceData.fromContainerId,
      toContainerId: sequenceData.toContainerId,
      isDashed: sequenceData.isDashed || false,
      color: sequenceData.color || '#1976d2',
      orderIndex: sequenceData.orderIndex || this.getNextSequenceOrder(),
      featureId: this.feature?._id,
      isTemp: true
    };
    
    this.sequences.set(tempId, sequence);
    console.log('SequenceDiagramDataStore: Added temporary sequence:', sequence);
    return sequence;
  },

  removeSequence(sequenceId) {
    const removed = this.sequences.delete(sequenceId);
    if (removed) {
      console.log(`SequenceDiagramDataStore: Removed sequence ${sequenceId}`);
    }
    return removed;
  },

  // Order management
  getNextContainerOrder() {
    const containers = this.getAllContainers();
    return containers.length > 0 ? Math.max(...containers.map(c => c.orderIndex)) + 1 : 0;
  },

  getNextSequenceOrder() {
    const sequences = this.getAllSequences();
    return sequences.length > 0 ? Math.max(...sequences.map(s => s.orderIndex)) + 1 : 0;
  },

  updateContainerOrder(reorderData) {
    reorderData.forEach(item => {
      const container = this.containers.get(item.entityId);
      if (container) {
        container.orderIndex = item.order_index_number;
      }
    });
    console.log('SequenceDiagramDataStore: Updated container order');
  },

  updateSequenceOrder(reorderData) {
    reorderData.forEach(item => {
      const sequence = this.sequences.get(item.entityId);
      if (sequence) {
        sequence.orderIndex = item.order_index_number;
      }
    });
    console.log('SequenceDiagramDataStore: Updated sequence order');
  },

  // Data formatting for Bubble workflows
  formatContainerForBubble(container) {
    return {
      name_text: container.name,
      type_text: container.type,
      color_hex_text: container.color,
      order_index_number: container.orderIndex,
      feature_id: container.featureId
    };
  },

  formatSequenceForBubble(sequence) {
    return {
      label_text: sequence.label,
      from_container_id: sequence.fromContainerId,
      to_container_id: sequence.toContainerId,
      is_dashed_boolean: sequence.isDashed,
      color_hex_text: sequence.color,
      order_index_number: sequence.orderIndex,
      feature_id: sequence.featureId
    };
  },

  // Sequence diagram rendering data
  getSequenceDiagramData() {
    const containers = this.getAllContainers();
    const sequences = this.getAllSequences();
    
    // Create fallback sequences if none exist but containers do
    let processedSequences = [...sequences];
    if (sequences.length === 0 && containers.length > 1) {
      // Create a simple flow between containers
      for (let i = 0; i < containers.length - 1; i++) {
        processedSequences.push({
          id: `fallback_${i}`,
          label: `Step ${i + 1}`,
          fromContainerId: containers[i].id,
          toContainerId: containers[i + 1].id,
          isDashed: false,
          color: '#1976d2',
          orderIndex: i,
          isFallback: true
        });
      }
    }
    
    return {
      containers: containers,
      sequences: processedSequences,
      feature: this.feature
    };
  },

  // Validation helpers
  validateContainer(containerData) {
    const errors = [];
    
    if (!containerData.name || containerData.name.trim().length === 0) {
      errors.push('Container name is required');
    }
    
    if (containerData.name && containerData.name.length > 50) {
      errors.push('Container name must be 50 characters or less');
    }
    
    return errors;
  },

  validateSequence(sequenceData) {
    const errors = [];
    
    if (!sequenceData.label || sequenceData.label.trim().length === 0) {
      errors.push('Sequence label is required');
    }
    
    if (!sequenceData.fromContainerId) {
      errors.push('From container is required');
    }
    
    if (!sequenceData.toContainerId) {
      errors.push('To container is required');
    }
    
    if (sequenceData.fromContainerId === sequenceData.toContainerId) {
      errors.push('From and to containers cannot be the same');
    }
    
    if (!this.containers.has(sequenceData.fromContainerId)) {
      errors.push('From container does not exist');
    }
    
    if (!this.containers.has(sequenceData.toContainerId)) {
      errors.push('To container does not exist');
    }
    
    return errors;
  },

  // Utility functions
  refreshFromBubble(containersData, sequencesData) {
    console.log('SequenceDiagramDataStore: Refreshing data from Bubble');
    this.loadData(this.feature, containersData, sequencesData);
  },

  getStats() {
    return {
      containerCount: this.containers.size,
      sequenceCount: this.sequences.size,
      featureId: this.feature?._id
    };
  }
};

console.log('DEBUG: sequence-data-store.js script loaded successfully. SequenceDiagramDataStore object created:', typeof window.SequenceDiagramDataStore);
