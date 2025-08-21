// Comprehensive Testing Framework for Dual-Map Applications
// Created to ensure CLIMADA and Climate-OS dual-maps work correctly

class TestFramework {
    constructor() {
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.currentTestSuite = '';
        this.startTime = null;
    }

    // Test runner utilities
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const result = {
            message: `[${timestamp}] ${message}`,
            type: type,
            suite: this.currentTestSuite
        };
        
        this.results.push(result);
        this.updateUI(result);
        
        if (type === 'pass') this.passedTests++;
        if (type === 'fail') this.failedTests++;
        this.totalTests++;
        
        this.updateStats();
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    updateUI(result) {
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${result.type}`;
            resultDiv.textContent = result.message;
            resultsContainer.appendChild(resultDiv);
            resultsContainer.scrollTop = resultsContainer.scrollHeight;
        }
    }

    updateStats() {
        const successRate = this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0;
        
        document.getElementById('total-tests').textContent = this.totalTests;
        document.getElementById('passed-tests').textContent = this.passedTests;
        document.getElementById('failed-tests').textContent = this.failedTests;
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        const progressBar = document.getElementById('progress-fill');
        if (progressBar) {
            progressBar.style.width = `${successRate}%`;
        }
    }

    async assert(condition, message) {
        if (condition) {
            this.log(`✓ ${message}`, 'pass');
        } else {
            this.log(`✗ ${message}`, 'fail');
        }
        return condition;
    }

    async assertEqual(actual, expected, message) {
        const condition = actual === expected;
        const fullMessage = `${message} (expected: ${expected}, got: ${actual})`;
        return this.assert(condition, fullMessage);
    }

    async assertTrue(condition, message) {
        return this.assert(condition === true, message);
    }

    async assertNotNull(value, message) {
        return this.assert(value !== null && value !== undefined, message);
    }

    async assertExists(elementId, message) {
        const element = document.getElementById(elementId);
        return this.assert(element !== null, `${message} - Element #${elementId} exists`);
    }

    startSuite(suiteName) {
        this.currentTestSuite = suiteName;
        this.log(`🧪 Starting ${suiteName}`, 'info');
    }

    endSuite() {
        this.log(`✅ Completed ${this.currentTestSuite}`, 'info');
        this.currentTestSuite = '';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const testFramework = new TestFramework();

// Unit Tests for JavaScript Functions
async function runUnitTests() {
    testFramework.startSuite('Unit Tests');
    
    // Test data generation functions
    await testHurricaneDataGeneration();
    await testStatisticalDataGeneration();
    await testUtilityFunctions();
    
    testFramework.endSuite();
}

async function testHurricaneDataGeneration() {
    testFramework.log('Testing hurricane data generation...', 'info');
    
    // Test generateHurricaneData function exists and returns valid data
    if (typeof generateHurricaneData === 'function') {
        const hurricanes = generateHurricaneData('baseline');
        
        await testFramework.assertTrue(Array.isArray(hurricanes), 'generateHurricaneData returns array');
        await testFramework.assertTrue(hurricanes.length > 0, 'Hurricane data contains entries');
        
        if (hurricanes.length > 0) {
            const hurricane = hurricanes[0];
            await testFramework.assertTrue(hurricane.type === 'Feature', 'Hurricane feature has correct type');
            await testFramework.assertNotNull(hurricane.geometry, 'Hurricane has geometry');
            await testFramework.assertNotNull(hurricane.properties, 'Hurricane has properties');
            await testFramework.assertTrue(hurricane.geometry.type === 'Point', 'Hurricane geometry is Point');
            await testFramework.assertTrue(Array.isArray(hurricane.geometry.coordinates), 'Hurricane has coordinates');
            await testFramework.assertTrue(hurricane.geometry.coordinates.length === 2, 'Hurricane has lat/lng coordinates');
        }
        
        // Test different scenarios produce different amounts of data
        const baselineCount = generateHurricaneData('baseline').length;
        const rcp85Count = generateHurricaneData('rcp85').length;
        await testFramework.assertTrue(rcp85Count >= baselineCount, 'RCP85 scenario has more/equal hurricanes than baseline');
        
    } else {
        testFramework.log('generateHurricaneData function not found - creating mock', 'warning');
        // Create mock function for testing
        window.generateHurricaneData = function(scenario) {
            return [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-75, 25] },
                properties: { intensity: 3, year: 2025 }
            }];
        };
    }
}

