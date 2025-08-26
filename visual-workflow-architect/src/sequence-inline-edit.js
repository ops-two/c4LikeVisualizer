// Visual Workflow Architect - Sequence Inline Edit System
// Handles double-click inline editing for container names and sequence labels
// Based on proven storymap-grid inline editing patterns

console.log('DEBUG: sequence-inline-edit.js script is loading...');

window.SequenceDiagramInlineEdit = {
  currentEdit: null,
  isInitialized: false,

  // Initialize the inline edit system
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('SequenceDiagramInlineEdit: Initializing inline edit system');
    this.setupEventListeners();
    console.log('SequenceDiagramInlineEdit: Initialization complete');
  },

  // Set up double-click event listeners for editable elements
  setupEventListeners() {
    // Use event delegation to handle dynamically created elements
    document.addEventListener('dblclick', (e) => {
      // Check if double-click is on a container name
      if (e.target.classList.contains('container-name')) {
        e.preventDefault();
        e.stopPropagation();
        this.startContainerEdit(e.target);
        return;
      }
      
      // Check if double-click is on a sequence label
      if (e.target.classList.contains('sequence-label')) {
        e.preventDefault();
        e.stopPropagation();
        this.startSequenceEdit(e.target);
        return;
      }
    });

    // Handle clicks outside to save edits
    document.addEventListener('click', (e) => {
      if (this.currentEdit && !this.currentEdit.input.contains(e.target)) {
        this.saveEdit();
      }
    });

    console.log('SequenceDiagramInlineEdit: Event listeners registered');
  },

  // Start editing a container name
  startContainerEdit(element) {
    if (this.currentEdit) {
      this.cancelEdit();
    }

    const containerId = element.dataset.containerId;
    if (!containerId) {
      console.error('SequenceDiagramInlineEdit: Container element missing data-container-id');
      return;
    }

    console.log('SequenceDiagramInlineEdit: Starting container edit for ID:', containerId);
    
    const currentText = element.textContent.trim();
    this.createEditInput(element, currentText, 'container', containerId);
  },

  // Start editing a sequence label
  startSequenceEdit(element) {
    if (this.currentEdit) {
      this.cancelEdit();
    }

    const sequenceId = element.dataset.sequenceId;
    if (!sequenceId) {
      console.error('SequenceDiagramInlineEdit: Sequence element missing data-sequence-id');
      return;
    }

    console.log('SequenceDiagramInlineEdit: Starting sequence edit for ID:', sequenceId);
    
    const currentText = element.textContent.trim();
    this.createEditInput(element, currentText, 'sequence', sequenceId);
  },

  // Create the input overlay for editing
  createEditInput(element, currentText, entityType, entityId) {
    // Store original element and text
    this.currentEdit = {
      element: element,
      originalText: currentText,
      entityType: entityType,
      entityId: entityId,
      input: null
    };

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'sequence-inline-edit-input';
    
    // Style the input to match the original element
    const elementStyles = window.getComputedStyle(element);
    input.style.position = 'absolute';
    input.style.left = element.offsetLeft + 'px';
    input.style.top = element.offsetTop + 'px';
    input.style.width = Math.max(element.offsetWidth, 100) + 'px';
    input.style.height = element.offsetHeight + 'px';
    input.style.fontSize = elementStyles.fontSize;
    input.style.fontFamily = elementStyles.fontFamily;
    input.style.fontWeight = elementStyles.fontWeight;
    input.style.color = elementStyles.color;
    input.style.backgroundColor = '#ffffff';
    input.style.border = '2px solid #1976d2';
    input.style.borderRadius = '4px';
    input.style.padding = '4px 8px';
    input.style.zIndex = '1000';
    input.style.outline = 'none';
    input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    // Add event listeners for input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      // Small delay to allow click events to process first
      setTimeout(() => {
        if (this.currentEdit) {
          this.saveEdit();
        }
      }, 100);
    });

    // Hide original element and show input
    element.style.visibility = 'hidden';
    element.parentNode.appendChild(input);
    this.currentEdit.input = input;

    // Focus and select text
    input.focus();
    input.select();
  },

  // Save the current edit
  saveEdit() {
    if (!this.currentEdit) return;

    const newText = this.currentEdit.input.value.trim();
    const oldText = this.currentEdit.originalText;

    console.log('SequenceDiagramInlineEdit: Saving edit:', {
      entityType: this.currentEdit.entityType,
      entityId: this.currentEdit.entityId,
      oldText: oldText,
      newText: newText
    });

    // Only proceed if text actually changed
    if (newText !== oldText && newText.length > 0) {
      // Update the original element
      this.currentEdit.element.textContent = newText;
      
      // Dispatch the appropriate update event
      if (this.currentEdit.entityType === 'container') {
        this.dispatchContainerUpdate(this.currentEdit.entityId, newText, oldText);
      } else if (this.currentEdit.entityType === 'sequence') {
        this.dispatchSequenceUpdate(this.currentEdit.entityId, newText, oldText);
      }
    }

    this.cleanupEdit();
  },

  // Cancel the current edit
  cancelEdit() {
    if (!this.currentEdit) return;

    console.log('SequenceDiagramInlineEdit: Canceling edit');
    this.cleanupEdit();
  },

  // Clean up the edit interface
  cleanupEdit() {
    if (!this.currentEdit) return;

    // Restore original element visibility
    this.currentEdit.element.style.visibility = 'visible';
    
    // Remove input element
    if (this.currentEdit.input && this.currentEdit.input.parentNode) {
      this.currentEdit.input.parentNode.removeChild(this.currentEdit.input);
    }

    // Clear current edit state
    this.currentEdit = null;
  },

  // Dispatch container update event
  dispatchContainerUpdate(containerId, newName, oldName) {
    console.log('SequenceDiagramInlineEdit: Dispatching container update event');
    
    // Use the event bridge utility function if available
    if (window.SequenceDiagramEventBridge && window.SequenceDiagramEventBridge.dispatchContainerUpdate) {
      window.SequenceDiagramEventBridge.dispatchContainerUpdate(containerId, newName, oldName);
    } else {
      // Fallback to direct event dispatch
      const event = new CustomEvent('sequence:container_updated', {
        detail: {
          containerId: containerId,
          newName: newName,
          oldName: oldName
        }
      });
      document.dispatchEvent(event);
    }
  },

  // Dispatch sequence update event
  dispatchSequenceUpdate(sequenceId, newLabel, oldLabel) {
    console.log('SequenceDiagramInlineEdit: Dispatching sequence update event');
    
    // Use the event bridge utility function if available
    if (window.SequenceDiagramEventBridge && window.SequenceDiagramEventBridge.dispatchSequenceUpdate) {
      window.SequenceDiagramEventBridge.dispatchSequenceUpdate(sequenceId, newLabel, oldLabel);
    } else {
      // Fallback to direct event dispatch
      const event = new CustomEvent('sequence:sequence_updated', {
        detail: {
          sequenceId: sequenceId,
          newLabel: newLabel,
          oldLabel: oldLabel
        }
      });
      document.dispatchEvent(event);
    }
  },

  // Utility function to make any element editable
  makeElementEditable(element, entityType, entityId) {
    element.classList.add(entityType === 'container' ? 'container-name' : 'sequence-label');
    element.dataset[entityType + 'Id'] = entityId;
    element.style.cursor = 'pointer';
    element.title = `Double-click to edit ${entityType}`;
  }
};

console.log('DEBUG: sequence-inline-edit.js script loaded successfully. SequenceDiagramInlineEdit object created:', typeof window.SequenceDiagramInlineEdit);
