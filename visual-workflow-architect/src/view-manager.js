// Visual Workflow Architect - View Manager
// Handles switching between sequence, container, and context views

console.log('DEBUG: view-manager.js script is loading...');

window.WorkflowArchitectViewManager = {
  currentView: 'sequence',
  isInitialized: false,
  containerId: null,
  bubbleData: null,

  // Initialize the view manager
  init(containerId, bubbleData) {
    if (this.isInitialized) return;
    
    this.containerId = containerId;
    this.bubbleData = bubbleData;
    this.isInitialized = true;
    
    console.log('WorkflowArchitectViewManager: Initializing view manager');
    this.setupViewSwitcher();
    console.log('WorkflowArchitectViewManager: Initialization complete');
  },

  // Setup view switcher UI
  setupViewSwitcher() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('WorkflowArchitectViewManager: Container not found');
      return;
    }

    // Create view switcher toolbar
    const viewSwitcher = document.createElement('div');
    viewSwitcher.className = 'view-switcher-toolbar';
    viewSwitcher.innerHTML = `
      <div class="view-switcher-buttons">
        <button class="view-btn active" data-view="sequence">
          📊 Sequence View
        </button>
        <button class="view-btn" data-view="container">
          🏗️ Container View
        </button>
        <button class="view-btn" data-view="context">
          🌐 Context View
        </button>
      </div>
      <div class="view-description">
        <span id="view-description-text">Interactive sequence diagram with editable flows</span>
      </div>
    `;

    // Add event listeners
    viewSwitcher.addEventListener('click', (e) => {
      if (e.target.classList.contains('view-btn')) {
        const newView = e.target.dataset.view;
        this.switchView(newView);
      }
    });

    // Insert at the top of container
    container.insertBefore(viewSwitcher, container.firstChild);

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.id = 'view-content-area';
    contentArea.className = 'view-content-area';
    container.appendChild(contentArea);
  },

  // Switch to a different view
  switchView(viewType) {
    if (this.currentView === viewType) return;

    console.log(`WorkflowArchitectViewManager: Switching from ${this.currentView} to ${viewType}`);
    
    this.currentView = viewType;
    this.updateViewButtons();
    this.updateViewDescription();
    this.renderCurrentView();
  },

  // Update view button states
  updateViewButtons() {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.currentView);
    });
  },

  // Update view description
  updateViewDescription() {
    const descriptions = {
      sequence: 'Interactive sequence diagram with editable flows',
      container: 'Hub-and-spoke view showing container relationships',
      context: 'High-level workspace overview with all features'
    };

    const descElement = document.getElementById('view-description-text');
    if (descElement) {
      descElement.textContent = descriptions[this.currentView];
    }
  },

  // Render the current view
  renderCurrentView() {
    const contentArea = document.getElementById('view-content-area');
    if (!contentArea) return;

    // Clear existing content
    contentArea.innerHTML = '';

    switch (this.currentView) {
      case 'sequence':
        this.renderSequenceView(contentArea);
        break;
      case 'container':
        this.renderContainerView(contentArea);
        break;
      case 'context':
        this.renderContextView(contentArea);
        break;
    }
  },

  // Render sequence view (React Flow)
  renderSequenceView(container) {
    console.log('WorkflowArchitectViewManager: Rendering sequence view');
    
    // Create React Flow container
    const flowContainer = document.createElement('div');
    flowContainer.id = 'react-flow-container';
    flowContainer.style.cssText = 'width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 8px;';
    container.appendChild(flowContainer);

    // Initialize React Flow renderer
    if (window.WorkflowArchitectRenderer) {
      window.WorkflowArchitectRenderer.init('react-flow-container');
      window.WorkflowArchitectRenderer.render(this.bubbleData, container);
    } else {
      flowContainer.innerHTML = '<div style="padding: 20px; text-align: center;">React Flow renderer not available</div>';
    }
  },

  // Render container view (hub-and-spoke)
  renderContainerView(container) {
    console.log('WorkflowArchitectViewManager: Rendering container view');
    
    const containers = this.bubbleData?.containers || [];
    const sequences = this.bubbleData?.sequences || [];

    // Create hub-and-spoke visualization
    const hubContainer = document.createElement('div');
    hubContainer.className = 'hub-spoke-container';
    hubContainer.style.cssText = `
      width: 100%; 
      height: 500px; 
      position: relative; 
      border: 1px solid #ddd; 
      border-radius: 8px;
      background: #f8f9fa;
      overflow: hidden;
    `;

    // Calculate positions for containers in a circle
    const centerX = 250;
    const centerY = 250;
    const radius = 180;

    containers.forEach((containerData, index) => {
      const angle = (index / containers.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const containerElement = document.createElement('div');
      containerElement.className = 'hub-container';
      containerElement.style.cssText = `
        position: absolute;
        left: ${x - 60}px;
        top: ${y - 30}px;
        width: 120px;
        height: 60px;
        background: ${containerData.color_hex_text || '#3ea50b'};
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
      `;
      containerElement.textContent = containerData.name_text;
      containerElement.title = `${containerData.type_text}: ${containerData.name_text}`;

      // Add click handler to switch back to sequence view
      containerElement.addEventListener('click', () => {
        this.switchView('sequence');
      });

      hubContainer.appendChild(containerElement);

      // Draw connections to center
      const connectionCount = sequences.filter(seq => 
        seq.from_container_id === containerData.container_id || 
        seq.to_container_id === containerData.container_id
      ).length;

      if (connectionCount > 0) {
        const line = document.createElement('div');
        line.className = 'hub-connection';
        line.style.cssText = `
          position: absolute;
          left: ${centerX}px;
          top: ${centerY}px;
          width: ${radius}px;
          height: 2px;
          background: #666;
          transform-origin: 0 50%;
          transform: rotate(${angle}rad);
          opacity: 0.3;
        `;
        hubContainer.appendChild(line);
      }
    });

    // Add center hub
    const centerHub = document.createElement('div');
    centerHub.className = 'center-hub';
    centerHub.style.cssText = `
      position: absolute;
      left: ${centerX - 40}px;
      top: ${centerY - 40}px;
      width: 80px;
      height: 80px;
      background: #1976d2;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    centerHub.textContent = this.bubbleData?.feature?.name_text || 'Feature';
    hubContainer.appendChild(centerHub);

    container.appendChild(hubContainer);

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'hub-legend';
    legend.style.cssText = 'margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;';
    legend.innerHTML = `
      <h4>Container View</h4>
      <p>This hub-and-spoke diagram shows all containers connected to the central feature.</p>
      <p><strong>Click any container</strong> to return to sequence view for detailed editing.</p>
    `;
    container.appendChild(legend);
  },

  // Render context view (workspace overview)
  renderContextView(container) {
    console.log('WorkflowArchitectViewManager: Rendering context view');
    
    const contextContainer = document.createElement('div');
    contextContainer.className = 'context-view-container';
    contextContainer.style.cssText = `
      width: 100%; 
      min-height: 500px; 
      border: 1px solid #ddd; 
      border-radius: 8px;
      background: #f8f9fa;
      padding: 20px;
    `;

    // Feature overview
    const featureSection = document.createElement('div');
    featureSection.className = 'context-feature-section';
    featureSection.innerHTML = `
      <h3>📋 Feature Overview</h3>
      <div class="feature-card" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4>${this.bubbleData?.feature?.name_text || 'Untitled Feature'}</h4>
        <p><strong>Containers:</strong> ${this.bubbleData?.containers?.length || 0}</p>
        <p><strong>Sequences:</strong> ${this.bubbleData?.sequences?.length || 0}</p>
      </div>
    `;

    // Container summary
    const containerSection = document.createElement('div');
    containerSection.className = 'context-container-section';
    containerSection.innerHTML = '<h3>🏗️ Containers</h3>';
    
    const containerGrid = document.createElement('div');
    containerGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;';
    
    (this.bubbleData?.containers || []).forEach(container => {
      const containerCard = document.createElement('div');
      containerCard.style.cssText = `
        background: white; 
        padding: 15px; 
        border-radius: 8px; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid ${container.color_hex_text || '#3ea50b'};
        cursor: pointer;
      `;
      containerCard.innerHTML = `
        <h5>${container.name_text}</h5>
        <p><small>${container.type_text}</small></p>
      `;
      
      containerCard.addEventListener('click', () => {
        this.switchView('sequence');
      });
      
      containerGrid.appendChild(containerCard);
    });
    
    containerSection.appendChild(containerGrid);

    // Sequence summary
    const sequenceSection = document.createElement('div');
    sequenceSection.className = 'context-sequence-section';
    sequenceSection.innerHTML = '<h3>🔄 Data Flows</h3>';
    
    const sequenceList = document.createElement('div');
    sequenceList.style.cssText = 'background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
    
    if (this.bubbleData?.sequences?.length > 0) {
      const sequences = this.bubbleData.sequences.map(seq => {
        const fromContainer = this.bubbleData.containers.find(c => c.container_id === seq.from_container_id);
        const toContainer = this.bubbleData.containers.find(c => c.container_id === seq.to_container_id);
        
        return `
          <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>${seq.label_text}</strong><br>
            <small>${fromContainer?.name_text || 'Unknown'} → ${toContainer?.name_text || 'Unknown'}</small>
          </div>
        `;
      }).join('');
      
      sequenceList.innerHTML = sequences;
    } else {
      sequenceList.innerHTML = '<p style="color: #666; font-style: italic;">No sequences defined yet</p>';
    }
    
    sequenceSection.appendChild(sequenceList);

    // Assemble context view
    contextContainer.appendChild(featureSection);
    contextContainer.appendChild(containerSection);
    contextContainer.appendChild(sequenceSection);
    
    // Add navigation hint
    const navigationHint = document.createElement('div');
    navigationHint.style.cssText = 'margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;';
    navigationHint.innerHTML = `
      <p><strong>💡 Navigation Tip:</strong> Click any container card above to jump to sequence view for detailed editing.</p>
    `;
    contextContainer.appendChild(navigationHint);

    container.appendChild(contextContainer);
  },

  // Get current view
  getCurrentView() {
    return this.currentView;
  },

  // Update data and refresh current view
  updateData(newBubbleData) {
    this.bubbleData = newBubbleData;
    this.renderCurrentView();
  }
};

console.log('DEBUG: view-manager.js script loaded successfully. WorkflowArchitectViewManager object created:', typeof window.WorkflowArchitectViewManager);