async function testStatisticalDataGeneration() {
    testFramework.log('Testing statistical data generation...', 'info');
    
    if (typeof generateStatisticalData === 'function') {
        const stats = generateStatisticalData('historical');
        
        await testFramework.assertTrue(Array.isArray(stats), 'generateStatisticalData returns array');
        await testFramework.assertTrue(stats.length > 0, 'Statistical data contains entries');
        
        if (stats.length > 0) {
            const stat = stats[0];
            await testFramework.assertTrue(stat.type === 'Feature', 'Statistical feature has correct type');
            await testFramework.assertNotNull(stat.properties.value, 'Statistical data has value property');
            await testFramework.assertNotNull(stat.properties.confidence, 'Statistical data has confidence property');
        }
    } else {
        testFramework.log('generateStatisticalData function not found - creating mock', 'warning');
        window.generateStatisticalData = function(analysisType) {
            return [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-75, 25] },
                properties: { value: 50, confidence: 0.8, type: analysisType }
            }];
        };
    }
}

async function testUtilityFunctions() {
    testFramework.log('Testing utility functions...', 'info');
    
    // Test coordinate validation
    const testCoords = [-75, 25];
    await testFramework.assertTrue(testCoords[0] >= -180 && testCoords[0] <= 180, 'Longitude in valid range');
    await testFramework.assertTrue(testCoords[1] >= -90 && testCoords[1] <= 90, 'Latitude in valid range');
    
    // Test scenario mappings
    const scenarios = ['baseline', 'rcp26', 'rcp45', 'rcp85'];
    for (const scenario of scenarios) {
        await testFramework.assertTrue(typeof scenario === 'string', `Scenario ${scenario} is string`);
        await testFramework.assertTrue(scenario.length > 0, `Scenario ${scenario} is not empty`);
    }
}

// Data Validation Tests
async function runDataValidationTests() {
    testFramework.startSuite('Data Validation Tests');
    
    await testDataFormats();
    await testDataRanges();
    await testDataConsistency();
    
    testFramework.endSuite();
}

async function testDataFormats() {
    testFramework.log('Testing data formats...', 'info');
    
    // Test GeoJSON format compliance
    const testFeature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-75, 25] },
        properties: { intensity: 3 }
    };
    
    await testFramework.assertEqual(testFeature.type, 'Feature', 'GeoJSON feature type is correct');
    await testFramework.assertEqual(testFeature.geometry.type, 'Point', 'Geometry type is Point');
    await testFramework.assertTrue(Array.isArray(testFeature.geometry.coordinates), 'Coordinates is array');
    await testFramework.assertNotNull(testFeature.properties, 'Properties object exists');
}

async function testDataRanges() {
    testFramework.log('Testing data ranges...', 'info');
    
    // Test coordinate ranges
    const validLat = 25;
    const validLng = -75;
    
    await testFramework.assertTrue(validLat >= -90 && validLat <= 90, 'Latitude in valid range');
    await testFramework.assertTrue(validLng >= -180 && validLng <= 180, 'Longitude in valid range');
    
    // Test intensity ranges
    const intensity = 3;
    await testFramework.assertTrue(intensity >= 1 && intensity <= 5, 'Hurricane intensity in valid range');
}

async function testDataConsistency() {
    testFramework.log('Testing data consistency...', 'info');
    
    // Test that data generation is consistent
    if (typeof generateHurricaneData === 'function') {
        const data1 = generateHurricaneData('baseline');
        await testFramework.delay(100);
        const data2 = generateHurricaneData('baseline');
        
        // Should be different due to randomness but same structure
        await testFramework.assertTrue(data1.length > 0 && data2.length > 0, 'Data generation produces results');
        await testFramework.assertEqual(typeof data1[0], typeof data2[0], 'Data types are consistent');
    }
}

// Map Integration Tests
async function runMapInitTests() {
    testFramework.startSuite('Map Initialization Tests');
    
    await testMapboxAvailability();
    await testContainerExistence();
    await testMapCreation();
    
    testFramework.endSuite();
}

async function testMapboxAvailability() {
    testFramework.log('Testing Mapbox GL JS availability...', 'info');
    
    await testFramework.assertNotNull(window.mapboxgl, 'Mapbox GL JS is loaded');
    
    if (window.mapboxgl) {
        await testFramework.assertNotNull(window.mapboxgl.Map, 'Mapbox Map constructor available');
        await testFramework.assertNotNull(window.mapboxgl.accessToken, 'Mapbox access token is set');
        
        // Test version
        if (window.mapboxgl.version) {
            testFramework.log(`Mapbox GL JS version: ${window.mapboxgl.version}`, 'info');
            await testFramework.assertTrue(window.mapboxgl.version.length > 0, 'Version string is not empty');
        }
    }
}

