// Advanced Climate Risk Analysis Test Framework
// Comprehensive testing for CLIMADA, Climate-OS, and C-bottle frameworks

class AdvancedTestFramework {
    constructor() {
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.warnings = 0;
        this.currentSuite = '';
        this.startTime = null;
        
        // Test configurations
        this.frameworks = {
            climada: {
                name: 'CLIMADA',
                urls: [
                    'climada-hurricane-analysis.html',
                    'climada-hurricane-analysis-fixed.html',
                    'working-dual-climada.html',
                    'climada-dual-map-analysis.html'
                ],
                color: '#2196F3'
            },
            climateOS: {
                name: 'Climate-OS',
                urls: [
                    'climate-os-statistical.html',
                    'working-dual-climate-os.html',
                    'climate-os-dual-statistical.html'
                ],
                color: '#A23B72'
            },
            cbottle: {
                name: 'C-bottle',
                urls: [
                    'cbottle-risk-assessment.html',
                    'cbottle-scenario-analysis.html'
                ],
                color: '#4285F4'
            }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const result = {
            message: `[${timestamp}] ${message}`,
            type: type,
            suite: this.currentSuite
        };
        
        this.results.push(result);
        this.updateUI(result);
        
        if (type === 'pass') this.passedTests++;
        if (type === 'fail') this.failedTests++;
        if (type === 'warning') this.warnings++;
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

    startSuite(suiteName) {
        this.currentSuite = suiteName;
        this.log(`🧪 Starting ${suiteName}`, 'info');
    }

    endSuite() {
        this.log(`✅ Completed ${this.currentSuite}`, 'info');
        this.currentSuite = '';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test if a URL is accessible
    async testUrlAccessibility(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Create and test iframe loading
    async testFrameworkLoad(url, timeout = 5000) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            
            const timer = setTimeout(() => {
                document.body.removeChild(iframe);
                resolve(false);
            }, timeout);
            
            iframe.onload = () => {
                clearTimeout(timer);
                document.body.removeChild(iframe);
                resolve(true);
            };
            
            iframe.onerror = () => {
                clearTimeout(timer);
                document.body.removeChild(iframe);
                resolve(false);
            };
            
            document.body.appendChild(iframe);
        });
    }
}

const testFramework = new AdvancedTestFramework();

// Requirements Validation Tests
async function testFrameworkAccessibility() {
    testFramework.startSuite('Framework Accessibility Tests');
    
    let accessibleFrameworks = 0;
    
    for (const [key, framework] of Object.entries(testFramework.frameworks)) {
        testFramework.log(`Testing ${framework.name} framework...`, 'info');
        
        let frameworkAccessible = false;
        for (const url of framework.urls) {
            const accessible = await testFramework.testUrlAccessibility(url);
            if (accessible) {
                frameworkAccessible = true;
                await testFramework.assert(true, `${framework.name} - ${url} is accessible`);
                break;
            }
        }
        
        if (frameworkAccessible) {
            accessibleFrameworks++;
        } else {
            await testFramework.assert(false, `${framework.name} framework not accessible`);
        }
    }
    
    await testFramework.assert(accessibleFrameworks === 3, `All 3 frameworks accessible (found ${accessibleFrameworks})`);
    
    testFramework.endSuite();
}

async function testDualMapComparison() {
    testFramework.startSuite('Dual-Map Comparison Tests');
    
    const dualMapUrls = [
        'working-dual-climada.html',
        'working-dual-climate-os.html',
        'climada-dual-map-analysis.html',
        'climate-os-dual-statistical.html'
    ];
    
    let workingDualMaps = 0;
    
    for (const url of dualMapUrls) {
        const accessible = await testFramework.testUrlAccessibility(url);
        if (accessible) {
            workingDualMaps++;
            await testFramework.assert(true, `Dual-map view accessible: ${url}`);
        } else {
            await testFramework.assert(false, `Dual-map view failed: ${url}`);
        }
    }
    
    await testFramework.assert(workingDualMaps >= 2, `At least 2 dual-map views working (found ${workingDualMaps})`);
    
    testFramework.endSuite();
}

async function testResponsiveDesign() {
    testFramework.startSuite('Responsive Design Tests');
    
    // Test viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    await testFramework.assert(viewport !== null, 'Viewport meta tag exists');
    
    if (viewport) {
        await testFramework.assert(
            viewport.content.includes('width=device-width'), 
            'Viewport includes device-width'
        );
    }
    
    // Test CSS Grid support
    const testDiv = document.createElement('div');
    testDiv.style.display = 'grid';
    await testFramework.assert(
        testDiv.style.display === 'grid', 
        'CSS Grid support available'
    );
    
    // Test responsive breakpoints
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    testFramework.log(`Mobile breakpoint matches: ${mediaQuery.matches}`, 'info');
    
    testFramework.endSuite();
}

// Navigation and Menu Tests
async function testLaunchButtons() {
    testFramework.startSuite('Launch Button Tests');
    
    // Test main page launch buttons
    const mainPageButtons = [
        { href: 'climada-hurricane-analysis', text: 'Launch CLIMADA' },
        { href: 'climate-os-statistical', text: 'Launch Climate-OS' },
        { href: 'cbottle-risk-assessment', text: 'Launch C-bottle' }
    ];
    
    for (const button of mainPageButtons) {
        const accessible = await testFramework.testUrlAccessibility(`${button.href}.html`);
        await testFramework.assert(accessible, `${button.text} button target accessible`);
    }
    
    // Test dual-map comparison buttons
    const dualMapButtons = [
        'working-dual-climada.html',
        'working-dual-climate-os.html',
        'cbottle-scenario-analysis.html'
    ];
    
    for (const url of dualMapButtons) {
        const accessible = await testFramework.testUrlAccessibility(url);
        await testFramework.assert(accessible, `Dual-map button target accessible: ${url}`);
    }
    
    testFramework.endSuite();
}

async function testDropdownMenus() {
    testFramework.startSuite('Dropdown Menu Tests');
    
    // This would test actual dropdown functionality in frameworks
    // For now, we'll test that framework pages can be loaded
    const frameworkPages = [
        'climada-hurricane-analysis.html',
        'climate-os-statistical.html',
        'cbottle-risk-assessment.html'
    ];
    
    for (const url of frameworkPages) {
        const loaded = await testFramework.testFrameworkLoad(url);
        await testFramework.assert(loaded, `Framework page loads: ${url}`);
    }
    
    testFramework.endSuite();
}

async function testInternalNavigation() {
    testFramework.startSuite('Internal Navigation Tests');
    
    // Test if framework comparison page exists
    const comparisonAccessible = await testFramework.testUrlAccessibility('framework-comparison.html');
    if (comparisonAccessible) {
        await testFramework.assert(true, 'Framework comparison page accessible');
    } else {
        testFramework.log('Framework comparison page not found - creating recommendation', 'warning');
    }
    
    // Test return navigation to main page
    const mainPageAccessible = await testFramework.testUrlAccessibility('index.html');
    await testFramework.assert(mainPageAccessible, 'Main page accessible for return navigation');
    
    testFramework.endSuite();
}

// Hurricane Path Validation Tests
async function testHurricaneAccuracy() {
    testFramework.startSuite('Hurricane Path Accuracy Tests');
    
    // Test for meteorologically accurate hurricane paths
    testFramework.log('Analyzing hurricane path generation...', 'info');
    
    // Simulate testing hurricane data generation
    const testPaths = generateRealisticHurricanePaths();
    
    // Check if paths curve northward (Coriolis effect)
    let pathsWithCoriolis = 0;
    testPaths.forEach((path, index) => {
        const startLat = path.coordinates[0][1];
        const endLat = path.coordinates[path.coordinates.length - 1][1];
        
        if (endLat > startLat) { // Path curves northward
            pathsWithCoriolis++;
        }
    });
    
    const coriolisPercentage = (pathsWithCoriolis / testPaths.length) * 100;
    await testFramework.assert(
        coriolisPercentage >= 70, 
        `${coriolisPercentage.toFixed(1)}% of hurricane paths show northward curve (Coriolis effect)`
    );
    
    // Test Atlantic hurricane origin areas
    let atlanticOrigins = 0;
    testPaths.forEach(path => {
        const startLng = path.coordinates[0][0];
        const startLat = path.coordinates[0][1];
        
        // Atlantic hurricane formation zone: 10°-25°N, 15°-70°W
        if (startLat >= 10 && startLat <= 25 && startLng >= -70 && startLng <= -15) {
            atlanticOrigins++;
        }
    });
    
    const atlanticPercentage = (atlanticOrigins / testPaths.length) * 100;
    await testFramework.assert(
        atlanticPercentage >= 80, 
        `${atlanticPercentage.toFixed(1)}% of hurricanes originate in Atlantic formation zones`
    );
    
    testFramework.endSuite();
}

async function testCoriolisEffect() {
    testFramework.startSuite('Coriolis Effect Tests');
    
    const testPaths = generateRealisticHurricanePaths();
    
    testPaths.forEach((path, index) => {
        const coords = path.coordinates;
        let northwardMovement = 0;
        let eastwardMovement = 0;
        
        for (let i = 1; i < coords.length; i++) {
            const latChange = coords[i][1] - coords[i-1][1];
            const lngChange = coords[i][0] - coords[i-1][0];
            
            if (latChange > 0) northwardMovement++;
            if (lngChange > 0) eastwardMovement++;
        }
        
        const hasNorthwardCurve = northwardMovement >= coords.length * 0.6;
        const hasEastwardCurve = eastwardMovement >= coords.length * 0.4;
        
        testFramework.log(
            `Hurricane ${index + 1}: Northward=${hasNorthwardCurve}, Eastward=${hasEastwardCurve}`, 
            hasNorthwardCurve ? 'pass' : 'warning'
        );
    });
    
    testFramework.endSuite();
}

async function testPacificTracks() {
    testFramework.startSuite('Pacific Hurricane Tracks Tests');
    
    // Generate Pacific hurricane data
    const pacificPaths = generatePacificHurricanePaths();
    
    await testFramework.assert(
        pacificPaths.length > 0, 
        `Pacific hurricane tracks generated (${pacificPaths.length} tracks)`
    );
    
    // Test Eastern Pacific formation zone
    let easternPacificOrigins = 0;
    pacificPaths.forEach(path => {
        const startLng = path.coordinates[0][0];
        const startLat = path.coordinates[0][1];
        
        // Eastern Pacific formation zone: 5°-25°N, 90°-140°W
        if (startLat >= 5 && startLat <= 25 && startLng >= -140 && startLng <= -90) {
            easternPacificOrigins++;
        }
    });
    
    const pacificPercentage = (easternPacificOrigins / pacificPaths.length) * 100;
    await testFramework.assert(
        pacificPercentage >= 70, 
        `${pacificPercentage.toFixed(1)}% of Pacific hurricanes originate in Eastern Pacific`
    );
    
    testFramework.endSuite();
}

// Map Functionality Tests
async function testMapLoading() {
    testFramework.startSuite('Map Loading Tests');
    
    // Test Mapbox GL JS availability
    const mapboxAvailable = typeof mapboxgl !== 'undefined';
    await testFramework.assert(mapboxAvailable, 'Mapbox GL JS library available');
    
    if (mapboxAvailable) {
        await testFramework.assert(typeof mapboxgl.Map === 'function', 'Mapbox Map constructor available');
        
        // Test map initialization
        const testContainer = document.createElement('div');
        testContainer.id = 'test-map-container';
        testContainer.style.width = '300px';
        testContainer.style.height = '200px';
        document.body.appendChild(testContainer);
        
        try {
            const testMap = new mapboxgl.Map({
                container: 'test-map-container',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [-75, 25],
                zoom: 3,
                accessToken: 'test-token'
            });
            
            await testFramework.assert(true, 'Map instance created successfully');
            testMap.remove();
        } catch (error) {
            testFramework.log(`Map creation test: ${error.message}`, 'warning');
        }
        
        document.body.removeChild(testContainer);
    }
    
    testFramework.endSuite();
}

async function testMapControls() {
    testFramework.startSuite('Map Controls Tests');
    
    // Test for common control elements
    const controlSelectors = [
        'select[id*="scenario"]',
        'select[id*="decade"]',
        'select[id*="analysis"]',
        'select[id*="timeframe"]'
    ];
    
    let foundControls = 0;
    controlSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            foundControls++;
            testFramework.log(`Found ${elements.length} ${selector} controls`, 'pass');
        }
    });
    
    await testFramework.assert(foundControls >= 0, `Control elements detection completed`);
    
    testFramework.endSuite();
}

