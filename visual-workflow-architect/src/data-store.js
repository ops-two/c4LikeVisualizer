// Visual Workflow Architect - Data Store
// Centralized state management for Features, Containers, Sequences, and Workflows
// Based on proven patterns from storymap-grid implementation

console.log("DEBUG: data-store.js script is loading...");

window.WorkflowArchitectDataStore = {
  // Internal data storage
  data: {
    feature: null,
    containers: {},
    sequences: {},
    workflows: {},
    subgroups: {}, // ADD THIS LINE
    isInitialized: false,
    lastUpdate: null,
  },

  // Initialize store with Bubble's raw data
  init: function (bubbleData) {
    try {
      // Reset data structure
      this.data = {
        feature: null,
        containers: {},
        sequences: {},
        workflows: {},
        subgroups: {}, // ADD THIS LINE
        isInitialized: false,
        lastUpdate: new Date(),
      };

      // Process feature data
      if (bubbleData.feature) {
        this.data.feature = this.transformFeature(bubbleData.feature);
      }

      // Process containers array into indexed object
      if (bubbleData.containers && Array.isArray(bubbleData.containers)) {
        bubbleData.containers.forEach((container) => {
          const transformedContainer = this.transformContainer(container);
          this.data.containers[transformedContainer.id] = transformedContainer;
        });
      }

      // Process sequences array into indexed object
      if (bubbleData.sequences && Array.isArray(bubbleData.sequences)) {
        bubbleData.sequences.forEach((sequence) => {
          const transformedSequence = this.transformSequence(sequence);
          this.data.sequences[transformedSequence.id] = transformedSequence;
        });
      }

      // Process workflows array into indexed object
      if (bubbleData.workflows && Array.isArray(bubbleData.workflows)) {
        bubbleData.workflows.forEach((workflow) => {
          const transformedWorkflow = this.transformWorkflow(workflow);
          this.data.workflows[transformedWorkflow.id] = transformedWorkflow;
        });
      }

      // ADD THIS NEW BLOCK to process subgroups
      if (bubbleData.subgroups && Array.isArray(bubbleData.subgroups)) {
        bubbleData.subgroups.forEach((subgroup) => {
          const transformedSubgroup = this.transformSubgroup(subgroup);
          this.data.subgroups[transformedSubgroup.id] = transformedSubgroup;
        });
      }

      this.data.isInitialized = true;
      return true;
    } catch (error) {
      return false;
    }
  },

  // ... existing code
  // Transform Bubble feature data to internal format
  transformFeature: function (bubbleFeature) {
    if (!bubbleFeature || typeof bubbleFeature.get !== "function") return null;
    return {
      id: bubbleFeature.get("_id"),
      name: bubbleFeature.get("name_text") || "Untitled Feature",
      description: bubbleFeature.get("description_text") || "",
      // NOTE: workspaceId is not a standard field, assuming it's a relationship
      // workspaceId: bubbleFeature.get('workspace_custom_workspace')?.get('_id') || "",
      orderIndex: bubbleFeature.get("order_index_number") || 0,
      createdDate: bubbleFeature.get("Created Date") || new Date(),
      modifiedDate: bubbleFeature.get("Modified Date") || new Date(),
    };
  },
  // ... existing code

  // ... existing code
  // Transform Bubble container data to internal format
  transformContainer: function (bubbleContainer) {
    if (!bubbleContainer || typeof bubbleContainer.get !== "function")
      return null;
    const featureRef = bubbleContainer.get("feature_custom_feature3"); // Using confirmed field name

    return {
      id: bubbleContainer.get("_id"),
      name: bubbleContainer.get("name_text") || "Untitled Container",
      // NOTE: 'type' is an Option Set or relationship, requires specific handling
      // type: bubbleContainer.get('type_option_...') || "Component",
      featureId: featureRef ? featureRef.get("_id") : null,
      componentUrl: bubbleContainer.get("url") || "",
      description: bubbleContainer.get("description_text") || "",
      orderIndex: bubbleContainer.get("order_index_number") || 0,
      colorHex: bubbleContainer.get("color_hex_text") || "#3ea50b",
      createdDate: bubbleContainer.get("Created Date") || new Date(),
      modifiedDate: bubbleContainer.get("Modified Date") || new Date(),
    };
  },
  // ... existing code

  // ... existing code
  // Transform Bubble sequence data to internal format
  transformSequence: function (bubbleSequence) {
    if (!bubbleSequence || typeof bubbleSequence.get !== "function")
      return null;

    const fromContainerRef = bubbleSequence.get(
      "fromcontainer_custom_component"
    );
    const toContainerRef = bubbleSequence.get("tocontainer_custom_component");
    const workflowRef = bubbleSequence.get("workflow_custom_workflows");
    
    // Use the confirmed field name from debug output
    const subgroupRef = bubbleSequence.get("subgroup_custom_subgroup");
    
    // Debug log subgroup relationship for each sequence
    if (subgroupRef) {
      console.log(`DEBUG - Sequence ${bubbleSequence.get("_id")} has subgroup:`, subgroupRef.get("_id"));
    } else {
      console.log(`DEBUG - Sequence ${bubbleSequence.get("_id")} has no subgroup relationship`);
    }

    return {
      id: bubbleSequence.get("_id"),
      label: bubbleSequence.get("label_text") || "Untitled Sequence",
      description: bubbleSequence.get("description_text") || "",
      fromContainerId: fromContainerRef ? fromContainerRef.get("_id") : null,
      toContainerId: toContainerRef ? toContainerRef.get("_id") : null,
      workflowId: workflowRef ? workflowRef.get("_id") : null,
      subgroupId: subgroupRef ? subgroupRef.get("_id") : null,
      orderIndex: bubbleSequence.get("order_index_number") || 0,
      isDashed: bubbleSequence.get("is_dashed_boolean") || false,
      createdDate: bubbleSequence.get("Created Date") || new Date(),
      modifiedDate: bubbleSequence.get("Modified Date") || new Date(),
    };
  },
  // ... existing code

  // Transform Bubble workflow data to internal format
  transformWorkflow: function (bubbleWorkflow) {
    if (!bubbleWorkflow || typeof bubbleWorkflow.get !== "function") {
      // Handle non-Bubble object (fallback)
      return {
        id: bubbleWorkflow.workflow_id || bubbleWorkflow.id,
        name:
          bubbleWorkflow.label_text ||
          bubbleWorkflow.label ||
          "Untitled Workflow",
        description:
          bubbleWorkflow.description_text || bubbleWorkflow.description || "",
        featureId: bubbleWorkflow.feature_id || "",
        colorHex:
          bubbleWorkflow.color_hex_text ||
          bubbleWorkflow.color_hex ||
          "#e3f2fd",
        orderIndex:
          bubbleWorkflow.order_index_number || bubbleWorkflow.order_index || 0,
        createdDate: bubbleWorkflow.created_date || new Date(),
        modifiedDate: bubbleWorkflow.modified_date || new Date(),
      };
    }

    // Handle Bubble object with .get() method
    const featureRef = bubbleWorkflow.get("feature_custom_feature3");

    return {
      id: bubbleWorkflow.get("_id"),
      name: bubbleWorkflow.get("label_text") || "Untitled Workflow",
      description: bubbleWorkflow.get("description_text") || "",
      featureId: featureRef ? featureRef.get("_id") : null,
      colorHex: bubbleWorkflow.get("color_hex_text") || "#e3f2fd",
      orderIndex: bubbleWorkflow.get("order_index_number") || 0,
      createdDate: bubbleWorkflow.get("Created Date") || new Date(),
      modifiedDate: bubbleWorkflow.get("Modified Date") || new Date(),
    };
  },
  transformSubgroup: function (bubbleSubgroup) {
    if (!bubbleSubgroup || typeof bubbleSubgroup.get !== "function") {
      // Handle non-Bubble object (fallback)
      return {
        id: bubbleSubgroup.id,
        label: bubbleSubgroup.label || "Untitled Subgroup",
        workflowId: bubbleSubgroup.workflowId || null,
        colorHex: bubbleSubgroup.colorHex || "#f5f5f5",
        // No orderIndex field in subgroup schema
        createdDate: bubbleSubgroup.createdDate || new Date(),
        modifiedDate: bubbleSubgroup.modifiedDate || new Date(),
      };
    }

    // Handle Bubble object with .get() method - using correct field names from memory
    const workflowRef = bubbleSubgroup.get("Workflow");
    const workflowId = workflowRef ? workflowRef.get("_id") : null;

    return {
      id: bubbleSubgroup.get("_id"),
      label: bubbleSubgroup.get("Label") || "Untitled Subgroup",
      workflowId: workflowId,
      colorHex: bubbleSubgroup.get("color_Hex") || "#f5f5f5",
      // No orderIndex field in subgroup schema
      createdDate: bubbleSubgroup.get("Created Date") || new Date(),
      modifiedDate: bubbleSubgroup.get("Modified Date") || new Date(),
    };
  },
  // Get feature data
  getFeature: function () {
    return this.data.feature;
  },

  // Get all containers as array
  getContainersArray: function () {
    return Object.values(this.data.containers).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
  },

  // Get container by ID
  getContainer: function (containerId) {
    return this.data.containers[containerId] || null;
  },

  // Get all sequences as array
  getSequencesArray: function () {
    return Object.values(this.data.sequences).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
  },

  // Get sequences for a specific workflow
  getSequencesByWorkflow: function (workflowId) {
    return Object.values(this.data.sequences)
      .filter((sequence) => sequence.workflowId === workflowId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },

  // Get sequence by ID
  getSequence: function (sequenceId) {
    return this.data.sequences[sequenceId] || null;
  },

  // Get all workflows as array
  getWorkflowsArray: function () {
    return Object.values(this.data.workflows).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
  },

  getWorkflow: function (workflowId) {
    return this.data.workflows[workflowId] || null;
  },

  // ADD THIS ENTIRE BLOCK OF NEW FUNCTIONS
  // Get all subgroups as array
  getSubgroupsArray: function () {
    return Object.values(this.data.subgroups);
  },

  // Get subgroups for a specific workflow
  getSubgroupsByWorkflow: function (workflowId) {
    return Object.values(this.data.subgroups)
      .filter((subgroup) => subgroup.workflowId === workflowId);
  },

  // Get subgroup by ID
  getSubgroup: function (subgroupId) {
    return this.data.subgroups[subgroupId] || null;
  },
  // END OF NEW FUNCTIONS
  // Update entity locally (before sending to Bubble)
  updateEntity: function (entityType, entityId, updates) {
    try {
      const entityStore = this.data[entityType + "s"]; // containers, sequences, workflows
      if (!entityStore || !entityStore[entityId]) {
        console.error(`Entity not found: ${entityType} ${entityId}`);
        return false;
      }

      // Apply updates
      Object.assign(entityStore[entityId], updates, {
        modifiedDate: new Date(),
      });

      console.log(`Updated ${entityType} ${entityId}:`, entityStore[entityId]);
      return true;
    } catch (error) {
      console.error(`Failed to update ${entityType} ${entityId}:`, error);
      return false;
    }
  },

  // Get entity data formatted for Bubble updates (following storymap-grid pattern)
  getEntityForUpdate: function (entityType, entityId) {
    try {
      const entity = this.data[entityType + "s"][entityId];
      if (!entity) {
        console.error(`Entity not found for update: ${entityType} ${entityId}`);
        return null;
      }

      // Base update format (required fields)
      const updateData = {
        entityId: entity.id,
        name_text: entity.name,
        order_index: entity.orderIndex,
      };

      // Add entity-specific fields
      switch (entityType) {
        case "container":
          updateData.type_text = entity.type;
          updateData.component_url_text = entity.componentUrl;
          updateData.color_hex_text = entity.colorHex;
          updateData.description_text = entity.description;
          break;

        case "sequence":
          updateData.from_container_id = entity.fromContainerId;
          updateData.to_container_id = entity.toContainerId;
          updateData.action_type_text = entity.actionType;
          updateData.workflow_id = entity.workflowId;
          updateData.is_dashed_boolean = entity.isDashed;
          updateData.description_text = entity.description;
          updateData.label_text = entity.label;
          break;

        case "workflow":
          updateData.color_hex_text = entity.colorHex;
          updateData.feature_id = entity.featureId;
          updateData.description_text = entity.description;
          break;
      }

      return updateData;
    } catch (error) {
      console.error(
        `Failed to format entity for update: ${entityType} ${entityId}:`,
        error
      );
      return null;
    }
  },

  // Add new entity locally
  addEntity: function (entityType, entityData) {
    try {
      const entityStore = this.data[entityType + "s"];
      if (!entityStore) {
        console.error(`Invalid entity type: ${entityType}`);
        return false;
      }

      // Generate temporary ID if not provided
      const entityId =
        entityData.id ||
        `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Transform and store entity
      let transformedEntity;
      switch (entityType) {
        case "container":
          transformedEntity = this.transformContainer({
            ...entityData,
            id: entityId,
          });
          break;
        case "sequence":
          transformedEntity = this.transformSequence({
            ...entityData,
            id: entityId,
          });
          break;
        case "workflow":
          transformedEntity = this.transformWorkflow({
            ...entityData,
            id: entityId,
          });
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

  // Calculate next order_index for entities
  getNextOrderIndex: function (entityType) {
    try {
      const entityStore = this.data[entityType + "s"];
      if (!entityStore || Object.keys(entityStore).length === 0) {
        return 0; // First item
      }

      // Find the highest order_index and add 1
      const maxOrderIndex = Math.max(
        ...Object.values(entityStore).map((entity) => entity.orderIndex || 0)
      );

      return maxOrderIndex + 1;
    } catch (error) {
      console.error(
        "WorkflowArchitectDataStore: Failed to calculate next order index",
        error
      );
      return 0;
    }
  },

  // Remove entity locally
  removeEntity: function (entityType, entityId) {
    try {
      const entityStore = this.data[entityType + "s"];
      if (!entityStore || !entityStore[entityId]) {
        console.error(
          `Entity not found for removal: ${entityType} ${entityId}`
        );
        return false;
      }

      delete entityStore[entityId];
      console.log(`Removed ${entityType} ${entityId}`);

      // Handle cascading deletions
      if (entityType === "container") {
        // Remove sequences that reference this container
        Object.keys(this.data.sequences).forEach((sequenceId) => {
          const sequence = this.data.sequences[sequenceId];
          if (
            sequence.fromContainerId === entityId ||
            sequence.toContainerId === entityId
          ) {
            this.removeEntity("sequence", sequenceId);
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
  validateData: function () {
    const issues = [];

    // Check for orphaned sequences
    Object.values(this.data.sequences).forEach((sequence) => {
      if (!this.data.containers[sequence.fromContainerId]) {
        issues.push(
          `Sequence ${sequence.id} references missing container ${sequence.fromContainerId}`
        );
      }
      if (!this.data.containers[sequence.toContainerId]) {
        issues.push(
          `Sequence ${sequence.id} references missing container ${sequence.toContainerId}`
        );
      }
      if (!this.data.workflows[sequence.workflowId]) {
        issues.push(
          `Sequence ${sequence.id} references missing workflow ${sequence.workflowId}`
        );
      }
    });

    // Check for orphaned workflows
    Object.values(this.data.workflows).forEach((workflow) => {
      if (this.data.feature && workflow.featureId !== this.data.feature.id) {
        issues.push(
          `Workflow ${workflow.id} references different feature ${workflow.featureId}`
        );
      }
    });

    return issues;
  },

  // Get summary statistics
  getStats: function () {
    return {
      containers: Object.keys(this.data.containers).length,
      sequences: Object.keys(this.data.sequences).length,
      workflows: Object.keys(this.data.workflows).length,
      isInitialized: this.data.isInitialized,
      lastUpdate: this.data.lastUpdate,
    };
  },
};

console.log(
  "DEBUG: data-store.js script loaded successfully. WorkflowArchitectDataStore object created:",
  typeof window.WorkflowArchitectDataStore
);
