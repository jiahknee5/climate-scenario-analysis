#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

class ClimateWebsiteValidator {
    constructor() {
        this.baseUrl = 'https://climate.johnnycchung.com';
        this.results = [];
        this.stats = { total: 0, passed: 0, failed: 0 };
    }

    log(message, status = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${status.toUpperCase()}: ${message}`);
        
        this.results.push({ timestamp, message, status });
        this.stats.total++;
        if (status === 'success') this.stats.passed++;
        else if (status === 'error') this.stats.failed++;
    }

    async makeRequest(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const parsedUrl = new URL(url);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: 443,
                path: parsedUrl.pathname,
                method: 'HEAD',
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                const endTime = Date.now();
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    responseTime: endTime - startTime,
                    url: url
                });
            });

            req.on('error', (error) => {
                resolve({
                    statusCode: 0,
                    error: error.message,
                    url: url
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    statusCode: 0,
                    error: 'Request timeout',
                    url: url
                });
            });

            req.end();
        });
    }

    async testFrameworkLinks() {
        this.log('Testing all framework links...', 'info');
        
        const frameworkLinks = [
            '/climada-hurricane-analysis',
            '/climate-os-statistical', 
            '/cbottle-risk-assessment',
            '/cbottle-scenario-analysis',
            '/climada-dual-map-analysis',
            '/climate-os-dual-statistical',
            '/framework-comparison'
        ];

        let workingLinks = 0;

        for (const link of frameworkLinks) {
            const fullUrl = `${this.baseUrl}${link}`;
            const response = await this.makeRequest(fullUrl);
            const linkName = link.replace('/', '');

            if (response.statusCode === 200) {
                this.log(`✅ ${linkName}: OK (${response.responseTime}ms)`, 'success');
                workingLinks++;
            } else if (response.statusCode === 308) {
                this.log(`⚠️ ${linkName}: Redirect ${response.statusCode}`, 'warning'); 
                workingLinks++; // Still accessible
            } else {
                this.log(`❌ ${linkName}: Failed ${response.statusCode}`, 'error');
            }
        }

        const successRate = Math.round((workingLinks / frameworkLinks.length) * 100);
        this.log(`Framework Links: ${workingLinks}/${frameworkLinks.length} (${successRate}%)`, 'info');
        return successRate;
    }

    async testSecurityHeaders() {
        this.log('Testing security headers...', 'info');
        
        const response = await this.makeRequest(this.baseUrl);
        const headers = response.headers || {};
        
        const securityHeaders = [
            'strict-transport-security',
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'content-security-policy',
            'referrer-policy'
        ];

        let presentHeaders = 0;
        
        for (const header of securityHeaders) {
            if (headers[header]) {
                this.log(`✅ Security header present: ${header}`, 'success');
                presentHeaders++;
            } else {
                this.log(`❌ Security header missing: ${header}`, 'error');
            }
        }

        const securityScore = Math.round((presentHeaders / securityHeaders.length) * 100);
        this.log(`Security Headers: ${presentHeaders}/${securityHeaders.length} (${securityScore}%)`, 'info');
        return securityScore;
    }

    async testPerformance() {
        this.log('Testing performance...', 'info');
        
        const testPages = ['', '/climada-dual-map-analysis', '/climate-os-dual-statistical'];
        let totalTime = 0;
        let pageCount = 0;

        for (const page of testPages) {
            const response = await this.makeRequest(`${this.baseUrl}${page}`);
            if (response.responseTime) {
                totalTime += response.responseTime;
                pageCount++;
                
                const pageName = page || 'homepage';
                if (response.responseTime < 1000) {
                    this.log(`✅ ${pageName}: Fast ${response.responseTime}ms`, 'success');
                } else if (response.responseTime < 2000) {
                    this.log(`⚠️ ${pageName}: Moderate ${response.responseTime}ms`, 'warning');
                } else {
                    this.log(`❌ ${pageName}: Slow ${response.responseTime}ms`, 'error');
                }
            }
        }

        const avgTime = pageCount > 0 ? Math.round(totalTime / pageCount) : 0;
        this.log(`Average Load Time: ${avgTime}ms`, 'info');
        return avgTime;
    }

    async runCompleteValidation() {
        this.log('🚀 Starting comprehensive website validation...', 'info');
        
        const frameworkScore = await this.testFrameworkLinks();
        const securityScore = await this.testSecurityHeaders();
        const avgLoadTime = await this.testPerformance();
        
        // Calculate overall health score
        const performanceScore = avgLoadTime < 1000 ? 100 : avgLoadTime < 2000 ? 75 : avgLoadTime < 3000 ? 50 : 25;
        const overallScore = Math.round((frameworkScore + securityScore + performanceScore) / 3);
        
        this.log('', 'info');
        this.log('=== FINAL VALIDATION RESULTS ===', 'info');
        this.log(`Framework Links: ${frameworkScore}%`, 'info');
        this.log(`Security Headers: ${securityScore}%`, 'info');
        this.log(`Performance Score: ${performanceScore}% (${avgLoadTime}ms avg)`, 'info');
        this.log(`Overall Health Score: ${overallScore}%`, 'info');
        this.log('', 'info');
        
        if (overallScore >= 90) {
            this.log('🟢 EXCELLENT: Website is in excellent health!', 'success');
        } else if (overallScore >= 75) {
            this.log('🟡 GOOD: Website is healthy with minor areas for improvement', 'success');
        } else if (overallScore >= 60) {
            this.log('🟠 MODERATE: Website needs attention in some areas', 'warning');
        } else {
            this.log('🔴 CRITICAL: Website has significant health issues', 'error');
        }
        
        this.log('', 'info');
        this.log(`Test Summary: ${this.stats.passed}/${this.stats.total} passed`, 'info');
        
        return {
            overallScore,
            frameworkScore,
            securityScore,
            performanceScore: avgLoadTime,
            stats: this.stats
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ClimateWebsiteValidator();
    validator.runCompleteValidation().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ClimateWebsiteValidator;