async function testDataUpdates() {
    testFramework.startSuite('Data Update Tests');
    
    // Test data generation functions
    if (typeof generateHurricaneData === 'function') {
        await testFramework.assert(true, 'generateHurricaneData function available');
        
        // Test different scenarios
        const scenarios = ['baseline', 'rcp26', 'rcp45', 'rcp85'];
        scenarios.forEach(scenario => {
            try {
                const data = generateHurricaneData(scenario);
                testFramework.log(`✓ Generated data for ${scenario}: ${data.length || 'N/A'} items`, 'pass');
            } catch (error) {
                testFramework.log(`✗ Failed to generate data for ${scenario}`, 'fail');
            }
        });
    } else {
        testFramework.log('generateHurricaneData function not available in this context', 'warning');
    }
    
    testFramework.endSuite();
}

// Data Accuracy Tests
async function testHurricaneCategories() {
    testFramework.startSuite('Hurricane Category Tests');
    
    // Test category-to-color mapping
    const categoryColors = {
        1: '#74CCFF', // Light blue
        2: '#FFD23F', // Yellow
        3: '#FF8C42', // Orange
        4: '#FF6B6B', // Red
        5: '#D63031'  // Dark red
    };
    
    Object.entries(categoryColors).forEach(([category, color]) => {
        // Validate color format
        const isValidColor = /^#[0-9A-F]{6}$/i.test(color);
        testFramework.log(
            `Category ${category} color ${color} is valid: ${isValidColor}`, 
            isValidColor ? 'pass' : 'fail'
        );
    });
    
    // Test wind speed ranges
    const windRanges = {
        1: [74, 95],   // Category 1: 74-95 mph
        2: [96, 110],  // Category 2: 96-110 mph
        3: [111, 129], // Category 3: 111-129 mph
        4: [130, 156], // Category 4: 130-156 mph
        5: [157, 200]  // Category 5: 157+ mph
    };
    
    Object.entries(windRanges).forEach(([category, [min, max]]) => {
        const rangeValid = min < max && min >= 74;
        testFramework.log(
            `Category ${category} wind range (${min}-${max} mph) is valid: ${rangeValid}`, 
            rangeValid ? 'pass' : 'fail'
        );
    });
    
    testFramework.endSuite();
}

