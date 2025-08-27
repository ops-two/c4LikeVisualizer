# Visual Workflow Architect - Testing Guide

## Overview
This document provides comprehensive testing procedures for the Visual Workflow Architect Bubble plugin, covering integration testing, functionality verification, and troubleshooting.

## Pre-Testing Setup

### 1. Bubble Database Schema
Ensure your Bubble app has the following data types:

**Feature**
- `name_text` (text)
- `_id` (unique id)

**Container** 
- `name_text` (text)
- `type_text` (text) - "Component" or "Persona"
- `color_hex` (text) - hex color code
- `order_index` (number)
- `feature_id` (text) - reference to Feature
- `_id` (unique id)

**Sequence**
- `label_text` (text)
- `FromContainer` (Container reference)
- `ToContainer` (Container reference)
- `is_dashed` (yes/no)
- `color_hex` (text)
- `order_index` (number)
- `feature_id` (text) - reference to Feature
- `_id` (unique id)

### 2. Plugin Installation
1. Upload plugin files to Bubble:
   - `headers.txt`
   - `initialize.txt`
   - `update.txt`
2. Configure plugin element properties:
   - `feature` (Feature data type)
   - `containers` (list of Container)
   - `sequences` (list of Sequence)

## Testing Procedures

### Phase 1: Basic Integration Testing

#### Test 1.1: Plugin Loading
**Objective**: Verify all scripts load correctly
**Steps**:
1. Add plugin element to a page
2. Open browser developer console
3. Check for script loading messages
**Expected Results**:
- No 404 errors for script files
- Console shows: "Visual Workflow Architect Update Function"
- All component objects available in `window`

#### Test 1.2: Empty State
**Objective**: Test plugin behavior with no data
**Steps**:
1. Add plugin element without setting feature property
2. Preview page
**Expected Results**:
- Green "Ready" message displayed
- No JavaScript errors
- Instructions to select a feature

#### Test 1.3: Data Loading
**Objective**: Verify data extraction from Bubble
**Steps**:
1. Create test feature with 2-3 containers and sequences
2. Set plugin element properties
3. Preview page and check console
**Expected Results**:
- Console shows feature processing message
- Container and sequence counts match database
- No "not ready" errors

### Phase 2: View Functionality Testing

#### Test 2.1: Sequence View
**Objective**: Test React Flow sequence diagram
**Steps**:
1. Load plugin with test data
2. Verify sequence view is default
3. Check container nodes and sequence edges
**Expected Results**:
- Containers appear as vertical nodes
- Sequences appear as connecting arrows
- Toolbar buttons visible and functional

#### Test 2.2: Container View
**Objective**: Test hub-and-spoke visualization
**Steps**:
1. Click "Container View" button
2. Verify layout and interactions
**Expected Results**:
- Containers arranged in circle around center
- Center shows feature name
- Clicking container returns to sequence view

#### Test 2.3: Context View
**Objective**: Test workspace overview
**Steps**:
1. Click "Context View" button
2. Review feature summary and container cards
**Expected Results**:
- Feature overview with correct counts
- Container cards with proper styling
- Sequence list showing connections

### Phase 3: Interactive Features Testing

#### Test 3.1: Container Management
**Objective**: Test adding/editing containers
**Steps**:
1. Click "Add Container" button
2. Double-click container name to edit
3. Verify changes persist
**Expected Results**:
- New container appears in diagram
- Inline editing works smoothly
- Changes trigger Bubble workflows

#### Test 3.2: Sequence Management
**Objective**: Test adding/editing sequences
**Steps**:
1. Click "Add Sequence" button
2. Connect containers by dragging
3. Edit sequence labels
**Expected Results**:
- New sequences appear as arrows
- Drag connections work
- Label editing functions properly

#### Test 3.3: Drag-and-Drop Reordering
**Objective**: Test container reordering
**Steps**:
1. Drag containers to new positions
2. Verify order updates
**Expected Results**:
- Containers move smoothly
- Order changes trigger events
- Layout updates correctly

### Phase 4: Error Handling Testing

