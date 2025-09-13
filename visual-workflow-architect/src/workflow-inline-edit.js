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
      console.log("Double-click detected on:", e.target, "Classes:", e.target.classList);
      
      // Check if target is a workflow label or is inside one
      let workflowElement = null;
      
      if (e.target.classList.contains("workflow-label")) {
        workflowElement = e.target;
      } else {
        // Check if we're clicking on a child element (doc icon or text span)
        workflowElement = e.target.closest(".workflow-label");
      }
      
      if (workflowElement && workflowElement.dataset.workflowId) {
        console.log("Starting workflow edit for:", workflowElement.dataset.workflowId);
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

    // Create input container with doc icon
    const inputContainer = document.createElement("div");
    inputContainer.className = "workflow-edit-container";
    inputContainer.style.cssText = `
      position: absolute;
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 2px solid #4caf50;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
      height: 40px;
    `;

    // Create doc icon
    const docIcon = document.createElement("div");
    docIcon.innerHTML = "📄";
    docIcon.style.cssText = `
      font-size: 16px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    docIcon.title = "View workflow documentation";
    
    // Add hover effect for doc icon
    docIcon.addEventListener("mouseenter", () => {
      docIcon.style.opacity = "1";
    });
    docIcon.addEventListener("mouseleave", () => {
      docIcon.style.opacity = "0.7";
    });

    // Create input field
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
      flex: 1;
      min-width: 0;
    `;

    // Assemble container
    inputContainer.appendChild(docIcon);
    inputContainer.appendChild(input);

    // Position the input container
    const rect = element.getBoundingClientRect();
    const containerRect = element.closest('.diagram-container').getBoundingClientRect();
    
    inputContainer.style.left = `${rect.left - containerRect.left - 10}px`;
    inputContainer.style.top = `${rect.top - containerRect.top - 5}px`;

    // Insert into diagram container
    const diagramContainer = element.closest('.diagram-container');
    diagramContainer.appendChild(inputContainer);

    // Store edit state
    this.currentEdit = {
      element: element,
      input: input,
      container: inputContainer,
      workflowId: workflowId,
      originalText: currentText
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

    // Handle doc icon click
    docIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDocIconClick(workflowId);
    });
  },

  handleDocIconClick(workflowId) {
    console.log("Doc icon clicked for workflow:", workflowId);
    
    // Trigger workflow documentation event
    if (window.WorkflowArchitectEventBridge) {
      const eventData = {
        type: "workflow_documentation_clicked",
        workflowId: workflowId,
        timestamp: Date.now()
      };
      
      window.WorkflowArchitectEventBridge.handleWorkflowDocumentation(eventData);
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
          timestamp: Date.now()
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
      if (this.currentEdit.container && this.currentEdit.container.parentNode) {
        this.currentEdit.container.parentNode.removeChild(this.currentEdit.container);
      }
      this.currentEdit = null;
    }
  }
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.WorkflowArchitectWorkflowInlineEdit.init();
  });
} else {
  window.WorkflowArchitectWorkflowInlineEdit.init();
}