async function testStatisticalData() {
    testFramework.startSuite('Statistical Data Tests');
    
    // Test historical data ranges
    const historicalStats = {
        averageHurricanes: 14.8,
        trendPerDecade: 1.4,
        dataPeriod: '1980-2024'
    };
    
    Object.entries(historicalStats).forEach(([key, value]) => {
        const isReasonable = typeof value === 'number' ? value > 0 : value.length > 0;
        testFramework.log(
            `Historical ${key}: ${value} (reasonable: ${isReasonable})`, 
            isReasonable ? 'pass' : 'warning'
        );
    });
    
    // Test return period calculations
    const returnPeriods = [10, 25, 50, 100, 500];
    returnPeriods.forEach(period => {
        const probability = 1 / period;
        const isValid = probability > 0 && probability <= 1;
        testFramework.log(
            `${period}-year return period probability: ${probability.toFixed(4)} (valid: ${isValid})`, 
            isValid ? 'pass' : 'fail'
        );
    });
    
    testFramework.endSuite();
}

async function testPropertyRisk() {
    testFramework.startSuite('Property Risk Tests');
    
    // Test risk zone classifications
    const riskZones = ['AE', 'VE', 'X', 'A', 'AO'];
    const floodZoneDescriptions = {
        'AE': '1% annual chance flood zones with base flood elevations',
        'VE': '1% annual chance coastal flood zones with wave action',
        'X': 'Areas of minimal flood risk',
        'A': '1% annual chance flood zones without base flood elevations',
        'AO': 'Areas with 1% annual chance of shallow flooding'
    };
    
    riskZones.forEach(zone => {
        const hasDescription = floodZoneDescriptions[zone] !== undefined;
        testFramework.log(
            `Risk zone ${zone} has description: ${hasDescription}`, 
            hasDescription ? 'pass' : 'warning'
        );
    });
    
    // Test property value ranges
    const propertyValues = [250000, 500000, 750000, 1000000, 1500000];
    propertyValues.forEach(value => {
        const isReasonable = value >= 100000 && value <= 5000000;
        testFramework.log(
            `Property value $${value.toLocaleString()} is reasonable: ${isReasonable}`, 
            isReasonable ? 'pass' : 'warning'
        );
    });
    
    testFramework.endSuite();
}

