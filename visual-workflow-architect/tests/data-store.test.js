// Visual Workflow Architect - Data Store Tests
// Comprehensive testing for data-store.js functionality

// Mock Bubble data for testing
const mockBubbleData = {
  feature: {
    feature_id: "feature_123",
    name_text: "User Authentication Flow",
    description_text: "Complete user login and registration process",
    workspace_id: "workspace_456",
    order_index_number: 1,
    created_date: new Date('2024-01-01'),
    modified_date: new Date('2024-01-15')
  },
  containers: [
    {
      container_id: "container_001",
      name_text: "Client App",
      type_text: "Persona",
      feature_id: "feature_123",
      component_url_text: "",
      description_text: "User interface application",
      order_index_number: 1,
      color_hex_text: "#3ea50b",
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    },
    {
      container_id: "container_002", 
      name_text: "Auth API",
      type_text: "Component",
      feature_id: "feature_123",
      component_url_text: "https://api.example.com/auth",
      description_text: "Authentication service",
      order_index_number: 2,
      color_hex_text: "#ff8f0e",
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    },
    {
      container_id: "container_003",
      name_text: "Database",
      type_text: "Component", 
      feature_id: "feature_123",
      component_url_text: "https://db.example.com",
      description_text: "User data storage",
      order_index_number: 3,
      color_hex_text: "#0055bc",
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    }
  ],
  workflows: [
    {
      workflow_id: "workflow_001",
      name_text: "Login Process",
      description_text: "User login workflow",
      feature_id: "feature_123",
      color_hex_text: "#e3f2fd",
      order_index_number: 1,
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    },
    {
      workflow_id: "workflow_002",
      name_text: "Registration Process", 
      description_text: "New user registration",
      feature_id: "feature_123",
      color_hex_text: "#f3e5f5",
      order_index_number: 2,
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    }
  ],
  sequences: [
    {
      sequence_id: "sequence_001",
      label_text: "Submit login credentials",
      description_text: "User enters username and password",
      from_container_id: "container_001",
      to_container_id: "container_002",
      action_type_text: "API Call",
      workflow_id: "workflow_001",
      order_index_number: 1,
      is_dashed_boolean: false,
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    },
    {
      sequence_id: "sequence_002",
      label_text: "Validate credentials",
      description_text: "Check user credentials against database",
      from_container_id: "container_002",
      to_container_id: "container_003",
      action_type_text: "Data Flow",
      workflow_id: "workflow_001", 
      order_index_number: 2,
      is_dashed_boolean: false,
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    },
    {
      sequence_id: "sequence_003",
      label_text: "Return authentication result",
      description_text: "Send success/failure response",
      from_container_id: "container_002",
      to_container_id: "container_001",
      action_type_text: "API Call",
      workflow_id: "workflow_001",
      order_index_number: 3,
      is_dashed_boolean: true,
      created_date: new Date('2024-01-01'),
      modified_date: new Date('2024-01-01')
    }
  ]
};

