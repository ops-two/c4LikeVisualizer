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
      // Check if target is a container name or a span inside a container
      if (e.target.classList.contains("container-name") || 
          (e.target.dataset.containerId && e.target.dataset.labelText)) {
        e.preventDefault();
        e.stopPropagation();
        // If clicking on span, find the parent container element for consistent behavior
        const containerElement = e.target.classList.contains("container-name") 
          ? e.target 
          : e.target.closest(".container-name") || e.target;
        this.startEdit(containerElement, "container");
      } else if (e.target.classList.contains("sequence-label") ||
                 (e.target.dataset.sequenceId && e.target.dataset.labelText)) {
        e.preventDefault();
        e.stopPropagation();
        // If clicking on span, find the parent sequence element for consistent behavior
        const sequenceElement = e.target.classList.contains("sequence-label")
          ? e.target
          : e.target.closest(".sequence-label") || e.target;
        this.startEdit(sequenceElement, "sequence");
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
      // Follow storymap pattern: Update local data store first
      if (this.currentEdit.entityType === "container") {
        // Update local data store
        window.WorkflowArchitectDataStore.updateEntity("container", this.currentEdit.entityId, {
          name: newText
        });
        
        // Get full entity data for Bubble update
        const fullEntityData = window.WorkflowArchitectDataStore.getEntityForUpdate("container", this.currentEdit.entityId);
        if (fullEntityData) {
          fullEntityData.name_text = newText;
        }

        // Dispatch custom event following storymap pattern
        document.dispatchEvent(
          new CustomEvent("workflow-architect:update", {
            detail: {
              entityType: "container",
              entityId: this.currentEdit.entityId,
              fieldName: "name_text",
              newValue: newText,
              oldValue: oldText,
              allData: fullEntityData,
            },
          })
        );

      } else if (this.currentEdit.entityType === "sequence") {
        // Update local data store
        window.WorkflowArchitectDataStore.updateEntity("sequence", this.currentEdit.entityId, {
          label: newText
        });
        
        // Get full entity data for Bubble update
        const fullEntityData = window.WorkflowArchitectDataStore.getEntityForUpdate("sequence", this.currentEdit.entityId);
        if (fullEntityData) {
          fullEntityData.label_text = newText;
        }

        // Dispatch custom event following storymap pattern
        document.dispatchEvent(
          new CustomEvent("workflow-architect:update", {
            detail: {
              entityType: "sequence",
              entityId: this.currentEdit.entityId,
              fieldName: "label_text",
              newValue: newText,
              oldValue: oldText,
              allData: fullEntityData,
            },
          })
        );
      }

      // Trigger immediate re-render following storymap pattern
      this.triggerRerender();
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

  // Add re-render trigger method following storymap pattern
  triggerRerender() {
    // Find the main container and trigger re-render
    const container = document.getElementById("sequence-diagram-container");
    if (container && window.SequenceDiagramRenderer) {
      console.log("INLINE EDIT: Triggering re-render after edit");
      
      // Get fresh data from data store
      const containers = window.WorkflowArchitectDataStore.getContainersArray();
      const sequences = window.WorkflowArchitectDataStore.getSequencesArray();
      const workflows = window.WorkflowArchitectDataStore.getWorkflowsArray();
      const subgroups = window.WorkflowArchitectDataStore.getSubgroupsArray();
      
      const freshData = {
        containers,
        sequences,
        workflows,
        subgroups
      };
      
      // Clear and re-render
      container.innerHTML = "";
      window.SequenceDiagramRenderer.render(freshData, container);
    }
  },
};

console.log("WorkflowArchitectInlineEdit module loaded");