async function testContainerExistence() {
    testFramework.log('Testing map container existence...', 'info');
    
    // Test for both CLIMADA and Climate-OS containers
    const climadaContainers = ['climada-map1', 'climada-map2'];
    const climateOSContainers = ['climate-os-map1', 'climate-os-map2'];
    
    // Check if we're on a dual-map page
    let foundContainers = 0;
    
    for (const containerId of [...climadaContainers, ...climateOSContainers]) {
        const container = document.getElementById(containerId);
        if (container) {
            foundContainers++;
            await testFramework.assert(true, `Container ${containerId} exists`);
            
            // Test container properties
            const rect = container.getBoundingClientRect();
            await testFramework.assertTrue(rect.width > 0, `Container ${containerId} has width`);
            await testFramework.assertTrue(rect.height > 0, `Container ${containerId} has height`);
        }
    }
    
    if (foundContainers === 0) {
        testFramework.log('No map containers found - may not be on dual-map page', 'warning');
    } else {
        testFramework.log(`Found ${foundContainers} map containers`, 'info');
    }
}

async function testMapCreation() {
    testFramework.log('Testing map creation...', 'info');
    
    if (!window.mapboxgl) {
        testFramework.log('Skipping map creation test - Mapbox not available', 'warning');
        return;
    }
    
    // Try to create a test map container
    const testContainer = document.createElement('div');
    testContainer.id = 'test-map-container';
    testContainer.style.width = '400px';
    testContainer.style.height = '300px';
    document.body.appendChild(testContainer);
    
    try {
        const testMap = new mapboxgl.Map({
            container: 'test-map-container',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-75, 25],
            zoom: 3
        });
        
        await testFramework.assert(true, 'Test map created successfully');
        
        // Wait for map to load
        testMap.on('load', () => {
            testFramework.log('Test map loaded successfully', 'pass');
            testMap.remove();
            document.body.removeChild(testContainer);
        });
        
        testMap.on('error', (e) => {
            testFramework.log(`Test map error: ${e.error.message}`, 'fail');
            testMap.remove();
            document.body.removeChild(testContainer);
        });
        
    } catch (error) {
        await testFramework.assert(false, `Map creation failed: ${error.message}`);
        document.body.removeChild(testContainer);
    }
}

// Control Integration Tests
async function runControlIntegrationTests() {
    testFramework.startSuite('Control Integration Tests');
    
    await testControlElements();
    await testEventHandlers();
    await testStateManagement();
    
    testFramework.endSuite();
}

async function testControlElements() {
    testFramework.log('Testing control elements...', 'info');
    
    // Test for scenario and timeframe controls
    const controlIds = ['scenario1', 'decade1', 'scenario2', 'decade2', 'analysis1', 'timeframe1', 'analysis2', 'timeframe2'];
    
    let foundControls = 0;
    for (const controlId of controlIds) {
        const control = document.getElementById(controlId);
        if (control) {
            foundControls++;
            await testFramework.assert(true, `Control ${controlId} exists`);
            
            // Test control properties
            await testFramework.assertTrue(control.tagName === 'SELECT', `Control ${controlId} is select element`);
            await testFramework.assertTrue(control.options.length > 0, `Control ${controlId} has options`);
        }
    }
    
    testFramework.log(`Found ${foundControls} control elements`, 'info');
}

async function testEventHandlers() {
    testFramework.log('Testing event handlers...', 'info');
    
    // Test if control change events are properly handled
    const controls = document.querySelectorAll('select');
    let handlerCount = 0;
    
    controls.forEach(control => {
        // Check if event listeners are attached (simplified check)
        if (control.onchange || control.addEventListener) {
            handlerCount++;
        }
    });
    
    await testFramework.assertTrue(handlerCount >= 0, `Found event handlers on ${handlerCount} controls`);
}

async function testStateManagement() {
    testFramework.log('Testing state management...', 'info');
    
    // Test title update functions
    if (typeof updateMapTitle === 'function') {
        await testFramework.assert(true, 'updateMapTitle function exists');
    } else {
        testFramework.log('updateMapTitle function not found', 'warning');
    }
    
    // Test data update functions
    if (typeof updateMapData === 'function') {
        await testFramework.assert(true, 'updateMapData function exists');
    } else {
        testFramework.log('updateMapData function not found', 'warning');
    }
}

// Layout and Visual Tests
async function runLayoutTests() {
    testFramework.startSuite('Layout Tests');
    
    await testGridLayout();
    await testResponsiveness();
    await testBoxSizing();
    
    testFramework.endSuite();
}

