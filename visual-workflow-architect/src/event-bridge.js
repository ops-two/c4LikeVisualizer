// Simple event bridge following storymap pattern exactly
window.WorkflowArchitectEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    if (this.isInitialized) return;
    this.instance = instance;
    this.isInitialized = true;
    console.log(
      "WorkflowArchitectEventBridge: Initialized with simple event pattern"
    );
  },

  // Handle container creation
  handleContainerAdd: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Container add requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("container_added");
  },

  // Handle container updates
  handleContainerUpdate: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Container update requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("container_updated");
  },

  // Handle sequence creation
  handleSequenceAdd: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Sequence add requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("sequence_added");
  },

  // Handle sequence updates
  handleSequenceUpdate: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Sequence update requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("sequence_updated");
  },

  // Handle workflow creation
  handleWorkflowAdd: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Workflow add requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("workflow_added");
  },

  // Handle workflow updates
  handleWorkflowUpdate: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Workflow update requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("workflow_updated");
  },

  // Handle subgroup creation
  handleSubgroupAdd: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Subgroup add requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("subgroup_added");
  },

  // Handle subgroup updates
  handleSubgroupUpdate: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Subgroup update requested",
      eventData
    );
    this.instance.publishState("pending_update", JSON.stringify(eventData));
    this.instance.triggerEvent("subgroup_updated");
  },

  // Handle sequence creation trigger (for "Add Sequence" button)
  handleSequenceCreationTrigger: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Sequence creation trigger",
      eventData
    );
    this.handleSequenceAdd(eventData);
  },

  // Handle subgroup creation trigger (for "Add Subgroup" button)
  handleSubgroupCreationTrigger: function (eventData) {
    console.log(
      "WorkflowArchitectEventBridge: Subgroup creation trigger",
      eventData
    );
    this.handleSubgroupAdd(eventData);
  },
};

console.log(
  "WorkflowArchitectEventBridge: Simple event bridge loaded successfully"
);
