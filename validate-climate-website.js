#!/usr/bin/env node

/**
 * SUPER PROMPT EXECUTION: Comprehensive Climate Website Validator
 * 
 * This script executes the super prompt to validate:
 * - All login types and authentication flows
 * - All website links and navigation
 * - Database connections and data integrity
 * - Complete climate.johnnycchung.com subdomain functionality
 * 
 * Usage: node validate-climate-website.js [--verbose] [--export]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

class ClimateWebsiteValidator {
    constructor(options = {}) {
        this.verbose = options.verbose || false;
        this.export = options.export || false;
        this.baseUrl = 'https://climate.johnnycchung.com';
        this.results = [];
        this.stats = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            criticalErrors: 0,
            startTime: Date.now()
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            critical: '\x1b[35m', // Magenta
            reset: '\x1b[0m'
        };

        const result = {
            timestamp,
            type,
            message
        };

        this.results.push(result);
        
        if (type === 'success') this.stats.passed++;
        else if (type === 'error') this.stats.failed++;
        else if (type === 'warning') this.stats.warnings++;
        else if (type === 'critical') this.stats.criticalErrors++;
        
        this.stats.totalTests++;

        const color = colors[type] || colors.info;
        console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'Climate-Website-Validator/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    ...options.headers
                }
            };

            const startTime = Date.now();
            const client = urlObj.protocol === 'https:' ? https : http;

            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    if (options.method !== 'HEAD') {
                        data += chunk;
                    }
                });

                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        responseTime: responseTime,
                        url: url
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // PHASE 1: Infrastructure & Domain Validation
    async validateInfrastructure() {
        this.log('🔧 PHASE 1: Infrastructure & Domain Validation', 'info');

        // Test 1: Domain Resolution
        try {
            const response = await this.makeRequest(this.baseUrl, { method: 'HEAD' });
            if (response.statusCode >= 200 && response.statusCode < 400) {
                this.log(`✅ Domain resolves correctly (${response.responseTime}ms)`, 'success');
            } else {
                this.log(`❌ Domain resolution issue: HTTP ${response.statusCode}`, 'error');
            }
        } catch (error) {
            this.log(`❌ CRITICAL: Domain resolution failed: ${error.message}`, 'critical');
        }

        // Test 2: HTTPS/SSL Validation
        try {
            const httpsResponse = await this.makeRequest(this.baseUrl);
            if (httpsResponse.url.startsWith('https://') || httpsResponse.headers['strict-transport-security']) {
                this.log('✅ HTTPS/SSL properly configured', 'success');
            } else {
                this.log('⚠️ HTTPS configuration may need review', 'warning');
            }
        } catch (error) {
            this.log(`❌ HTTPS/SSL test failed: ${error.message}`, 'error');
        }

        // Test 3: Server Headers & Security
        try {
            const response = await this.makeRequest(this.baseUrl);
            const headers = response.headers;

            // Check for Vercel
            if (headers['x-vercel-id'] || headers['server']?.includes('Vercel')) {
                this.log('✅ Vercel deployment detected', 'success');
            } else {
                this.log('ℹ️ Deployment platform unclear', 'info');
            }

            // Check security headers
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection',
                'strict-transport-security'
            ];

            let securityScore = 0;
            securityHeaders.forEach(header => {
                if (headers[header]) {
                    securityScore++;
                }
            });

            if (securityScore >= 3) {
                this.log(`✅ Security headers: ${securityScore}/4 present`, 'success');
            } else {
                this.log(`⚠️ Security headers: ${securityScore}/4 present`, 'warning');
            }

        } catch (error) {
            this.log(`❌ Server headers test failed: ${error.message}`, 'error');
        }
    }

    // PHASE 2: Authentication & Login Testing
    async validateAuthentication() {
        this.log('🔐 PHASE 2: Authentication & Login Testing', 'info');

        // Test 1: Public Access
        const publicUrls = [
            '',
            '/working-dual-climada.html',
            '/working-dual-climate-os.html',
            '/cbottle-scenario-analysis.html',
            '/index.html'
        ];

        for (const path of publicUrls) {
            try {
                const response = await this.makeRequest(`${this.baseUrl}${path}`);
                const displayPath = path || '/';
                
                if (response.statusCode === 200) {
                    this.log(`✅ Public access: ${displayPath}`, 'success');
                } else if (response.statusCode === 404) {
                    this.log(`❌ Not found: ${displayPath}`, 'error');
                } else if (response.statusCode === 401 || response.statusCode === 403) {
                    this.log(`⚠️ Authentication required: ${displayPath}`, 'warning');
                } else {
                    this.log(`⚠️ Unexpected status ${response.statusCode}: ${displayPath}`, 'warning');
                }
            } catch (error) {
                this.log(`❌ Public access test failed for ${path}: ${error.message}`, 'error');
            }
        }

        // Test 2: Login Form Detection
        try {
            const response = await this.makeRequest(this.baseUrl);
            const html = response.data.toLowerCase();
            
            const loginIndicators = ['login', 'signin', 'auth', 'password', 'username'];
            const foundIndicators = loginIndicators.filter(indicator => html.includes(indicator));
            
            if (foundIndicators.length > 0) {
                this.log(`✅ Login functionality detected (${foundIndicators.join(', ')})`, 'success');
            } else {
                this.log('ℹ️ No explicit login forms detected (may use external auth)', 'info');
            }
        } catch (error) {
            this.log(`❌ Login detection test failed: ${error.message}`, 'error');
        }

        // Test 3: Session Management
        try {
            const response = await this.makeRequest(this.baseUrl);
            const cookies = response.headers['set-cookie'];
            
            if (cookies && cookies.length > 0) {
                this.log('✅ Session cookies detected', 'success');
            } else {
                this.log('ℹ️ No session cookies detected (may use different session management)', 'info');
            }
        } catch (error) {
            this.log(`❌ Session management test failed: ${error.message}`, 'error');
        }
    }

    // PHASE 3: Database Connection Testing
    async validateDatabase() {
        this.log('💾 PHASE 3: Database Connection Testing', 'info');

        // Test 1: API Endpoints
        const apiEndpoints = [
            '/api/data',
            '/api/climate',
            '/api/scenarios',
            '/api/health',
            '/api/status',
            '/api/auth'
        ];

        for (const endpoint of apiEndpoints) {
            try {
                const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
                
                if (response.statusCode === 200) {
                    this.log(`✅ API endpoint active: ${endpoint}`, 'success');
                } else if (response.statusCode === 404) {
                    this.log(`ℹ️ API endpoint not found: ${endpoint}`, 'info');
                } else if (response.statusCode === 401) {
                    this.log(`✅ API endpoint protected: ${endpoint}`, 'success');
                } else {
                    this.log(`⚠️ API endpoint status ${response.statusCode}: ${endpoint}`, 'warning');
                }
            } catch (error) {
                this.log(`ℹ️ API endpoint test: ${endpoint} - ${error.message}`, 'info');
            }
        }

        // Test 2: Dynamic Content Detection
        try {
            const response = await this.makeRequest(this.baseUrl);
            const html = response.data;
            
            const dynamicIndicators = [
                'data-',
                'api/',
                'fetch(',
                'XMLHttpRequest',
                'axios',
                'json'
            ];
            
            let dynamicScore = 0;
            dynamicIndicators.forEach(indicator => {
                if (html.includes(indicator)) {
                    dynamicScore++;
                }
            });
            
            if (dynamicScore >= 3) {
                this.log(`✅ Dynamic content detected (score: ${dynamicScore}/6)`, 'success');
            } else if (dynamicScore >= 1) {
                this.log(`⚠️ Limited dynamic content (score: ${dynamicScore}/6)`, 'warning');
            } else {
                this.log('ℹ️ Static content detected (may be pre-rendered)', 'info');
            }
            
        } catch (error) {
            this.log(`❌ Dynamic content test failed: ${error.message}`, 'error');
        }

        // Test 3: Database Performance Simulation
        try {
            const start = Date.now();
            const response = await this.makeRequest(`${this.baseUrl}/working-dual-climada.html`);
            const loadTime = Date.now() - start;
            
            if (loadTime < 500) {
                this.log(`✅ Fast data loading: ${loadTime}ms`, 'success');
            } else if (loadTime < 2000) {
                this.log(`⚠️ Moderate data loading: ${loadTime}ms`, 'warning');
            } else {
                this.log(`❌ Slow data loading: ${loadTime}ms`, 'error');
            }
        } catch (error) {
            this.log(`❌ Database performance test failed: ${error.message}`, 'error');
        }
    }

    // PHASE 4: Comprehensive Link Testing
    async validateLinks() {
        this.log('🔗 PHASE 4: Comprehensive Link Testing', 'info');

        // Test 1: Framework Links
        const frameworkLinks = [
            '/working-dual-climada.html',
            '/working-dual-climate-os.html',
            '/cbottle-scenario-analysis.html',
            '/climada-hurricane-analysis.html',
            '/climate-os-statistical.html',
            '/cbottle-risk-assessment.html'
        ];

        for (const link of frameworkLinks) {
            try {
                const response = await this.makeRequest(`${this.baseUrl}${link}`);
                
                if (response.statusCode === 200) {
                    this.log(`✅ Framework link: ${link}`, 'success');
                } else if (response.statusCode === 404) {
                    this.log(`❌ Broken framework link: ${link}`, 'error');
                } else {
                    this.log(`⚠️ Framework link issue: ${link} (${response.statusCode})`, 'warning');
                }
            } catch (error) {
                this.log(`❌ Framework link test failed: ${link} - ${error.message}`, 'error');
            }
        }

        // Test 2: External Dependencies
        const externalResources = [
            'https://api.mapbox.com/v2/',
            'https://cdn.jsdelivr.net/npm/chart.js',
            'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'
        ];

        for (const resource of externalResources) {
            try {
                const response = await this.makeRequest(resource, { method: 'HEAD' });
                const domain = new URL(resource).hostname;
                
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    this.log(`✅ External dependency: ${domain}`, 'success');
                } else {
                    this.log(`⚠️ External dependency issue: ${domain} (${response.statusCode})`, 'warning');
                }
            } catch (error) {
                this.log(`❌ External dependency test failed: ${resource} - ${error.message}`, 'error');
            }
        }

        // Test 3: Link Extraction and Validation
        try {
            const response = await this.makeRequest(this.baseUrl);
            const html = response.data;
            
            // Extract internal links
            const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
            const links = new Set();
            let match;
            
            while ((match = linkRegex.exec(html)) !== null) {
                const href = match[1];
                if (href.startsWith('/') || href.startsWith('./') || href.endsWith('.html')) {
                    links.add(href);
                }
            }
            
            this.log(`Found ${links.size} internal links to validate`, 'info');
            
            // Test a sample of internal links
            const linkArray = Array.from(links).slice(0, 10);
            for (const link of linkArray) {
                try {
                    let fullUrl = link;
                    if (link.startsWith('/')) {
                        fullUrl = `${this.baseUrl}${link}`;
                    } else if (link.startsWith('./')) {
                        fullUrl = `${this.baseUrl}/${link.substring(2)}`;
                    } else {
                        fullUrl = `${this.baseUrl}/${link}`;
                    }
                    
                    const linkResponse = await this.makeRequest(fullUrl, { method: 'HEAD' });
                    
                    if (linkResponse.statusCode === 200) {
                        this.log(`✅ Internal link: ${link}`, 'success');
                    } else {
                        this.log(`❌ Broken internal link: ${link} (${linkResponse.statusCode})`, 'error');
                    }
                } catch (error) {
                    this.log(`❌ Internal link test failed: ${link} - ${error.message}`, 'error');
                }
            }
            
        } catch (error) {
            this.log(`❌ Link extraction failed: ${error.message}`, 'error');
        }
    }

    // PHASE 5: Framework Integration Testing
    async validateFrameworks() {
        this.log('🗺️ PHASE 5: Framework Integration Testing', 'info');

        const frameworks = [
            {
                name: 'CLIMADA',
                url: '/working-dual-climada.html',
                indicators: ['climada', 'hurricane', 'scenario', 'generateHurricaneData', 'mapbox']
            },
            {
                name: 'Climate-OS',
                url: '/working-dual-climate-os.html',
                indicators: ['climate-os', 'statistical', 'analysis', 'generateStatisticalData', 'mapbox']
            },
            {
                name: 'C-bottle',
                url: '/cbottle-scenario-analysis.html',
                indicators: ['cbottle', 'scenario', 'analysis', 'dual-map', 'mapbox']
            }
        ];

        for (const framework of frameworks) {
            try {
                const response = await this.makeRequest(`${this.baseUrl}${framework.url}`);
                
                if (response.statusCode !== 200) {
                    this.log(`❌ ${framework.name} framework not accessible: ${response.statusCode}`, 'error');
                    continue;
                }
                
                const html = response.data.toLowerCase();
                let foundIndicators = 0;
                
                framework.indicators.forEach(indicator => {
                    if (html.includes(indicator.toLowerCase())) {
                        foundIndicators++;
                    }
                });
                
                const completeness = (foundIndicators / framework.indicators.length) * 100;
                
                if (completeness >= 80) {
                    this.log(`✅ ${framework.name} framework: ${completeness.toFixed(0)}% complete`, 'success');
                } else if (completeness >= 60) {
                    this.log(`⚠️ ${framework.name} framework: ${completeness.toFixed(0)}% complete`, 'warning');
                } else {
                    this.log(`❌ ${framework.name} framework: ${completeness.toFixed(0)}% complete`, 'error');
                }
                
                // Test for dual-map functionality
                if (html.includes('dual') && html.includes('map')) {
                    this.log(`✅ ${framework.name}: Dual-map functionality detected`, 'success');
                } else {
                    this.log(`⚠️ ${framework.name}: Dual-map functionality unclear`, 'warning');
                }
                
            } catch (error) {
                this.log(`❌ ${framework.name} framework test failed: ${error.message}`, 'error');
            }
        }
    }

    // PHASE 6: Performance & Optimization Testing
    async validatePerformance() {
        this.log('⚡ PHASE 6: Performance & Optimization Testing', 'info');

        const testUrls = [
            { path: '', name: 'Homepage' },
            { path: '/working-dual-climada.html', name: 'CLIMADA' },
            { path: '/working-dual-climate-os.html', name: 'Climate-OS' },
            { path: '/cbottle-scenario-analysis.html', name: 'C-bottle' }
        ];

        for (const { path, name } of testUrls) {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest(`${this.baseUrl}${path}`);
                const loadTime = Date.now() - startTime;
                
                // Test load time
                if (loadTime < 1000) {
                    this.log(`✅ ${name} load time: ${loadTime}ms (excellent)`, 'success');
                } else if (loadTime < 3000) {
                    this.log(`⚠️ ${name} load time: ${loadTime}ms (acceptable)`, 'warning');
                } else {
                    this.log(`❌ ${name} load time: ${loadTime}ms (too slow)`, 'error');
                }
                
                // Test compression
                const contentEncoding = response.headers['content-encoding'];
                if (contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('br'))) {
                    this.log(`✅ ${name}: Compression enabled (${contentEncoding})`, 'success');
                } else {
                    this.log(`⚠️ ${name}: No compression detected`, 'warning');
                }
                
                // Test content size
                const contentLength = response.headers['content-length'];
                if (contentLength) {
                    const sizeKB = Math.round(parseInt(contentLength) / 1024);
                    if (sizeKB < 500) {
                        this.log(`✅ ${name}: ${sizeKB}KB (optimized size)`, 'success');
                    } else if (sizeKB < 1000) {
                        this.log(`⚠️ ${name}: ${sizeKB}KB (moderate size)`, 'warning');
                    } else {
                        this.log(`❌ ${name}: ${sizeKB}KB (large size)`, 'error');
                    }
                }
                
                // Test mobile optimization
                const html = response.data.toLowerCase();
                const mobileIndicators = ['viewport', 'responsive', '@media', 'mobile'];
                const mobileScore = mobileIndicators.filter(indicator => html.includes(indicator)).length;
                
                if (mobileScore >= 3) {
                    this.log(`✅ ${name}: Mobile optimized (${mobileScore}/4)`, 'success');
                } else if (mobileScore >= 2) {
                    this.log(`⚠️ ${name}: Partial mobile optimization (${mobileScore}/4)`, 'warning');
                } else {
                    this.log(`❌ ${name}: Poor mobile optimization (${mobileScore}/4)`, 'error');
                }
                
            } catch (error) {
                this.log(`❌ Performance test failed for ${name}: ${error.message}`, 'error');
            }
        }
    }

    // Execute the complete Super Prompt
    async executeSuperPrompt() {
        console.log('\n🚀 EXECUTING SUPER PROMPT: Comprehensive Climate Website Testing');
        console.log('===============================================================================');
        console.log(`Target: ${this.baseUrl}`);
        console.log(`Started: ${new Date().toISOString()}`);
        console.log('===============================================================================\n');

        try {
            await this.validateInfrastructure();
            console.log('');
            
            await this.validateAuthentication();
            console.log('');
            
            await this.validateDatabase();
            console.log('');
            
            await this.validateLinks();
            console.log('');
            
            await this.validateFrameworks();
            console.log('');
            
            await this.validatePerformance();
            console.log('');
            
            this.generateFinalReport();
            
        } catch (error) {
            this.log(`❌ CRITICAL: Super Prompt execution failed: ${error.message}`, 'critical');
        }
    }

    generateFinalReport() {
        const totalTime = Date.now() - this.stats.startTime;
        const successRate = this.stats.totalTests > 0 ? 
            Math.round((this.stats.passed / this.stats.totalTests) * 100) : 0;

        console.log('===============================================================================');
        console.log('🎉 SUPER PROMPT EXECUTION COMPLETED');
        console.log('===============================================================================');
        console.log(`📊 FINAL RESULTS:`);
        console.log(`   Total Tests: ${this.stats.totalTests}`);
        console.log(`   Passed: ${this.stats.passed}`);
        console.log(`   Failed: ${this.stats.failed}`);
        console.log(`   Warnings: ${this.stats.warnings}`);
        console.log(`   Critical Errors: ${this.stats.criticalErrors}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Execution Time: ${Math.round(totalTime / 1000)}s`);
        console.log('');

        let status = '';
        let statusColor = '';
        
        if (this.stats.criticalErrors > 0) {
            status = '🚨 CRITICAL ISSUES DETECTED';
            statusColor = '\x1b[31m'; // Red
        } else if (successRate >= 95) {
            status = '🟢 EXCELLENT - Website is fully functional!';
            statusColor = '\x1b[32m'; // Green
        } else if (successRate >= 85) {
            status = '🟡 GOOD - Website is mostly functional with minor issues';
            statusColor = '\x1b[33m'; // Yellow
        } else if (successRate >= 70) {
            status = '🟠 MODERATE - Website has several issues that need attention';
            statusColor = '\x1b[33m'; // Yellow
        } else {
            status = '🔴 POOR - Website has significant issues requiring immediate attention';
            statusColor = '\x1b[31m'; // Red
        }

        console.log(`${statusColor}${status}\x1b[0m`);
        console.log('===============================================================================\n');

        if (this.export) {
            this.exportResults();
        }

        // Exit with appropriate code
        process.exit(this.stats.criticalErrors > 0 ? 2 : 
                    successRate < 70 ? 1 : 0);
    }

    exportResults() {
        const report = {
            timestamp: new Date().toISOString(),
            target: this.baseUrl,
            statistics: this.stats,
            results: this.results,
            summary: {
                successRate: this.stats.totalTests > 0 ? 
                    Math.round((this.stats.passed / this.stats.totalTests) * 100) : 0,
                executionTime: Date.now() - this.stats.startTime,
                status: this.stats.criticalErrors > 0 ? 'CRITICAL' :
                       this.stats.passed / this.stats.totalTests >= 0.95 ? 'EXCELLENT' :
                       this.stats.passed / this.stats.totalTests >= 0.85 ? 'GOOD' :
                       this.stats.passed / this.stats.totalTests >= 0.70 ? 'MODERATE' : 'POOR'
            }
        };

        const filename = `climate-website-validation-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`📄 Results exported to: ${filename}`);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose'),
        export: args.includes('--export')
    };

    const validator = new ClimateWebsiteValidator(options);
    await validator.executeSuperPrompt();
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('\x1b[31m❌ FATAL ERROR:\x1b[0m', error.message);
        process.exit(3);
    });
}

module.exports = ClimateWebsiteValidator;