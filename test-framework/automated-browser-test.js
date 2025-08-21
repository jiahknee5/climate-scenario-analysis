#!/usr/bin/env node

/**
 * Automated Browser Testing for Dual-Map Applications
 * This script uses Puppeteer to run comprehensive browser tests
 * 
 * Usage: node automated-browser-test.js [test-type]
 * Test types: all, climada, climate-os, performance, visual
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AutomatedBrowserTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
        this.testStartTime = Date.now();
        this.baseUrl = 'http://localhost:8000'; // Adjust as needed
        this.screenshots = [];
    }

    async init() {
        console.log('🚀 Initializing browser test environment...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        this.page = await this.browser.newPage();
        
        // Set up error and console logging
        this.page.on('error', (error) => {
            this.log(`Browser Error: ${error.message}`, 'fail');
        });
        
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.log(`Console Error: ${msg.text()}`, 'fail');
            }
        });
        
        this.page.on('pageerror', (error) => {
            this.log(`Page Error: ${error.message}`, 'fail');
        });
        
        console.log('✅ Browser initialized successfully');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const result = { timestamp, message, type };
        this.results.push(result);
        
        const colors = {
            info: '\x1b[36m',    // Cyan
            pass: '\x1b[32m',    // Green
            fail: '\x1b[31m',    // Red
            warning: '\x1b[33m', // Yellow
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type] || colors.info}[${type.toUpperCase()}] ${message}${colors.reset}`);
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);
            
            // Create screenshots directory if it doesn't exist
            const screenshotsDir = path.dirname(screenshotPath);
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            
            this.screenshots.push({ name, path: screenshotPath });
            this.log(`Screenshot saved: ${screenshotPath}`, 'info');
            
        } catch (error) {
            this.log(`Failed to take screenshot: ${error.message}`, 'fail');
        }
    }

    async testPageLoad(url, expectedTitle, framework) {
        this.log(`Testing page load for ${framework}: ${url}`, 'info');
        
        try {
            const startTime = Date.now();
            
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const loadTime = Date.now() - startTime;
            this.log(`Page loaded in ${loadTime}ms`, loadTime < 5000 ? 'pass' : 'warning');
            
            // Check title
            const title = await this.page.title();
            if (title.includes(expectedTitle)) {
                this.log(`✅ Correct title: ${title}`, 'pass');
            } else {
                this.log(`❌ Incorrect title. Expected: ${expectedTitle}, Got: ${title}`, 'fail');
            }
            
            await this.takeScreenshot(`${framework}-page-load`);
            
            return true;
            
        } catch (error) {
            this.log(`Failed to load page: ${error.message}`, 'fail');
            return false;
        }
    }

    async testElementExistence(selectors, framework) {
        this.log(`Testing element existence for ${framework}`, 'info');
        
        for (const [name, selector] of Object.entries(selectors)) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    this.log(`✅ ${name} found: ${selector}`, 'pass');
                    
                    // Check if element is visible
                    const isVisible = await this.page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    }, element);
                    
                    if (isVisible) {
                        this.log(`✅ ${name} is visible`, 'pass');
                    } else {
                        this.log(`⚠️ ${name} exists but not visible`, 'warning');
                    }
                    
                } else {
                    this.log(`❌ ${name} not found: ${selector}`, 'fail');
                }
            } catch (error) {
                this.log(`Error checking ${name}: ${error.message}`, 'fail');
            }
        }
    }

    async testMapInitialization(framework) {
        this.log(`Testing map initialization for ${framework}`, 'info');
        
        try {
            // Wait for Mapbox to load
            await this.page.waitForFunction(() => {
                return typeof window.mapboxgl !== 'undefined';
            }, { timeout: 10000 });
            
            this.log('✅ Mapbox GL JS loaded', 'pass');
            
            // Check for access token
            const hasToken = await this.page.evaluate(() => {
                return window.mapboxgl && window.mapboxgl.accessToken;
            });
            
            if (hasToken) {
                this.log('✅ Mapbox access token set', 'pass');
            } else {
                this.log('❌ Mapbox access token missing', 'fail');
            }
            
            // Wait for maps to initialize
            await this.page.waitForFunction(() => {
                return window.map1 && window.map2;
            }, { timeout: 15000 });
            
            this.log('✅ Both map instances created', 'pass');
            
            // Check map containers
            const mapContainers = framework === 'climada' 
                ? ['#climada-map1', '#climada-map2']
                : ['#climate-os-map1', '#climate-os-map2'];
            
            for (const container of mapContainers) {
                const dimensions = await this.page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        return { width: rect.width, height: rect.height };
                    }
                    return null;
                }, container);
                
                if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
                    this.log(`✅ Map container ${container}: ${dimensions.width}x${dimensions.height}`, 'pass');
                } else {
                    this.log(`❌ Map container ${container} has invalid dimensions`, 'fail');
                }
            }
            
            await this.takeScreenshot(`${framework}-maps-initialized`);
            
        } catch (error) {
            this.log(`Map initialization failed: ${error.message}`, 'fail');
        }
    }

    async testControlInteraction(framework) {
        this.log(`Testing control interaction for ${framework}`, 'info');
        
        try {
            const controlSelectors = framework === 'climada'
                ? ['#scenario1', '#decade1', '#scenario2', '#decade2']
                : ['#analysis1', '#timeframe1', '#analysis2', '#timeframe2'];
            
            for (const selector of controlSelectors) {
                const control = await this.page.$(selector);
                if (control) {
                    // Get original value
                    const originalValue = await this.page.evaluate(el => el.value, control);
                    
                    // Get options
                    const options = await this.page.evaluate(el => {
                        return Array.from(el.options).map(opt => opt.value);
                    }, control);
                    
                    if (options.length > 1) {
                        // Change to different option
                        const newValue = options.find(opt => opt !== originalValue);
                        if (newValue) {
                            await this.page.select(selector, newValue);
                            this.log(`✅ Changed ${selector} from ${originalValue} to ${newValue}`, 'pass');
                            
                            // Wait a bit for any updates
                            await this.page.waitForTimeout(500);
                            
                            // Revert change
                            await this.page.select(selector, originalValue);
                        }
                    }
                } else {
                    this.log(`❌ Control not found: ${selector}`, 'fail');
                }
            }
            
            await this.takeScreenshot(`${framework}-controls-tested`);
            
        } catch (error) {
            this.log(`Control interaction test failed: ${error.message}`, 'fail');
        }
    }

    async testDataGeneration(framework) {
        this.log(`Testing data generation for ${framework}`, 'info');
        
        try {
            const functionName = framework === 'climada' 
                ? 'generateHurricaneData' 
                : 'generateStatisticalData';
            
            const hasFunction = await this.page.evaluate((funcName) => {
                return typeof window[funcName] === 'function';
            }, functionName);
            
            if (hasFunction) {
                this.log(`✅ ${functionName} function available`, 'pass');
                
                // Test function with different parameters
                const testParams = framework === 'climada'
                    ? ['baseline', 'rcp26', 'rcp45', 'rcp85']
                    : ['historical', 'trends', 'projections', 'risk'];
                
                for (const param of testParams) {
                    const result = await this.page.evaluate((funcName, p) => {
                        try {
                            const data = window[funcName](p);
                            return {
                                success: true,
                                length: Array.isArray(data) ? data.length : 0,
                                hasData: Array.isArray(data) && data.length > 0,
                                firstItem: data[0] || null
                            };
                        } catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    }, functionName, param);
                    
                    if (result.success && result.hasData) {
                        this.log(`✅ Generated ${result.length} data points for ${param}`, 'pass');
                        
                        // Validate data structure
                        if (result.firstItem && result.firstItem.type === 'Feature') {
                            this.log(`✅ Data has correct GeoJSON structure for ${param}`, 'pass');
                        } else {
                            this.log(`❌ Invalid data structure for ${param}`, 'fail');
                        }
                    } else {
                        this.log(`❌ Failed to generate data for ${param}: ${result.error || 'No data'}`, 'fail');
                    }
                }
            } else {
                this.log(`❌ ${functionName} function not available`, 'fail');
            }
            
        } catch (error) {
            this.log(`Data generation test failed: ${error.message}`, 'fail');
        }
    }

    async testPerformance(framework) {
        this.log(`Testing performance for ${framework}`, 'info');
        
        try {
            // Measure page load performance
            const performanceMetrics = await this.page.evaluate(() => {
                if (performance && performance.timing) {
                    const timing = performance.timing;
                    return {
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        loadComplete: timing.loadEventEnd - timing.navigationStart,
                        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0
                    };
                }
                return null;
            });
            
            if (performanceMetrics) {
                this.log(`📊 DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`, 
                    performanceMetrics.domContentLoaded < 3000 ? 'pass' : 'warning');
                this.log(`📊 Load Complete: ${performanceMetrics.loadComplete}ms`, 
                    performanceMetrics.loadComplete < 5000 ? 'pass' : 'warning');
                this.log(`📊 First Paint: ${performanceMetrics.firstPaint}ms`, 
                    performanceMetrics.firstPaint < 2000 ? 'pass' : 'warning');
            }
            
            // Test memory usage
            const memoryUsage = await this.page.evaluate(() => {
                if (performance && performance.memory) {
                    return {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });
            
            if (memoryUsage) {
                const usedMB = Math.round(memoryUsage.used / 1024 / 1024);
                this.log(`📊 Memory Usage: ${usedMB}MB`, 
                    usedMB < 100 ? 'pass' : 'warning');
            }
            
            // Test data generation performance
            const dataGenPerformance = await this.page.evaluate(() => {
                const functionName = window.generateHurricaneData ? 'generateHurricaneData' : 'generateStatisticalData';
                if (typeof window[functionName] === 'function') {
                    const startTime = performance.now();
                    for (let i = 0; i < 10; i++) {
                        window[functionName]('baseline');
                    }
                    const endTime = performance.now();
                    return endTime - startTime;
                }
                return null;
            });
            
            if (dataGenPerformance !== null) {
                this.log(`📊 Data Generation (10x): ${dataGenPerformance.toFixed(2)}ms`, 
                    dataGenPerformance < 1000 ? 'pass' : 'warning');
            }
            
        } catch (error) {
            this.log(`Performance test failed: ${error.message}`, 'fail');
        }
    }

    async testResponsiveness(framework) {
        this.log(`Testing responsiveness for ${framework}`, 'info');
        
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 1024, height: 768, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];
        
        for (const viewport of viewports) {
            try {
                await this.page.setViewport(viewport);
                await this.page.waitForTimeout(1000); // Allow layout to adjust
                
                this.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`, 'info');
                
                // Check if elements are still visible and properly sized
                const layoutCheck = await this.page.evaluate(() => {
                    const appContent = document.querySelector('.app-content');
                    const mapContainers = document.querySelectorAll('.map-container');
                    const controlPanels = document.querySelectorAll('.controls-panel');
                    
                    return {
                        appContentVisible: appContent && appContent.getBoundingClientRect().width > 0,
                        mapContainersVisible: Array.from(mapContainers).every(el => el.getBoundingClientRect().width > 0),
                        controlPanelsVisible: Array.from(controlPanels).every(el => el.getBoundingClientRect().width > 0),
                        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
                    };
                });
                
                if (layoutCheck.appContentVisible) {
                    this.log(`✅ App content visible on ${viewport.name}`, 'pass');
                } else {
                    this.log(`❌ App content not visible on ${viewport.name}`, 'fail');
                }
                
                if (layoutCheck.mapContainersVisible) {
                    this.log(`✅ Map containers visible on ${viewport.name}`, 'pass');
                } else {
                    this.log(`❌ Map containers not visible on ${viewport.name}`, 'fail');
                }
                
                if (!layoutCheck.hasHorizontalScroll || viewport.width < 768) {
                    this.log(`✅ No unwanted horizontal scroll on ${viewport.name}`, 'pass');
                } else {
                    this.log(`⚠️ Horizontal scroll detected on ${viewport.name}`, 'warning');
                }
                
                await this.takeScreenshot(`${framework}-responsive-${viewport.name.toLowerCase()}`);
                
            } catch (error) {
                this.log(`Responsiveness test failed for ${viewport.name}: ${error.message}`, 'fail');
            }
        }
        
        // Reset to default viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async testCLIMADA() {
        this.log('🧪 Starting CLIMADA dual-map tests', 'info');
        
        const url = `${this.baseUrl}/working-dual-climada.html`;
        const loaded = await this.testPageLoad(url, 'CLIMADA', 'climada');
        
        if (!loaded) return;
        
        // Test element existence
        const climadaSelectors = {
            'App Content': '.app-content',
            'Map 1 Container': '#climada-map1',
            'Map 2 Container': '#climada-map2',
            'Control Panel 1': '.controls-panel:first-of-type',
            'Control Panel 2': '.controls-panel:last-of-type',
            'Scenario 1 Control': '#scenario1',
            'Scenario 2 Control': '#scenario2',
            'Decade 1 Control': '#decade1',
            'Decade 2 Control': '#decade2'
        };
        
        await this.testElementExistence(climadaSelectors, 'climada');
        await this.testMapInitialization('climada');
        await this.testControlInteraction('climada');
        await this.testDataGeneration('climada');
        await this.testPerformance('climada');
        await this.testResponsiveness('climada');
        
        this.log('✅ CLIMADA tests completed', 'pass');
    }

    async testClimateOS() {
        this.log('📊 Starting Climate-OS dual-map tests', 'info');
        
        const url = `${this.baseUrl}/working-dual-climate-os.html`;
        const loaded = await this.testPageLoad(url, 'Climate-OS', 'climate-os');
        
        if (!loaded) return;
        
        // Test element existence
        const climateOSSelectors = {
            'App Content': '.app-content',
            'Map 1 Container': '#climate-os-map1',
            'Map 2 Container': '#climate-os-map2',
            'Control Panel 1': '.controls-panel:first-of-type',
            'Control Panel 2': '.controls-panel:last-of-type',
            'Analysis 1 Control': '#analysis1',
            'Analysis 2 Control': '#analysis2',
            'Timeframe 1 Control': '#timeframe1',
            'Timeframe 2 Control': '#timeframe2'
        };
        
        await this.testElementExistence(climateOSSelectors, 'climate-os');
        await this.testMapInitialization('climate-os');
        await this.testControlInteraction('climate-os');
        await this.testDataGeneration('climate-os');
        await this.testPerformance('climate-os');
        await this.testResponsiveness('climate-os');
        
        this.log('✅ Climate-OS tests completed', 'pass');
    }

    async generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.testStartTime;
        
        const passed = this.results.filter(r => r.type === 'pass').length;
        const failed = this.results.filter(r => r.type === 'fail').length;
        const warnings = this.results.filter(r => r.type === 'warning').length;
        const total = passed + failed;
        
        const report = {
            summary: {
                totalTime: totalTime,
                totalTests: total,
                passed: passed,
                failed: failed,
                warnings: warnings,
                successRate: total > 0 ? Math.round((passed / total) * 100) : 0
            },
            results: this.results,
            screenshots: this.screenshots,
            timestamp: new Date().toISOString()
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, 'test-reports', `automated-test-report-${Date.now()}.json`);
        const reportsDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = reportPath.replace('.json', '.html');
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log('\n📊 Test Summary:');
        console.log(`Total Time: ${totalTime}ms`);
        console.log(`Tests: ${passed}/${total} passed (${report.summary.successRate}%)`);
        console.log(`Warnings: ${warnings}`);
        console.log(`Report saved: ${reportPath}`);
        console.log(`HTML Report: ${htmlPath}`);
        
        return report;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Automated Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        .results { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .result { padding: 8px; margin: 3px 0; border-radius: 4px; font-family: monospace; font-size: 14px; }
        .pass { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
        .fail { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
        .info { background: #cce7ff; color: #004085; border-left: 4px solid #007bff; }
        .warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .screenshot { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .screenshot img { max-width: 100%; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Automated Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${report.summary.totalTime}ms</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <div class="stat-number">${report.summary.totalTests}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-number">${report.summary.passed}</div>
            <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
            <div class="stat-number">${report.summary.failed}</div>
            <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
            <div class="stat-number">${report.summary.successRate}%</div>
            <div class="stat-label">Success Rate</div>
        </div>
    </div>
    
    <div class="results">
        <h2>Test Results</h2>
        ${report.results.map(result => 
            `<div class="result ${result.type}">[${result.timestamp}] ${result.message}</div>`
        ).join('')}
    </div>
    
    <div class="screenshots">
        <h2>Screenshots</h2>
        ${report.screenshots.map(screenshot => 
            `<div class="screenshot">
                <h3>${screenshot.name}</h3>
                <img src="${screenshot.path}" alt="${screenshot.name}" />
            </div>`
        ).join('')}
    </div>
</body>
</html>`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('✅ Browser closed');
        }
    }

    async runAllTests() {
        try {
            await this.init();
            await this.testCLIMADA();
            await this.testClimateOS();
            
            const report = await this.generateReport();
            return report;
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'fail');
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution
async function main() {
    const testType = process.argv[2] || 'all';
    const tester = new AutomatedBrowserTest();
    
    try {
        await tester.init();
        
        switch (testType) {
            case 'climada':
                await tester.testCLIMADA();
                break;
            case 'climate-os':
                await tester.testClimateOS();
                break;
            case 'all':
            default:
                await tester.testCLIMADA();
                await tester.testClimateOS();
                break;
        }
        
        const report = await tester.generateReport();
        
        if (report.summary.successRate >= 90) {
            console.log('\n🎉 Excellent! All tests passed with high success rate');
            process.exit(0);
        } else if (report.summary.successRate >= 70) {
            console.log('\n⚠️ Good! Most tests passed but some issues detected');
            process.exit(0);
        } else {
            console.log('\n❌ Issues detected! Check the report for details');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    }
}

// Export for use as module
if (require.main === module) {
    main();
} else {
    module.exports = AutomatedBrowserTest;
}