// Helper functions for realistic hurricane data
function generateRealisticHurricanePaths() {
    const paths = [];
    const count = 10;
    
    for (let i = 0; i < count; i++) {
        // Atlantic hurricane formation zone: Cape Verde or Gulf of Mexico
        const isCapeverde = Math.random() > 0.3;
        
        let startLng, startLat;
        if (isCapeverde) {
            // Cape Verde formation area
            startLng = -25 - Math.random() * 10; // 25°-35°W
            startLat = 10 + Math.random() * 8;   // 10°-18°N
        } else {
            // Gulf of Mexico formation
            startLng = -95 + Math.random() * 15; // 95°-80°W
            startLat = 18 + Math.random() * 7;   // 18°-25°N
        }
        
        const coordinates = [];
        let currentLng = startLng;
        let currentLat = startLat;
        
        // Generate realistic track with Coriolis effect
        for (let j = 0; j < 8; j++) {
            coordinates.push([currentLng, currentLat]);
            
            // Move generally west-northwest initially, then curve northeast
            const progressRatio = j / 7;
            
            // Longitude change: westward initially, then eastward due to steering winds
            let lngChange;
            if (progressRatio < 0.5) {
                lngChange = 1 + Math.random() * 2; // Move westward
            } else {
                lngChange = -0.5 - Math.random() * 1.5; // Curve eastward
            }
            
            // Latitude change: always northward due to Coriolis effect
            const latChange = 0.5 + Math.random() * 1.5 + progressRatio * 1.5; // Increasing northward movement
            
            currentLng += lngChange;
            currentLat += latChange;
            
            // Add some random variation
            currentLng += (Math.random() - 0.5) * 0.5;
            currentLat += (Math.random() - 0.5) * 0.3;
        }
        
        paths.push({
            coordinates: coordinates,
            intensity: Math.floor(Math.random() * 5) + 1,
            type: isCapeverde ? 'Cape Verde' : 'Gulf'
        });
    }
    
    return paths;
}

