// Visual Workflow Architect - Sequence Event Bridge
// Handles communication between sequence diagram interactions and Bubble workflows
// Based on proven storymap-grid event-driven architecture

console.log("DEBUG: sequence-event-bridge.js script is loading...");

window.SequenceDiagramEventBridge = {
  instance: null,
  isInitialized: false,

  // Initialize the event bridge with Bubble instance
  init(instance) {
    if (this.isInitialized) {
      console.log("SequenceDiagramEventBridge: Already initialized, skipping");
      return;
    }

    console.log("SequenceDiagramEventBridge: Starting initialization...");
    this.instance = instance;
    this.isInitialized = true;

    console.log("SequenceDiagramEventBridge: Bubble instance set:", !!instance);
    this.setupEventListeners();
    console.log("SequenceDiagramEventBridge: Initialization complete");
  },

  // Set up custom event listeners for sequence diagram interactions
  setupEventListeners() {
    console.log("SequenceDiagramEventBridge: Setting up event listeners...");

    // Container operations
    document.addEventListener('container_updated', this.handleContainerUpdate.bind(this));
    document.addEventListener('container_added', this.handleContainerAdd.bind(this));
    document.addEventListener('container_deleted', this.handleContainerDelete.bind(this));

    console.log(
      "SequenceDiagramEventBridge: Event listener for sequence:container_added registered"
    );

    // Sequence operations
    document.addEventListener(
      "sequence:sequence_updated",
      this.handleSequenceUpdate.bind(this)
    );
    document.addEventListener(
      "sequence:sequence_added",
      this.handleSequenceAdd.bind(this)
    );
    document.addEventListener(
      "sequence:sequence_deleted",
      this.handleSequenceDelete.bind(this)
    );

    // Reordering operations
    document.addEventListener(
      "sequence:reorder",
      this.handleReorder.bind(this)
    );

    console.log(
      "SequenceDiagramEventBridge: Event listeners registered successfully"
    );
    console.log(
      "SequenceDiagramEventBridge: Listening for container_added events"
    );

  },

  // Handle container name updates
  handleContainerUpdate(event) {
    console.log(
      "SequenceDiagramEventBridge: Handling container update:",
      event.detail
    );

    const payload = {
      entityType: "container",
      entityId: event.detail.containerId,
      fieldName: "name_text",
      newValue: event.detail.newName,
      oldValue: event.detail.oldName,
      allData: event.detail.containerData || {},
    };

    this.publishToWorkflow("pending_update", payload, "diagram_layout_changed");
  },

  // Handle sequence label updates
  handleSequenceUpdate(event) {
    console.log(
      "SequenceDiagramEventBridge: Handling sequence update:",
      event.detail
    );

    const payload = {
      entityType: "sequence",
      entityId: event.detail.sequenceId,
      fieldName: "label_text",
      newValue: event.detail.newLabel,
      oldValue: event.detail.oldLabel,
      allData: event.detail.sequenceData || {},
    };

    this.publishToWorkflow("pending_update", payload, "sequence_updated");

    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle container creation - following exact storymap-grid pattern
  handleContainerAdd(event) {
    console.log(
      "SequenceDiagramEventBridge: handleContainerAdd called with event:",
      event.detail
    );
    console.log("SequenceDiagramEventBridge: Event type received:", event.type);

    if (!this.instance) {
      console.error(
        "SequenceDiagramEventBridge: No Bubble instance available!"
      );
      return;
    }

    // Calculate next order_index intelligently (like storymap-grid does)
    const nextOrderIndex = this.getNextOrderIndex(
      "container",
      event.detail.featureId
    );

    // Create payload exactly like storymap-grid does
    const payload = {
      addType: "container",
      newOrderValue: nextOrderIndex,
      parentFeatureId: event.detail.featureId,
      name_text: event.detail.name,
      type_text: event.detail.type || "Component",
      color_hex_text: event.detail.color || "#3ea50b",
    };

    console.log(
      "SequenceDiagramEventBridge: Publishing to Bubble workflow:",
      payload
    );

    // Publish to Bubble workflow exactly like storymap-grid
    this.instance.publishState("pending_add", JSON.stringify(payload));
    this.instance.triggerEvent("container_added");

    console.log(
      "SequenceDiagramEventBridge: Bubble workflow triggered successfully"
    );

    // Re-render UI after successful operation (like storymap-grid does)
    setTimeout(() => {
      this.reRenderDiagram();
    }, 100);
  },

  // Handle sequence creation
  handleSequenceAdd(event) {
    console.log(
      "SequenceDiagramEventBridge: Handling sequence add:",
      event.detail
    );

    // Calculate next order_index intelligently for sequences
    const nextOrderIndex = this.getNextOrderIndex(
      "sequence",
      event.detail.featureId
    );

    const payload = {
      entityType: "sequence",
      label_text: event.detail.label,
      from_container_id: event.detail.fromContainerId,
      to_container_id: event.detail.toContainerId,
      feature_id: event.detail.featureId,
      is_dashed_boolean: event.detail.isDashed || false,
      color_hex_text: event.detail.color || "#1976d2",
      order_index_number: event.detail.orderIndex || nextOrderIndex,
    };

    this.publishToWorkflow("pending_add", payload, "sequence_added");

    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle container deletion
  handleContainerDelete(event) {
    console.log(
      "SequenceDiagramEventBridge: Handling container delete:",
      event.detail
    );

    const payload = {
      entityType: "container",
      entityId: event.detail.containerId,
      cascadeDelete: event.detail.cascadeSequences || true,
    };

    this.publishToWorkflow("pending_delete", payload, "container_deleted");

    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle sequence deletion
  handleSequenceDelete(event) {
    console.log(
      "SequenceDiagramEventBridge: Handling sequence delete:",
      event.detail
    );

    const payload = {
      entityType: "sequence",
      entityId: event.detail.sequenceId,
    };

    this.publishToWorkflow("pending_delete", payload, "sequence_deleted");

    // Re-render UI after successful operation
    this.reRenderDiagram();
  },

  // Handle drag-and-drop reordering
  handleReorder(event) {
    console.log("SequenceDiagramEventBridge: Handling reorder:", event.detail);

    const payload = {
      entityType: event.detail.entityType,
      reorderData: event.detail.items.map((item) => ({
        entityId: item.id,
        order_index_number: item.newOrder,
      })),
    };

    this.publishToWorkflow(
      "pending_reorder",
      payload,
      `${event.detail.entityType}_reordered`
    );
  },

  // Core function to publish data to Bubble and trigger workflows
  publishToWorkflow(stateKey, payload, eventName) {
    if (!this.instance) {
      console.error("SequenceDiagramEventBridge: No Bubble instance available");
      return;
    }

    try {
      // Publish the JSON payload to Bubble state
      const jsonPayload = JSON.stringify(payload);
      console.log(
        `SequenceDiagramEventBridge: Publishing ${stateKey}:`,
        jsonPayload
      );

      this.instance.publishState(stateKey, jsonPayload);

      // Trigger the corresponding Bubble workflow event
      console.log(`SequenceDiagramEventBridge: Triggering event: ${eventName}`);
      this.instance.triggerEvent(eventName);
    } catch (error) {
      console.error(
        "SequenceDiagramEventBridge: Error in publishToWorkflow:",
        error
      );
    }
  },

  // Calculate next order_index intelligently (like storymap-grid does)
  getNextOrderIndex(entityType, featureId) {
    if (!window.SequenceDiagramDataStore) {
      console.warn(
        "SequenceDiagramEventBridge: Data store not available, using fallback order_index"
      );
      return 0;
    }

    try {
      const entities =
        entityType === "container"
          ? window.SequenceDiagramDataStore.getAllContainers()
          : window.SequenceDiagramDataStore.getAllSequences();

      console.log(
        `SequenceDiagramEventBridge: Found ${entities.length} existing ${entityType}s in data store`
      );
      console.log(
        `SequenceDiagramEventBridge: Entities:`,
        entities.map((e) => ({
          id: e.id,
          name: e.name,
          orderIndex: e.orderIndex,
          featureId: e.featureId,
        }))
      );

      // Filter by feature and get max order
      const featureEntities = entities.filter((e) => e.featureId === featureId);
      console.log(
        `SequenceDiagramEventBridge: Found ${featureEntities.length} ${entityType}s for feature ${featureId}`
      );

      const maxOrder = Math.max(
        ...featureEntities.map((e) => e.orderIndex),
        -1
      );
      const nextOrder = maxOrder + 1;

      console.log(
        `SequenceDiagramEventBridge: Calculated next ${entityType} order_index: ${nextOrder} (max was ${maxOrder})`
      );
      return nextOrder;
    } catch (error) {
      console.error(
        "SequenceDiagramEventBridge: Error calculating order_index:",
        error
      );
      return 0;
    }
  },

  // Re-render the diagram after successful operations (like storymap-grid does)
  reRenderDiagram() {
    try {
      // Find the main plugin container (similar to storymap-grid pattern)
      const mainCanvas = document.querySelector(
        ".sequence-diagram-container[data-plugin-id]"
      );

      if (mainCanvas && window.WorkflowArchitectRenderer) {
        console.log(
          "SequenceDiagramEventBridge: Re-rendering diagram after operation"
        );

        // Get current data from data store
        if (window.SequenceDiagramDataStore) {
          const currentData =
            window.SequenceDiagramDataStore.getSequenceDiagramData();
          console.log(
            "SequenceDiagramEventBridge: Re-rendering with data:",
            currentData
          );

          // Simple re-render like storymap-grid - just call render directly
          window.WorkflowArchitectRenderer.render(currentData, $(mainCanvas));
        }
      } else {
        console.warn(
          "SequenceDiagramEventBridge: Cannot re-render - missing container or renderer"
        );
      }
    } catch (error) {
      console.error(
        "SequenceDiagramEventBridge: Error re-rendering diagram:",
        error
      );
    }
  },

  // Utility function to dispatch custom events from UI interactions
  dispatchContainerUpdate(containerId, newName, oldName, containerData) {
    const event = new CustomEvent("sequence:container_updated", {
      detail: {
        containerId,
        newName,
        oldName,
        containerData,
      },
    });
    document.dispatchEvent(event);
  },

  dispatchSequenceUpdate(sequenceId, newLabel, oldLabel, sequenceData) {
    const event = new CustomEvent("sequence:sequence_updated", {
      detail: {
        sequenceId,
        newLabel,
        oldLabel,
        sequenceData,
      },
    });
    document.dispatchEvent(event);
  },

  dispatchContainerAdd(name, type, color, featureId, orderIndex) {
    console.log(
      "SequenceDiagramEventBridge: dispatchContainerAdd called with:",
      { name, type, color, featureId, orderIndex }
    );

    const event = new CustomEvent("container_added", {
      detail: {
        name,
        type,
        color,
        featureId,
        orderIndex,
      },
    });

    console.log("SequenceDiagramEventBridge: Dispatching event:", event);
    document.dispatchEvent(event);
    console.log("SequenceDiagramEventBridge: Event dispatched successfully");
  },

  dispatchSequenceAdd(
    label,
    fromContainerId,
    toContainerId,
    featureId,
    isDashed,
    color,
    orderIndex
  ) {
    const event = new CustomEvent("sequence:sequence_added", {
      detail: {
        label,
        fromContainerId,
        toContainerId,
        featureId,
        isDashed,
        color,
        orderIndex,
      },
    });
    document.dispatchEvent(event);
  },

  dispatchReorder(entityType, items) {
    const event = new CustomEvent("sequence:reorder", {
      detail: {
        entityType,
        items,
      },
    });
    document.dispatchEvent(event);
  },
};

console.log(
  "DEBUG: sequence-event-bridge.js script loaded successfully. SequenceDiagramEventBridge object created:",
  typeof window.SequenceDiagramEventBridge
);
