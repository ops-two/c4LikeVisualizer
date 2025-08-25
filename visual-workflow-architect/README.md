# Visual Workflow Architect - Bubble Plugin

A React Flow-based Bubble plugin for creating interactive, hierarchical workflow diagrams inspired by C4 architecture and Stripe sequence diagrams.

## Project Structure

```
visual-workflow-architect/
├── src/
│   ├── data-store.js           # Centralized state management
│   ├── event-bridge.js         # Bubble communication layer
│   ├── view-manager.js         # View switching logic
│   ├── sequence-renderer.js    # Main editable diagram
│   ├── container-generator.js  # Hub-and-spoke view
│   └── context-generator.js    # Workspace overview
├── components/
│   ├── ContainerNode.js        # Custom React Flow node
│   ├── SequenceEdge.js         # Custom React Flow edge
│   └── WorkflowGroup.js        # Workflow background
├── styles/
│   ├── main.css               # Core plugin styles
│   ├── nodes.css              # Node-specific styling
│   └── edges.css              # Edge-specific styling
├── tests/
│   ├── data-store.test.js     # Unit tests for data layer
│   ├── event-bridge.test.js   # Communication layer tests
│   └── integration.test.js    # Full plugin tests
└── plugin-files/
    ├── headers.txt            # CDN dependencies
    └── update.txt             # Bubble plugin controller
```

## Development Phases

- **Phase 1**: Foundation & Core Architecture (Weeks 1-2)
- **Phase 2**: React Flow Integration (Weeks 3-4)
- **Phase 3**: Auto-Generated Views (Weeks 5-6)
- **Phase 4**: Advanced Features (Weeks 7-8)
- **Phase 5**: Polish & Optimization (Weeks 9-10)

## Testing Strategy

Each component will be tested individually before integration:
1. Unit tests for core functions
2. Mock Bubble data testing
3. Integration testing with Bubble workflows
4. End-to-end user workflow testing

## Getting Started

1. Set up development environment
2. Create Bubble test app with required data types
3. Implement and test each module step-by-step
4. Deploy to CDN and test in Bubble plugin environment