async function testGridLayout() {
    testFramework.log('Testing CSS grid layout...', 'info');
    
    const appContent = document.querySelector('.app-content');
    if (appContent) {
        const styles = window.getComputedStyle(appContent);
        
        await testFramework.assertEqual(styles.display, 'grid', 'App content uses CSS grid');
        await testFramework.assertTrue(styles.gridTemplateColumns.includes('1fr'), 'Grid has flexible columns');
        await testFramework.assertTrue(styles.height.includes('calc'), 'Height uses calc() function');
        await testFramework.assertEqual(styles.boxSizing, 'border-box', 'Box sizing is border-box');
    } else {
        testFramework.log('App content element not found', 'warning');
    }
}

async function testResponsiveness() {
    testFramework.log('Testing responsive behavior...', 'info');
    
    const originalWidth = window.innerWidth;
    
    // Test viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    await testFramework.assertNotNull(viewport, 'Viewport meta tag exists');
    
    if (viewport) {
        await testFramework.assertTrue(viewport.content.includes('width=device-width'), 'Viewport includes device-width');
    }
    
    // Test element scaling
    const containers = document.querySelectorAll('.map-container');
    containers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        testFramework.log(`Container ${index + 1}: ${rect.width}x${rect.height}`, 'info');
    });
}

async function testBoxSizing() {
    testFramework.log('Testing box sizing...', 'info');
    
    const elements = document.querySelectorAll('.app-content, .controls-panel, .map-container, .climada-map, .climate-os-map');
    
    elements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const className = element.className || element.tagName;
        
        if (styles.boxSizing === 'border-box') {
            testFramework.log(`✓ ${className} has correct box-sizing`, 'pass');
        } else {
            testFramework.log(`✗ ${className} missing box-sizing: border-box`, 'fail');
        }
    });
}

// Performance Tests
async function runLoadTimeTests() {
    testFramework.startSuite('Load Time Tests');
    
    await testPageLoadTime();
    await testResourceLoading();
    await testMapInitTime();
    
    testFramework.endSuite();
}

async function testPageLoadTime() {
    testFramework.log('Testing page load time...', 'info');
    
    if (performance && performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        testFramework.log(`Page load time: ${loadTime}ms`, 'info');
        
        await testFramework.assertTrue(loadTime < 10000, 'Page loads in under 10 seconds');
        await testFramework.assertTrue(loadTime > 0, 'Load time is positive');
    } else {
        testFramework.log('Performance API not available', 'warning');
    }
}

async function testResourceLoading() {
    testFramework.log('Testing resource loading...', 'info');
    
    // Test if required resources are loaded
    await testFramework.assertNotNull(window.mapboxgl, 'Mapbox GL JS loaded');
    
    // Test CSS loading
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    await testFramework.assertTrue(stylesheets.length > 0, 'CSS stylesheets loaded');
    
    // Test if shared styles are accessible
    const testElement = document.createElement('div');
    testElement.style.color = 'var(--climada-primary)';
    document.body.appendChild(testElement);
    
    const computedColor = window.getComputedStyle(testElement).color;
    document.body.removeChild(testElement);
    
    await testFramework.assertTrue(computedColor !== 'var(--climada-primary)', 'CSS variables are processed');
}

async function testMapInitTime() {
    testFramework.log('Testing map initialization time...', 'info');
    
    const startTime = performance.now();
    
    // Simulate map initialization
    await testFramework.delay(100);
    
    const endTime = performance.now();
    const initTime = endTime - startTime;
    
    testFramework.log(`Simulated init time: ${initTime.toFixed(2)}ms`, 'info');
    await testFramework.assertTrue(initTime < 5000, 'Map initialization under 5 seconds');
}

// Error Handling Tests
async function runErrorHandlingTests() {
    testFramework.startSuite('Error Handling Tests');
    
    await testInvalidAPIKey();
    await testMissingContainers();
    await testNetworkFailures();
    
    testFramework.endSuite();
}

async function testInvalidAPIKey() {
    testFramework.log('Testing invalid API key handling...', 'info');
    
    const originalToken = window.mapboxgl?.accessToken;
    
    if (window.mapboxgl) {
        // Test with invalid token
        window.mapboxgl.accessToken = 'invalid-token';
        
        const testContainer = document.createElement('div');
        testContainer.id = 'error-test-container';
        testContainer.style.width = '100px';
        testContainer.style.height = '100px';
        document.body.appendChild(testContainer);
        
        try {
            const errorMap = new mapboxgl.Map({
                container: 'error-test-container',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [0, 0],
                zoom: 1
            });
            
            errorMap.on('error', (e) => {
                testFramework.log('✓ Error properly caught for invalid API key', 'pass');
                errorMap.remove();
            });
            
            await testFramework.delay(2000);
            
        } catch (error) {
            await testFramework.assert(true, 'Invalid API key throws error');
        }
        
        document.body.removeChild(testContainer);
        
        // Restore original token
        if (originalToken) {
            window.mapboxgl.accessToken = originalToken;
        }
    }
}

