// Visual Workflow Architect - Data Store
// Centralized state management for Features, Containers, Sequences, and Workflows
// Based on proven patterns from storymap-grid implementation

console.log('DEBUG: data-store.js script is loading...');

window.WorkflowArchitectDataStore = {
  // Internal data storage
  data: {
    feature: null,
    containers: {},
    sequences: {},
    workflows: {},
    isInitialized: false,
    lastUpdate: null
  },

  // Initialize store with Bubble's raw data
  init: function(bubbleData) {
    console.log('WorkflowArchitectDataStore: Initializing with data', bubbleData);
    
    try {
      // Reset data structure
      this.data = {
        feature: null,
        containers: {},
        sequences: {},
        workflows: {},
        isInitialized: false,
        lastUpdate: new Date()
      };

      // Process feature data
      if (bubbleData.feature) {
        this.data.feature = this.transformFeature(bubbleData.feature);
      }

      // Process containers array into indexed object
      if (bubbleData.containers && Array.isArray(bubbleData.containers)) {
        bubbleData.containers.forEach(container => {
          const transformedContainer = this.transformContainer(container);
          this.data.containers[transformedContainer.id] = transformedContainer;
        });
      }

      // Process sequences array into indexed object
      if (bubbleData.sequences && Array.isArray(bubbleData.sequences)) {
        bubbleData.sequences.forEach(sequence => {
          const transformedSequence = this.transformSequence(sequence);
          this.data.sequences[transformedSequence.id] = transformedSequence;
        });
      }

      // Process workflows array into indexed object
      if (bubbleData.workflows && Array.isArray(bubbleData.workflows)) {
        bubbleData.workflows.forEach(workflow => {
          const transformedWorkflow = this.transformWorkflow(workflow);
          this.data.workflows[transformedWorkflow.id] = transformedWorkflow;
        });
      }

      this.data.isInitialized = true;
      console.log('WorkflowArchitectDataStore: Initialization complete', this.data);
      return true;

    } catch (error) {
      console.error('WorkflowArchitectDataStore: Initialization failed', error);
      return false;
    }
  },

  // Transform Bubble feature data to internal format
  transformFeature: function(bubbleFeature) {
    return {
      id: bubbleFeature.feature_id || bubbleFeature.id,
      name: bubbleFeature.name_text || bubbleFeature.name || 'Untitled Feature', // 'name' field from schema
      description: bubbleFeature.description_text || bubbleFeature.description || '',
      workspaceId: bubbleFeature.workspace_id || '',
      orderIndex: bubbleFeature.order_index_number || bubbleFeature.order_index || 0,
      createdDate: bubbleFeature.created_date || new Date(),
      modifiedDate: bubbleFeature.modified_date || new Date()
    };
  },

  // Transform Bubble container data to internal format
  transformContainer: function(bubbleContainer) {
    return {
      id: bubbleContainer.container_id || bubbleContainer.id,
      name: bubbleContainer.name_text || 'Untitled Container', // 'name' field from schema
      type: bubbleContainer.type_text || 'Component',
      featureId: bubbleContainer.feature_id || '',
      componentUrl: bubbleContainer.component_url_text || bubbleContainer.url || '',
      description: bubbleContainer.description_text || bubbleContainer.description || '',
      orderIndex: bubbleContainer.order_index_number || bubbleContainer.order_index || 0,
      colorHex: bubbleContainer.color_hex_text || bubbleContainer.color_hex || '#3ea50b',
      createdDate: bubbleContainer.created_date || new Date(),
      modifiedDate: bubbleContainer.modified_date || new Date()
    };
  },

  // Transform Bubble sequence data to internal format
  transformSequence: function(bubbleSequence) {
    return {
      id: bubbleSequence.sequence_id || bubbleSequence.id,
      label: bubbleSequence.label_text || 'Untitled Sequence', // 'Label' field from schema
      description: bubbleSequence.description_text || bubbleSequence.description || '',
      fromContainerId: bubbleSequence.from_container_id || '',
      toContainerId: bubbleSequence.to_container_id || '',
      actionType: bubbleSequence.action_type_text || bubbleSequence.action_type || 'Data Flow',
      workflowId: bubbleSequence.workflow_id || '',
      orderIndex: bubbleSequence.order_index_number || bubbleSequence.order_index || 0,
      isDashed: bubbleSequence.is_dashed_boolean || bubbleSequence.is_dashed || false,
      createdDate: bubbleSequence.created_date || new Date(),
      modifiedDate: bubbleSequence.modified_date || new Date()
    };
  },

  // Transform Bubble workflow data to internal format
  transformWorkflow: function(bubbleWorkflow) {
    return {
      id: bubbleWorkflow.workflow_id || bubbleWorkflow.id,
      name: bubbleWorkflow.name_text || bubbleWorkflow.name || 'Untitled Workflow',
      description: bubbleWorkflow.description_text || bubbleWorkflow.description || '',
      featureId: bubbleWorkflow.feature_id || '',
      colorHex: bubbleWorkflow.color_hex_text || bubbleWorkflow.color_hex || '#e3f2fd',
      orderIndex: bubbleWorkflow.order_index_number || bubbleWorkflow.order_index || 0,
      createdDate: bubbleWorkflow.created_date || new Date(),
      modifiedDate: bubbleWorkflow.modified_date || new Date()
    };
  },

  // Get feature data
  getFeature: function() {
    return this.data.feature;
  },

  // Get all containers as array
  getContainersArray: function() {
    return Object.values(this.data.containers).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  // Get container by ID
  getContainer: function(containerId) {
    return this.data.containers[containerId] || null;
  },

  // Get all sequences as array
  getSequencesArray: function() {
    return Object.values(this.data.sequences).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  // Get sequences for a specific workflow
  getSequencesByWorkflow: function(workflowId) {
    return Object.values(this.data.sequences)
      .filter(sequence => sequence.workflowId === workflowId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },

  // Get sequence by ID
  getSequence: function(sequenceId) {
    return this.data.sequences[sequenceId] || null;
  },

  // Get all workflows as array
  getWorkflowsArray: function() {
    return Object.values(this.data.workflows).sort((a, b) => a.orderIndex - b.orderIndex);
  },

  // Get workflow by ID
  getWorkflow: function(workflowId) {
    return this.data.workflows[workflowId] || null;
  },

  // Update entity locally (before sending to Bubble)
  updateEntity: function(entityType, entityId, updates) {
    try {
      const entityStore = this.data[entityType + 's']; // containers, sequences, workflows
      if (!entityStore || !entityStore[entityId]) {
        console.error(`Entity not found: ${entityType} ${entityId}`);
        return false;
      }

      // Apply updates
      Object.assign(entityStore[entityId], updates, {
        modifiedDate: new Date()
      });

      console.log(`Updated ${entityType} ${entityId}:`, entityStore[entityId]);
      return true;

    } catch (error) {
      console.error(`Failed to update ${entityType} ${entityId}:`, error);
      return false;
    }
  },

  // Get entity data formatted for Bubble updates (following storymap-grid pattern)
  getEntityForUpdate: function(entityType, entityId) {
    try {
      const entity = this.data[entityType + 's'][entityId];
      if (!entity) {
        console.error(`Entity not found for update: ${entityType} ${entityId}`);
        return null;
      }

      // Base update format (required fields)
      const updateData = {
        entityId: entity.id,
        name_text: entity.name,
        order_index: entity.orderIndex
      };

      // Add entity-specific fields
      switch (entityType) {
        case 'container':
          updateData.type_text = entity.type;
          updateData.component_url_text = entity.componentUrl;
          updateData.color_hex_text = entity.colorHex;
          updateData.description_text = entity.description;
          break;

        case 'sequence':
          updateData.from_container_id = entity.fromContainerId;
          updateData.to_container_id = entity.toContainerId;
          updateData.action_type_text = entity.actionType;
          updateData.workflow_id = entity.workflowId;
          updateData.is_dashed_boolean = entity.isDashed;
          updateData.description_text = entity.description;
          updateData.label_text = entity.label;
          break;

        case 'workflow':
          updateData.color_hex_text = entity.colorHex;
          updateData.feature_id = entity.featureId;
          updateData.description_text = entity.description;
          break;
      }

      return updateData;

    } catch (error) {
      console.error(`Failed to format entity for update: ${entityType} ${entityId}:`, error);
      return null;
    }
  },

  // Add new entity locally
  addEntity: function(entityType, entityData) {
    try {
      const entityStore = this.data[entityType + 's'];
      if (!entityStore) {
        console.error(`Invalid entity type: ${entityType}`);
        return false;
      }

      // Generate temporary ID if not provided
      const entityId = entityData.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Transform and store entity
      let transformedEntity;
      switch (entityType) {
        case 'container':
          transformedEntity = this.transformContainer({...entityData, id: entityId});
          break;
        case 'sequence':
          transformedEntity = this.transformSequence({...entityData, id: entityId});
          break;
        case 'workflow':
          transformedEntity = this.transformWorkflow({...entityData, id: entityId});
          break;
        default:
          console.error(`Unknown entity type: ${entityType}`);
          return false;
      }

      entityStore[entityId] = transformedEntity;
      console.log(`Added ${entityType} ${entityId}:`, transformedEntity);
      return entityId;

    } catch (error) {
      console.error(`Failed to add ${entityType}:`, error);
      return false;
    }
  },

  // Remove entity locally
  removeEntity: function(entityType, entityId) {
    try {
      const entityStore = this.data[entityType + 's'];
      if (!entityStore || !entityStore[entityId]) {
        console.error(`Entity not found for removal: ${entityType} ${entityId}`);
        return false;
      }

      delete entityStore[entityId];
      console.log(`Removed ${entityType} ${entityId}`);

      // Handle cascading deletions
      if (entityType === 'container') {
        // Remove sequences that reference this container
        Object.keys(this.data.sequences).forEach(sequenceId => {
          const sequence = this.data.sequences[sequenceId];
          if (sequence.fromContainerId === entityId || sequence.toContainerId === entityId) {
            this.removeEntity('sequence', sequenceId);
          }
        });
      }

      return true;

    } catch (error) {
      console.error(`Failed to remove ${entityType} ${entityId}:`, error);
      return false;
    }
  },

  // Validate data integrity
  validateData: function() {
    const issues = [];

    // Check for orphaned sequences
    Object.values(this.data.sequences).forEach(sequence => {
      if (!this.data.containers[sequence.fromContainerId]) {
        issues.push(`Sequence ${sequence.id} references missing container ${sequence.fromContainerId}`);
      }
      if (!this.data.containers[sequence.toContainerId]) {
        issues.push(`Sequence ${sequence.id} references missing container ${sequence.toContainerId}`);
      }
      if (!this.data.workflows[sequence.workflowId]) {
        issues.push(`Sequence ${sequence.id} references missing workflow ${sequence.workflowId}`);
      }
    });

    // Check for orphaned workflows
    Object.values(this.data.workflows).forEach(workflow => {
      if (this.data.feature && workflow.featureId !== this.data.feature.id) {
        issues.push(`Workflow ${workflow.id} references different feature ${workflow.featureId}`);
      }
    });

    return issues;
  },

  // Get summary statistics
  getStats: function() {
    return {
      containers: Object.keys(this.data.containers).length,
      sequences: Object.keys(this.data.sequences).length,
      workflows: Object.keys(this.data.workflows).length,
      isInitialized: this.data.isInitialized,
      lastUpdate: this.data.lastUpdate
    };
  }
};

console.log('DEBUG: data-store.js script loaded successfully. WorkflowArchitectDataStore object created:', typeof window.WorkflowArchitectDataStore);
