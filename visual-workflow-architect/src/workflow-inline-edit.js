// Visual Workflow Architect - Workflow Inline Edit Module
// Specialized inline editing functionality for workflow labels with doc icon support

window.WorkflowArchitectWorkflowInlineEdit = {
  // Current edit state
  currentEdit: null,
  isInitialized: false,

  // Initialize workflow inline editing
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Double-click editing for workflow labels
    document.addEventListener("dblclick", (e) => {
      console.log(
        "Double-click detected on:",
        e.target,
        "Classes:",
        e.target.classList
      );

      // Check if target is a workflow label or is inside one
      let workflowElement = null;

      if (e.target.classList.contains("workflow-label")) {
        workflowElement = e.target;
      } else {
        // Check if we're clicking on a child element (doc icon or text span)
        workflowElement = e.target.closest(".workflow-label");
      }

      if (workflowElement && workflowElement.dataset.workflowId) {
        console.log(
          "Starting workflow edit for:",
          workflowElement.dataset.workflowId
        );
        e.preventDefault();
        e.stopPropagation();
        this.startEdit(workflowElement);
      }
    });

    // Click outside to save
    document.addEventListener("click", (e) => {
      if (this.currentEdit && !this.currentEdit.input.contains(e.target)) {
        this.saveEdit();
      }
    });

    // Escape key to cancel
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentEdit) {
        this.cancelEdit();
      }
    });
  },

  startEdit(element) {
    if (this.currentEdit) this.cancelEdit();

    const workflowId = element.dataset.workflowId;
    const currentText = element.dataset.labelText || element.textContent.trim();

    if (!workflowId) {
      console.error("No workflow ID found for editing");
      return;
    }

    // Get original element's dimensions and position relative to the diagram container
    const rect = element.getBoundingClientRect();
    const containerRect = element
      .closest(".diagram-container")
      .getBoundingClientRect();

    // Create an input container that perfectly matches the original element's size and position
    const inputContainer = document.createElement("div");
    inputContainer.className = "workflow-edit-container";
    inputContainer.style.cssText = `
    position: absolute;
    background: white;
    border: 2px solid #4caf50;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 1000;
    display: flex;
    align-items: center;
    left: ${rect.left - containerRect.left}px;
    top: ${rect.top - containerRect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    box-sizing: border-box;
  `;

    // Create an input field that fills the new container
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.style.cssText = `
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    width: 100%;
    height: 100%;
    padding: 0 12px; /* Horizontal padding */
    box-sizing: border-box;
  `;

    // Assemble container
    inputContainer.appendChild(input);

    // Hide the original element now that the replacement is ready
    element.style.visibility = "hidden";

    // Insert the new edit container into the diagram
    const diagramContainer = element.closest(".diagram-container");
    diagramContainer.appendChild(inputContainer);

    // Store edit state
    this.currentEdit = {
      element: element,
      input: input,
      container: inputContainer,
      workflowId: workflowId,
      originalText: currentText,
    };

    // Focus and select text
    input.focus();
    input.select();

    // Handle Enter key to save
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEdit();
      }
    });
  },

  handleDocIconClick(workflowId) {
    console.log("Doc icon clicked for workflow:", workflowId);

    // Trigger workflow clicked event (same as hover doc icon)
    if (window.WorkflowArchitectEventBridge) {
      window.WorkflowArchitectEventBridge.handleWorkflowClick(workflowId);
    } else {
      console.error("WorkflowArchitectEventBridge not available");
    }
  },

  saveEdit() {
    if (!this.currentEdit) return;

    const newText = this.currentEdit.input.value.trim();
    const workflowId = this.currentEdit.workflowId;

    if (newText && newText !== this.currentEdit.originalText) {
      // Update via event bridge
      if (window.WorkflowArchitectEventBridge) {
        const updateData = {
          workflowId: workflowId,
          labelText: newText,
          timestamp: Date.now(),
        };

        window.WorkflowArchitectEventBridge.handleWorkflowUpdate(updateData);
      } else {
        console.error("WorkflowArchitectEventBridge not available");
      }
    }

    this.cleanup();
  },

  cancelEdit() {
    this.cleanup();
  },

  cleanup() {
    if (this.currentEdit) {
      if (this.currentEdit.element) {
        this.currentEdit.element.style.visibility = "visible";
      }
      // Remove the edit container from the DOM
      if (this.currentEdit.container && this.currentEdit.container.parentNode) {
        this.currentEdit.container.parentNode.removeChild(
          this.currentEdit.container
        );
      }
      this.currentEdit = null;
    }
  },
};

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.WorkflowArchitectWorkflowInlineEdit.init();
  });
} else {
  window.WorkflowArchitectWorkflowInlineEdit.init();
}