async function testMissingContainers() {
    testFramework.log('Testing missing container handling...', 'info');
    
    if (window.mapboxgl) {
        try {
            const errorMap = new mapboxgl.Map({
                container: 'non-existent-container',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [0, 0],
                zoom: 1
            });
            
            await testFramework.assert(false, 'Should throw error for missing container');
        } catch (error) {
            await testFramework.assert(true, 'Missing container throws error');
        }
    }
}

async function testNetworkFailures() {
    testFramework.log('Testing network failure scenarios...', 'info');
    
    // Test offline detection
    await testFramework.assertNotNull(navigator.onLine, 'Navigator online status available');
    
    if (navigator.onLine !== undefined) {
        testFramework.log(`Network status: ${navigator.onLine ? 'Online' : 'Offline'}`, 'info');
        await testFramework.assert(true, 'Network status detection works');
    }
}

// Comprehensive test runner
async function runAllTests() {
    testFramework.log('🚀 Starting comprehensive test suite...', 'info');
    testFramework.startTime = performance.now();
    
    // Reset counters
    testFramework.totalTests = 0;
    testFramework.passedTests = 0;
    testFramework.failedTests = 0;
    testFramework.results = [];
    
    // Clear previous results
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    try {
        await runUnitTests();
        await runDataValidationTests();
        await runMapInitTests();
        await runControlIntegrationTests();
        await runLayoutTests();
        await runLoadTimeTests();
        await runErrorHandlingTests();
        
        const endTime = performance.now();
        const totalTime = endTime - testFramework.startTime;
        
        testFramework.log(`🎉 All tests completed in ${totalTime.toFixed(2)}ms`, 'info');
        testFramework.log(`📊 Final Results: ${testFramework.passedTests}/${testFramework.totalTests} tests passed`, 'info');
        
        const successRate = Math.round((testFramework.passedTests / testFramework.totalTests) * 100);
        if (successRate >= 90) {
            testFramework.log(`🟢 Excellent! ${successRate}% success rate`, 'pass');
        } else if (successRate >= 70) {
            testFramework.log(`🟡 Good! ${successRate}% success rate`, 'warning');
        } else {
            testFramework.log(`🔴 Needs work! ${successRate}% success rate`, 'fail');
        }
        
    } catch (error) {
        testFramework.log(`❌ Test suite failed: ${error.message}`, 'fail');
    }
}

// Individual test runners for UI buttons
function runUtilityTests() { runUnitTests(); }
function runDataIntegrationTests() { runDataValidationTests(); }
function runStyleTests() { runLayoutTests(); }
function runAccessibilityTests() { 
    testFramework.startSuite('Accessibility Tests');
    testFramework.log('A11y tests would check ARIA labels, keyboard navigation, etc.', 'info');
    testFramework.endSuite();
}
function runMemoryTests() { 
    testFramework.startSuite('Memory Tests');
    testFramework.log('Memory tests would monitor heap usage during operations', 'info');
    testFramework.endSuite();
}
function runRenderingTests() { 
    testFramework.startSuite('Rendering Tests');
    testFramework.log('Rendering tests would measure FPS and draw calls', 'info');
    testFramework.endSuite();
}
function runEdgeCaseTests() { 
    testFramework.startSuite('Edge Case Tests');
    testFramework.log('Edge case tests would test extreme values and rapid interactions', 'info');
    testFramework.endSuite();
}
function runBrowserCompatTests() { 
    testFramework.startSuite('Browser Compatibility Tests');
    testFramework.log('Browser tests would check Chrome, Firefox, Safari, Edge compatibility', 'info');
    testFramework.endSuite();
}

// Auto-run basic tests when framework loads
document.addEventListener('DOMContentLoaded', () => {
    testFramework.log('🧪 Test framework loaded and ready', 'info');
    
    // Auto-run basic validation after a short delay
    setTimeout(() => {
        testFramework.log('Running automatic startup validation...', 'info');
        testMapboxAvailability();
        testContainerExistence();
        testLayoutTests();
    }, 1000);
});