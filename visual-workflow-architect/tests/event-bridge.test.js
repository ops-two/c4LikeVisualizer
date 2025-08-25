// Visual Workflow Architect - Event Bridge Tests
// Comprehensive testing for event-bridge.js functionality

// Mock Bubble instance for testing
const mockBubbleInstance = {
  customStates: {},
  triggeredEvents: [],
  
  setCustomState: function(stateName, value) {
    this.customStates[stateName] = value;
    console.log(`Mock Bubble: Set custom state ${stateName}:`, value);
  },
  
  triggerEvent: function(eventName) {
    this.triggeredEvents.push({
      eventName: eventName,
      timestamp: Date.now(),
      customState: this.customStates['pending_update']
    });
    console.log(`Mock Bubble: Triggered event ${eventName}`);
  },
  
  // Helper methods for testing
  getLastEvent: function() {
    return this.triggeredEvents[this.triggeredEvents.length - 1];
  },
  
  getEventsByName: function(eventName) {
    return this.triggeredEvents.filter(event => event.eventName === eventName);
  },
  
  clearHistory: function() {
    this.customStates = {};
    this.triggeredEvents = [];
  }
};

// Test runner function
function runEventBridgeTests() {
  console.log('🧪 Starting Event Bridge Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Helper function to run individual tests
  function test(testName, testFunction) {
    try {
      console.log(`🔍 Testing: ${testName}`);
      testFunction();
      console.log(`✅ PASSED: ${testName}\n`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ FAILED: ${testName}`);
      console.error(`   Error: ${error.message}\n`);
      testsFailed++;
    }
  }

  // Helper function for assertions
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // Helper function to wait for debounce
  function waitForDebounce() {
    return new Promise(resolve => setTimeout(resolve, 350)); // Slightly longer than debounce delay
  }

  // Setup: Initialize data store with mock data first
  window.WorkflowArchitectDataStore.init(mockBubbleData);
  mockBubbleInstance.clearHistory();

  // Test 1: Event Bridge Initialization
  test('Event bridge initialization', () => {
    const result = window.WorkflowArchitectEventBridge.init(mockBubbleInstance);
    assert(result === true, 'Initialization should return true');
    
    const status = window.WorkflowArchitectEventBridge.getStatus();
    assert(status.isInitialized === true, 'Should be marked as initialized');
    assert(status.isProcessing === false, 'Should not be processing initially');
    assert(status.pendingUpdates === 0, 'Should have no pending updates initially');
  });

  // Test 2: Container Update
  test('Container update handling', () => {
    mockBubbleInstance.clearHistory();
    
    const result = window.WorkflowArchitectEventBridge.handleContainerUpdate('container_001', {
      name: 'Updated Client App',
      colorHex: '#ff0000'
    });
    
    assert(result === true, 'Container update should succeed');
    
    // Check local data store was updated
    const updatedContainer = window.WorkflowArchitectDataStore.getContainer('container_001');
    assert(updatedContainer.name === 'Updated Client App', 'Container name should be updated locally');
    assert(updatedContainer.colorHex === '#ff0000', 'Container color should be updated locally');
    
    // Check that update is pending (debounced)
    const status = window.WorkflowArchitectEventBridge.getStatus();
    assert(status.pendingUpdates > 0, 'Should have pending updates');
  });

  // Test 3: Sequence Update
  test('Sequence update handling', () => {
    mockBubbleInstance.clearHistory();
    
    const result = window.WorkflowArchitectEventBridge.handleSequenceUpdate('sequence_001', {
      label: 'Updated sequence label',
      isDashed: true
    });
    
    assert(result === true, 'Sequence update should succeed');
    
    // Check local data store was updated
    const updatedSequence = window.WorkflowArchitectDataStore.getSequence('sequence_001');
    assert(updatedSequence.label === 'Updated sequence label', 'Sequence label should be updated locally');
    assert(updatedSequence.isDashed === true, 'Sequence dashed property should be updated locally');
  });

  // Test 4: Workflow Update
  test('Workflow update handling', () => {
    mockBubbleInstance.clearHistory();
    
    const result = window.WorkflowArchitectEventBridge.handleWorkflowUpdate('workflow_001', {
      name: 'Updated Login Process',
      colorHex: '#purple'
    });
    
    assert(result === true, 'Workflow update should succeed');
    
    // Check local data store was updated
    const updatedWorkflow = window.WorkflowArchitectDataStore.getWorkflow('workflow_001');
    assert(updatedWorkflow.name === 'Updated Login Process', 'Workflow name should be updated locally');
    assert(updatedWorkflow.colorHex === '#purple', 'Workflow color should be updated locally');
  });

  // Test 5: Entity Addition
  test('Entity addition handling', () => {
    mockBubbleInstance.clearHistory();
    
    const newContainerData = {
      name_text: 'New Test Container',
      type_text: 'Component',
      feature_id: 'feature_123',
      color_hex_text: '#green',
      order_index_number: 10
    };
    
    const tempId = window.WorkflowArchitectEventBridge.handleEntityAdd('container', newContainerData);
    assert(tempId !== false, 'Entity addition should return temporary ID');
    assert(typeof tempId === 'string', 'Temporary ID should be a string');
    
    // Check local data store has the new entity
    const newContainer = window.WorkflowArchitectDataStore.getContainer(tempId);
    assert(newContainer !== null, 'New container should exist in data store');
    assert(newContainer.name === 'New Test Container', 'New container name should match');
    
    // Check Bubble event was triggered
    const addEvents = mockBubbleInstance.getEventsByName('container_added');
    assert(addEvents.length === 1, 'Should have triggered container_added event');
    
    const eventData = JSON.parse(addEvents[0].customState);
    assert(eventData.isNew === true, 'Event data should mark entity as new');
    assert(eventData.tempId === tempId, 'Event data should include temporary ID');
  });

  // Test 6: Entity Deletion
  test('Entity deletion handling', () => {
    mockBubbleInstance.clearHistory();
    
    const result = window.WorkflowArchitectEventBridge.handleEntityDelete('container', 'container_003');
    assert(result === true, 'Entity deletion should succeed');
    
    // Check local data store removed the entity
    const deletedContainer = window.WorkflowArchitectDataStore.getContainer('container_003');
    assert(deletedContainer === null, 'Container should be removed from data store');
    
    // Check Bubble event was triggered
    const deleteEvents = mockBubbleInstance.getEventsByName('container_deleted');
    assert(deleteEvents.length === 1, 'Should have triggered container_deleted event');
    
    const eventData = JSON.parse(deleteEvents[0].customState);
    assert(eventData.entityId === 'container_003', 'Event data should include entity ID');
  });

  // Test 7: Reordering
  test('Entity reordering handling', () => {
    mockBubbleInstance.clearHistory();
    
    const result = window.WorkflowArchitectEventBridge.handleReorder('sequence', 'sequence_001', 5.5);
    assert(result === true, 'Reordering should succeed');
    
    // Check local data store was updated
    const reorderedSequence = window.WorkflowArchitectDataStore.getSequence('sequence_001');
    assert(reorderedSequence.orderIndex === 5.5, 'Sequence order index should be updated');
    
    // Check Bubble event was triggered
    const reorderEvents = mockBubbleInstance.getEventsByName('sequence_reordered');
    assert(reorderEvents.length === 1, 'Should have triggered sequence_reordered event');
  });

  // Test 8: Order Index Calculation
  test('Order index calculation', () => {
    const entities = [
      { orderIndex: 1.0 },
      { orderIndex: 2.0 },
      { orderIndex: 3.0 }
    ];
    
    // Insert at beginning
    const beginIndex = window.WorkflowArchitectEventBridge.calculateOrderIndex('test', 0, entities);
    assert(beginIndex === 0.0, 'Should calculate index before first entity');
    
    // Insert at end
    const endIndex = window.WorkflowArchitectEventBridge.calculateOrderIndex('test', 5, entities);
    assert(endIndex === 4.0, 'Should calculate index after last entity');
    
    // Insert between entities
    const middleIndex = window.WorkflowArchitectEventBridge.calculateOrderIndex('test', 2, entities);
    assert(middleIndex === 2.5, 'Should calculate index between entities');
    
    // Empty array
    const emptyIndex = window.WorkflowArchitectEventBridge.calculateOrderIndex('test', 0, []);
    assert(emptyIndex === 1.0, 'Should return 1.0 for empty array');
  });

  // Test 9: Debouncing (async test)
  test('Debouncing functionality', async () => {
    mockBubbleInstance.clearHistory();
    
    // Make multiple rapid updates
    window.WorkflowArchitectEventBridge.handleContainerUpdate('container_001', { name: 'Update 1' });
    window.WorkflowArchitectEventBridge.handleContainerUpdate('container_001', { name: 'Update 2' });
    window.WorkflowArchitectEventBridge.handleContainerUpdate('container_001', { name: 'Update 3' });
    
    // Should have pending updates but no Bubble events yet
    const statusBefore = window.WorkflowArchitectEventBridge.getStatus();
    assert(statusBefore.pendingUpdates > 0, 'Should have pending updates');
    assert(mockBubbleInstance.triggeredEvents.length === 0, 'Should not have triggered events yet');
    
    // Wait for debounce to complete
    await waitForDebounce();
    
    // Should have processed updates
    const statusAfter = window.WorkflowArchitectEventBridge.getStatus();
    assert(statusAfter.pendingUpdates === 0, 'Should have no pending updates after debounce');
    
    // Should have only one Bubble event (latest update)
    const updateEvents = mockBubbleInstance.getEventsByName('container_updated');
    assert(updateEvents.length === 1, 'Should have only one update event after debouncing');
    
    // Check final state
    const finalContainer = window.WorkflowArchitectDataStore.getContainer('container_001');
    assert(finalContainer.name === 'Update 3', 'Should have final update value');
  });

  // Test 10: Data Refresh
  test('Data refresh handling', () => {
    const newMockData = {
      feature: {
        feature_id: "feature_456",
        name_text: "Refreshed Feature",
        description_text: "Updated feature data"
      },
      containers: [],
      sequences: [],
      workflows: []
    };
    
    const result = window.WorkflowArchitectEventBridge.handleDataRefresh(newMockData);
    assert(result === true, 'Data refresh should succeed');
    
    // Check data store was updated
    const refreshedFeature = window.WorkflowArchitectDataStore.getFeature();
    assert(refreshedFeature.id === 'feature_456', 'Feature should be updated');
    assert(refreshedFeature.name === 'Refreshed Feature', 'Feature name should be updated');
    
    // Check pending updates were cleared
    const status = window.WorkflowArchitectEventBridge.getStatus();
    assert(status.pendingUpdates === 0, 'Pending updates should be cleared');
  });

  // Test 11: Error Handling
  test('Error handling for invalid operations', () => {
    // Test with invalid entity ID
    const result1 = window.WorkflowArchitectEventBridge.handleContainerUpdate('invalid_id', { name: 'Test' });
    assert(result1 === false, 'Should fail for invalid entity ID');
    
    // Test with invalid entity type
    const result2 = window.WorkflowArchitectEventBridge.handleEntityAdd('invalid_type', {});
    assert(result2 === false, 'Should fail for invalid entity type');
    
    // Test deletion of non-existent entity
    const result3 = window.WorkflowArchitectEventBridge.handleEntityDelete('container', 'non_existent');
    assert(result3 === false, 'Should fail for non-existent entity');
  });

  // Test 12: Status and Flush
  test('Status reporting and manual flush', () => {
    mockBubbleInstance.clearHistory();
    
    // Create some pending updates
    window.WorkflowArchitectEventBridge.handleContainerUpdate('container_001', { name: 'Flush Test' });
    
    const statusBefore = window.WorkflowArchitectEventBridge.getStatus();
    assert(statusBefore.pendingUpdates > 0, 'Should have pending updates');
    assert(statusBefore.debounceActive === true, 'Should have active debounce timer');
    
    // Manual flush
    window.WorkflowArchitectEventBridge.flush();
    
    const statusAfter = window.WorkflowArchitectEventBridge.getStatus();
    assert(statusAfter.pendingUpdates === 0, 'Should have no pending updates after flush');
    assert(statusAfter.debounceActive === false, 'Should have no active debounce timer after flush');
    
    // Check event was sent
    const updateEvents = mockBubbleInstance.getEventsByName('container_updated');
    assert(updateEvents.length === 1, 'Should have sent update event');
  });

  // Test Summary
  console.log('📊 Event Bridge Test Results:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All event bridge tests passed! Ready for Bubble integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
  }
  
  return testsFailed === 0;
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runEventBridgeTests, mockBubbleInstance };
}