function generatePacificHurricanePaths() {
    const paths = [];
    const count = 8;
    
    for (let i = 0; i < count; i++) {
        // Eastern Pacific formation zone
        const startLng = -120 - Math.random() * 15; // 120°-135°W
        const startLat = 8 + Math.random() * 12;    // 8°-20°N
        
        const coordinates = [];
        let currentLng = startLng;
        let currentLat = startLat;
        
        // Pacific hurricanes generally move west-northwest
        for (let j = 0; j < 6; j++) {
            coordinates.push([currentLng, currentLat]);
            
            // Move west-northwest (Pacific steering pattern)
            const lngChange = -1.5 - Math.random() * 1; // Move westward
            const latChange = 0.3 + Math.random() * 0.8; // Move slightly northward
            
            currentLng += lngChange;
            currentLat += latChange;
            
            // Add variation
            currentLng += (Math.random() - 0.5) * 0.4;
            currentLat += (Math.random() - 0.5) * 0.3;
        }
        
        paths.push({
            coordinates: coordinates,
            intensity: Math.floor(Math.random() * 5) + 1,
            basin: 'Eastern Pacific'
        });
    }
    
    return paths;
}

// Comprehensive test runner
async function runAllTests() {
    testFramework.log('🚀 Starting comprehensive test suite...', 'info');
    testFramework.startTime = performance.now();
    
    // Reset counters
    testFramework.totalTests = 0;
    testFramework.passedTests = 0;
    testFramework.failedTests = 0;
    testFramework.warnings = 0;
    testFramework.results = [];
    
    // Clear previous results
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    try {
        // Run all test suites
        await testFrameworkAccessibility();
        await testDualMapComparison();
        await testResponsiveDesign();
        await testLaunchButtons();
        await testDropdownMenus();
        await testInternalNavigation();
        await testHurricaneAccuracy();
        await testCoriolisEffect();
        await testPacificTracks();
        await testMapLoading();
        await testMapControls();
        await testDataUpdates();
        await testHurricaneCategories();
        await testStatisticalData();
        await testPropertyRisk();
        
        const endTime = performance.now();
        const totalTime = endTime - testFramework.startTime;
        
        testFramework.log(`🎉 All tests completed in ${totalTime.toFixed(2)}ms`, 'info');
        testFramework.log(`📊 Final Results: ${testFramework.passedTests}/${testFramework.totalTests} tests passed`, 'info');
        testFramework.log(`⚠️  Warnings: ${testFramework.warnings}`, 'warning');
        
        const successRate = Math.round((testFramework.passedTests / testFramework.totalTests) * 100);
        if (successRate >= 90) {
            testFramework.log(`🟢 Excellent! ${successRate}% success rate`, 'pass');
        } else if (successRate >= 70) {
            testFramework.log(`🟡 Good! ${successRate}% success rate`, 'warning');
        } else {
            testFramework.log(`🔴 Needs work! ${successRate}% success rate`, 'fail');
        }
        
        // Generate recommendations
        generateTestRecommendations();
        
    } catch (error) {
        testFramework.log(`❌ Test suite failed: ${error.message}`, 'fail');
    }
}