#### Test 4.1: Missing Dependencies
**Objective**: Test graceful degradation
**Steps**:
1. Temporarily block React CDN
2. Reload page
**Expected Results**:
- Clear error message displayed
- No JavaScript crashes
- Helpful troubleshooting info

#### Test 4.2: Invalid Data
**Objective**: Test data validation
**Steps**:
1. Create feature with malformed container data
2. Load plugin
**Expected Results**:
- Plugin handles missing fields gracefully
- Default values applied where appropriate
- Console warnings for data issues

#### Test 4.3: Network Issues
**Objective**: Test offline resilience
**Steps**:
1. Disable network after initial load
2. Test interactions
**Expected Results**:
- Local interactions continue working
- Appropriate error messages for failed saves
- No data corruption

### Phase 5: Performance Testing

#### Test 5.1: Large Datasets
**Objective**: Test with many containers/sequences
**Steps**:
1. Create feature with 20+ containers and 50+ sequences
2. Load plugin and test interactions
**Expected Results**:
- Smooth rendering within 3 seconds
- Responsive interactions
- No memory leaks

#### Test 5.2: Multiple Instances
**Objective**: Test multiple plugin instances
**Steps**:
1. Add 3+ plugin elements to same page
2. Load different features in each
**Expected Results**:
- Each instance operates independently
- No cross-contamination of data
- Consistent performance

## Troubleshooting Guide

### Common Issues

#### Issue: "Data Store script not loaded"
**Cause**: CDN or network issues
**Solution**: 
1. Check network connectivity
2. Verify CDN URLs in headers.txt
3. Try refreshing page

#### Issue: Containers not appearing
**Cause**: Data mapping issues
**Solution**:
1. Check container data structure in Bubble
2. Verify field names match expected schema
3. Check console for data extraction errors

#### Issue: Drag-and-drop not working
**Cause**: React Flow initialization issues
**Solution**:
1. Verify React and React Flow scripts loaded
2. Check for JavaScript errors
3. Ensure container has proper dimensions

#### Issue: View switching not working
**Cause**: View manager initialization failure
**Solution**:
1. Check view-manager.js loaded correctly
2. Verify container ID is set properly
3. Check for CSS conflicts

### Debug Console Commands

```javascript
// Check plugin state
console.log('Data Store:', window.WorkflowArchitectDataStore);
console.log('Event Bridge:', window.WorkflowArchitectEventBridge);
console.log('View Manager:', window.WorkflowArchitectViewManager);

// Get current data
console.log('Current Data:', window.WorkflowArchitectDataStore.getAllData());

// Check current view
console.log('Current View:', window.WorkflowArchitectViewManager.getCurrentView());

// Force view switch
window.WorkflowArchitectViewManager.switchView('container');
```

## Performance Benchmarks

### Expected Performance Metrics
- **Initial Load**: < 3 seconds for 50 containers
- **View Switch**: < 1 second
- **Drag Response**: < 100ms
- **Memory Usage**: < 50MB for large datasets

### Optimization Tips
1. Limit containers to < 100 for optimal performance
2. Use pagination for large sequence lists
3. Implement virtual scrolling for context view
4. Consider lazy loading for complex features

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Limitations
- IE 11: Not supported (React 18 requirement)
- Mobile Safari: Limited drag-and-drop support
- Firefox: Occasional React Flow rendering delays

## Deployment Checklist

- [ ] All CDN URLs use specific versions/commits
- [ ] Database schema matches expected structure
- [ ] Plugin properties configured correctly
- [ ] Test data created and validated
- [ ] Error handling tested thoroughly
- [ ] Performance benchmarks met
- [ ] Cross-browser testing completed
- [ ] User acceptance testing passed

## Support and Maintenance

### Regular Maintenance Tasks
1. Monitor CDN availability and update URLs if needed
2. Check for React Flow updates and compatibility
3. Review error logs for common issues
4. Update documentation based on user feedback

### Escalation Procedures
1. **Level 1**: Check this testing guide and troubleshooting section
2. **Level 2**: Review browser console for detailed error messages
3. **Level 3**: Contact plugin development team with:
   - Browser and version
   - Bubble app configuration
   - Console error logs
   - Steps to reproduce issue

---

*Last Updated: August 2025*
*Plugin Version: 1.0.0*