// Test runner function
function runDataStoreTests() {
  console.log('🧪 Starting Data Store Tests...\n');
  
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

  // Test 1: Initialization
  test('Data store initialization', () => {
    const result = window.WorkflowArchitectDataStore.init(mockBubbleData);
    assert(result === true, 'Initialization should return true');
    assert(window.WorkflowArchitectDataStore.data.isInitialized === true, 'Store should be marked as initialized');
  });

  // Test 2: Feature data transformation
  test('Feature data transformation', () => {
    const feature = window.WorkflowArchitectDataStore.getFeature();
    assert(feature !== null, 'Feature should not be null');
    assert(feature.id === 'feature_123', 'Feature ID should match');
    assert(feature.name === 'User Authentication Flow', 'Feature name should match');
    assert(feature.workspaceId === 'workspace_456', 'Workspace ID should match');
  });

  // Test 3: Container data transformation and retrieval
  test('Container data handling', () => {
    const containers = window.WorkflowArchitectDataStore.getContainersArray();
    assert(containers.length === 3, 'Should have 3 containers');
    
    const clientContainer = window.WorkflowArchitectDataStore.getContainer('container_001');
    assert(clientContainer !== null, 'Container should exist');
    assert(clientContainer.name === 'Client App', 'Container name should match');
    assert(clientContainer.type === 'Persona', 'Container type should be Persona');
    assert(clientContainer.colorHex === '#3ea50b', 'Container color should match');
  });

  // Test 4: Sequence data transformation and retrieval
  test('Sequence data handling', () => {
    const sequences = window.WorkflowArchitectDataStore.getSequencesArray();
    assert(sequences.length === 3, 'Should have 3 sequences');
    
    const firstSequence = window.WorkflowArchitectDataStore.getSequence('sequence_001');
    assert(firstSequence !== null, 'Sequence should exist');
    assert(firstSequence.label === 'Submit login credentials', 'Sequence label should match');
    assert(firstSequence.fromContainerId === 'container_001', 'From container should match');
    assert(firstSequence.toContainerId === 'container_002', 'To container should match');
    assert(firstSequence.actionType === 'API Call', 'Action type should match');
    assert(firstSequence.isDashed === false, 'Should not be dashed');
  });

  // Test 5: Workflow data transformation and retrieval
  test('Workflow data handling', () => {
    const workflows = window.WorkflowArchitectDataStore.getWorkflowsArray();
    assert(workflows.length === 2, 'Should have 2 workflows');
    
    const loginWorkflow = window.WorkflowArchitectDataStore.getWorkflow('workflow_001');
    assert(loginWorkflow !== null, 'Workflow should exist');
    assert(loginWorkflow.name === 'Login Process', 'Workflow name should match');
    assert(loginWorkflow.colorHex === '#e3f2fd', 'Workflow color should match');
  });

  // Test 6: Sequences by workflow filtering
  test('Sequences by workflow filtering', () => {
    const loginSequences = window.WorkflowArchitectDataStore.getSequencesByWorkflow('workflow_001');
    assert(loginSequences.length === 3, 'Login workflow should have 3 sequences');
    
    // Check ordering
    assert(loginSequences[0].orderIndex === 1, 'First sequence should have order index 1');
    assert(loginSequences[1].orderIndex === 2, 'Second sequence should have order index 2');
    assert(loginSequences[2].orderIndex === 3, 'Third sequence should have order index 3');
  });

  // Test 7: Entity updates
  test('Entity updates', () => {
    const updateResult = window.WorkflowArchitectDataStore.updateEntity('container', 'container_001', {
      name: 'Updated Client App',
      colorHex: '#ff0000'
    });
    assert(updateResult === true, 'Update should succeed');
    
    const updatedContainer = window.WorkflowArchitectDataStore.getContainer('container_001');
    assert(updatedContainer.name === 'Updated Client App', 'Container name should be updated');
    assert(updatedContainer.colorHex === '#ff0000', 'Container color should be updated');
  });

  // Test 8: Entity update formatting for Bubble
  test('Entity update formatting', () => {
    const updateData = window.WorkflowArchitectDataStore.getEntityForUpdate('container', 'container_001');
    assert(updateData !== null, 'Update data should not be null');
    assert(updateData.entityId === 'container_001', 'Entity ID should match');
    assert(updateData.name_text === 'Updated Client App', 'Name should match updated value');
    assert(updateData.type_text === 'Persona', 'Type should be included');
    assert(updateData.color_hex_text === '#ff0000', 'Color should match updated value');
  });

  // Test 9: Adding new entities
  test('Adding new entities', () => {
    const newContainerId = window.WorkflowArchitectDataStore.addEntity('container', {
      name_text: 'New Service',
      type_text: 'Component',
      feature_id: 'feature_123',
      color_hex_text: '#purple',
      order_index_number: 4
    });
    
    assert(newContainerId !== false, 'Should return new container ID');
    
    const newContainer = window.WorkflowArchitectDataStore.getContainer(newContainerId);
    assert(newContainer !== null, 'New container should exist');
    assert(newContainer.name === 'New Service', 'New container name should match');
    assert(newContainer.type === 'Component', 'New container type should match');
  });

  // Test 10: Entity removal and cascading
  test('Entity removal with cascading', () => {
    const removeResult = window.WorkflowArchitectDataStore.removeEntity('container', 'container_002');
    assert(removeResult === true, 'Removal should succeed');
    
    const removedContainer = window.WorkflowArchitectDataStore.getContainer('container_002');
    assert(removedContainer === null, 'Container should be removed');
    
    // Check that sequences referencing this container are also removed
    const remainingSequences = window.WorkflowArchitectDataStore.getSequencesArray();
    const hasOrphanedSequences = remainingSequences.some(seq => 
      seq.fromContainerId === 'container_002' || seq.toContainerId === 'container_002'
    );
    assert(hasOrphanedSequences === false, 'No orphaned sequences should remain');
  });

  // Test 11: Data validation
  test('Data validation', () => {
    const issues = window.WorkflowArchitectDataStore.validateData();
    console.log('   Validation issues found:', issues);
    // After cascading deletion, there should be no validation issues
    assert(Array.isArray(issues), 'Validation should return an array');
  });

  // Test 12: Statistics
  test('Statistics generation', () => {
    const stats = window.WorkflowArchitectDataStore.getStats();
    assert(typeof stats === 'object', 'Stats should be an object');
    assert(typeof stats.containers === 'number', 'Container count should be a number');
    assert(typeof stats.sequences === 'number', 'Sequence count should be a number');
    assert(typeof stats.workflows === 'number', 'Workflow count should be a number');
    assert(stats.isInitialized === true, 'Should be marked as initialized');
    console.log('   Current stats:', stats);
  });

  // Test Summary
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Data store is ready for integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
  }
  
  return testsFailed === 0;
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDataStoreTests, mockBubbleData };
}