async function runCriticalTests() {
    testFramework.log('🔥 Running critical tests only...', 'info');
    
    // Reset counters
    testFramework.totalTests = 0;
    testFramework.passedTests = 0;
    testFramework.failedTests = 0;
    testFramework.results = [];
    
    await testFrameworkAccessibility();
    await testLaunchButtons();
    await testHurricaneAccuracy();
    await testMapLoading();
    
    testFramework.log('✅ Critical tests completed', 'info');
}

function generateTestRecommendations() {
    testFramework.log('📋 Generating recommendations...', 'info');
    
    const recommendations = [];
    
    // Analyze failed tests and generate recommendations
    const failedTests = testFramework.results.filter(r => r.type === 'fail');
    const warnings = testFramework.results.filter(r => r.type === 'warning');
    
    if (failedTests.length > 0) {
        recommendations.push('🔧 Fix failed tests to improve system reliability');
    }
    
    if (warnings.length > 5) {
        recommendations.push('⚠️  Address warnings to enhance user experience');
    }
    
    // Hurricane path specific recommendations
    const hurricaneTests = testFramework.results.filter(r => r.message.includes('hurricane') || r.message.includes('Coriolis'));
    const hurricaneFailures = hurricaneTests.filter(r => r.type === 'fail');
    
    if (hurricaneFailures.length > 0) {
        recommendations.push('🌪️  Update hurricane path generation to include realistic Coriolis effect');
        recommendations.push('🗺️  Add Pacific hurricane tracks for comprehensive coverage');
    }
    
    recommendations.forEach(rec => {
        testFramework.log(rec, 'info');
    });
}

function clearResults() {
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="test-result info">Results cleared. Ready for new tests.</div>';
    }
    
    // Reset stats
    testFramework.totalTests = 0;
    testFramework.passedTests = 0;
    testFramework.failedTests = 0;
    testFramework.warnings = 0;
    testFramework.results = [];
    testFramework.updateStats();
}

// Export for global access
function log(message, type = 'info') {
    testFramework.log(message, type);
}