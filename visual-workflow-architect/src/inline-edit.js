// Visual Workflow Architect - Inline Edit Module
// Modular inline editing functionality for containers and sequences

window.WorkflowArchitectInlineEdit = {
  // Current edit state
  currentEdit: null,
  isInitialized: false,

  // Initialize inline editing
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Double-click editing for container names and sequence labels
    document.addEventListener("dblclick", (e) => {
      if (e.target.classList.contains("container-name")) {
        e.preventDefault();
        e.stopPropagation();
        this.startEdit(e.target, "container");
      } else if (e.target.classList.contains("sequence-label")) {
        e.preventDefault();
        e.stopPropagation();
        this.startEdit(e.target, "sequence");
      }
    });

    // Click outside to save
    document.addEventListener("click", (e) => {
      if (this.currentEdit && !this.currentEdit.input.contains(e.target)) {
        this.saveEdit();
      }
    });
  },

  startEdit(element, entityType) {
    if (this.currentEdit) this.cancelEdit();

    const entityId = element.dataset[entityType + "Id"];
    if (!entityId) return;

    // For sequences, use the pure label text without order index
    let currentText;
    if (entityType === "sequence" && element.dataset.labelText) {
      currentText = element.dataset.labelText.trim();
    } else {
      currentText = element.textContent.trim();
    }
    
    this.createEditInput(element, currentText, entityType, entityId);
  },

  createEditInput(element, currentText, entityType, entityId) {
    this.currentEdit = {
      element,
      originalText: currentText,
      entityType,
      entityId,
      input: null,
    };

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "sequence-inline-edit-input";

    // Position input over element
    const rect = element.getBoundingClientRect();
    input.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 1000;
      border: 2px solid #1976d2;
      border-radius: 4px;
      padding: 4px 8px;
      background: white;
      font-family: inherit;
      font-size: inherit;
      outline: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    this.currentEdit.input = input;

    // Event listeners
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => this.currentEdit && this.saveEdit(), 100);
    });

    element.style.visibility = "hidden";
    document.body.appendChild(input);
    input.focus();
    input.select();
  },

  saveEdit() {
    if (!this.currentEdit) return;

    const newText = this.currentEdit.input.value.trim();
    const oldText = this.currentEdit.originalText;

    if (newText !== oldText && newText.length > 0) {
      // Don't update DOM directly - let the re-render handle proper formatting
      // this.currentEdit.element.textContent = newText;

      // Dispatch update event to event bridge
      if (this.currentEdit.entityType === "container") {
        this.dispatchContainerUpdate(
          this.currentEdit.entityId,
          newText,
          oldText
        );
      } else if (this.currentEdit.entityType === "sequence") {
        this.dispatchSequenceUpdate(
          this.currentEdit.entityId,
          newText,
          oldText
        );
      }
    }

    this.cleanupEdit();
  },

  cancelEdit() {
    this.cleanupEdit();
  },

  cleanupEdit() {
    if (!this.currentEdit) return;

    this.currentEdit.element.style.visibility = "visible";
    if (this.currentEdit.input && this.currentEdit.input.parentNode) {
      this.currentEdit.input.parentNode.removeChild(this.currentEdit.input);
    }
    this.currentEdit = null;
  },

  dispatchContainerUpdate(containerId, newName, oldName) {
    if (window.WorkflowArchitectEventBridge) {
      window.WorkflowArchitectEventBridge.handleContainerUpdate(containerId, {
        name: newName,
      });
    }
  },

  dispatchSequenceUpdate(sequenceId, newLabel, oldLabel) {
    if (window.WorkflowArchitectEventBridge) {
      window.WorkflowArchitectEventBridge.handleSequenceUpdate(sequenceId, {
        label: newLabel,
      });
    }
  },
};

console.log("WorkflowArchitectInlineEdit module loaded");
