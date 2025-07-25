import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { chromium } from 'playwright';

const thresholds = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  pwa: 80
};

test.describe('Performance Tests - Lighthouse Audits', () => {
  test('homepage meets performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:8888/');
    
    const result = await playAudit({
      page,
      thresholds,
      port: 9222,
      reports: {
        formats: {
          html: true,
          json: true
        },
        name: 'homepage-lighthouse-report',
        directory: 'test-results/lighthouse'
      }
    });
    
    await browser.close();
    
    // Verify all scores meet thresholds
    expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(thresholds.performance);
    expect(result.lhr.categories.accessibility.score * 100).toBeGreaterThanOrEqual(thresholds.accessibility);
    expect(result.lhr.categories['best-practices'].score * 100).toBeGreaterThanOrEqual(thresholds['best-practices']);
    expect(result.lhr.categories.seo.score * 100).toBeGreaterThanOrEqual(thresholds.seo);
  });

  test('chat interface performs well under load', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9223'],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:8888/chat/1'); // Assuming tool ID 1 exists
    
    const result = await playAudit({
      page,
      thresholds: {
        performance: 85, // Slightly lower for interactive page
        accessibility: 95,
        'best-practices': 90,
        seo: 85
      },
      port: 9223
    });
    
    await browser.close();
    
    expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(85);
  });

  test('admin dashboard maintains performance', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9224'],
      headless: true
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:8888/admin');
    
    const result = await playAudit({
      page,
      thresholds: {
        performance: 85,
        accessibility: 95,
        'best-practices': 90,
        seo: 85
      },
      port: 9224
    });
    
    await browser.close();
    
    expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(85);
  });
});

test.describe('Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('LCP (Largest Contentful Paint) is under 2.5s', async ({ page }) => {
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500);
  });

  test('FID (First Input Delay) is under 100ms', async ({ page }) => {
    // Simulate user interaction
    await page.click('button:first-of-type');
    
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[0].processingStart - entries[0].startTime);
          }
        }).observe({ entryTypes: ['first-input'] });
      });
    });
    
    expect(fid).toBeLessThan(100);
  });

  test('CLS (Cumulative Layout Shift) is under 0.1', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    const cls = await page.evaluate(() => {
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
      
      return clsScore;
    });
    
    expect(cls).toBeLessThan(0.1);
  });
});

test.describe('Resource Loading Performance', () => {
  test('critical CSS is inlined or loaded quickly', async ({ page }) => {
    const resourceTimings = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.includes('.css'))
        .map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize
        }));
    });
    
    // Critical CSS should load within 100ms
    const criticalCSS = resourceTimings.filter(r => 
      r.name.includes('tokens.css') || 
      r.name.includes('reset.css') ||
      r.name.includes('app.css')
    );
    
    for (const css of criticalCSS) {
      expect(css.duration).toBeLessThan(100);
    }
  });

  test('JavaScript bundles are reasonably sized', async ({ page }) => {
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.includes('.js'))
        .map(r => ({
          name: r.name,
          size: r.transferSize
        }));
    });
    
    // No single JS bundle should exceed 300KB
    for (const js of jsResources) {
      expect(js.size).toBeLessThan(300 * 1024);
    }
    
    // Total JS size should be under 1MB
    const totalJSSize = jsResources.reduce((sum, js) => sum + js.size, 0);
    expect(totalJSSize).toBeLessThan(1024 * 1024);
  });

  test('images are optimized and lazy loaded', async ({ page }) => {
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        width: img.naturalWidth,
        height: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height
      }))
    );
    
    for (const img of images) {
      // Images should have loading attribute
      if (!img.src.includes('avatar') && !img.src.includes('icon')) {
        expect(img.loading).toBe('lazy');
      }
      
      // Images shouldn't be oversized for their display size
      if (img.displayWidth > 0) {
        const sizeRatio = img.width / img.displayWidth;
        expect(sizeRatio).toBeLessThan(2); // Max 2x for retina
      }
    }
  });
});

test.describe('Animation Performance', () => {
  test('animations run at 60fps', async ({ page }) => {
    await page.goto('/');
    
    // Trigger some animations
    await page.hover('.floating-card:first-of-type');
    
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        let lastTime = performance.now();
        
        function countFrames() {
          frames++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            resolve(frames);
          } else {
            requestAnimationFrame(countFrames);
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    expect(fps).toBeGreaterThanOrEqual(55); // Allow slight variance
  });

  test('no layout thrashing during animations', async ({ page }) => {
    await page.goto('/');
    
    const layoutsPerFrame = await page.evaluate(() => {
      const layouts = [];
      let frameLayouts = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            frameLayouts++;
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Trigger animation
      document.querySelector('.floating-card')?.classList.add('hover');
      
      return new Promise((resolve) => {
        let frameCount = 0;
        function checkFrame() {
          layouts.push(frameLayouts);
          frameLayouts = 0;
          frameCount++;
          
          if (frameCount < 60) {
            requestAnimationFrame(checkFrame);
          } else {
            observer.disconnect();
            resolve(layouts);
          }
        }
        requestAnimationFrame(checkFrame);
      });
    });
    
    // Should have minimal layout recalculations per frame
    const avgLayoutsPerFrame = layoutsPerFrame.reduce((a, b) => a + b, 0) / layoutsPerFrame.length;
    expect(avgLayoutsPerFrame).toBeLessThan(2);
  });
});

test.describe('Memory Performance', () => {
  test('no memory leaks in chat interface', async ({ page }) => {
    await page.goto('/chat/1');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Simulate chat activity
    for (let i = 0; i < 50; i++) {
      await page.type('textarea', `Test message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check memory after activity
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory increase should be reasonable (less than 10MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});

test.describe('Network Performance', () => {
  test('implements effective caching strategies', async ({ page }) => {
    // First visit
    await page.goto('/');
    
    const firstLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });
    
    // Second visit
    await page.reload();
    
    const cachedResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(r => r.transferSize === 0).length;
    });
    
    // At least 50% of resources should be cached
    expect(cachedResources).toBeGreaterThan(firstLoadResources * 0.5);
  });

  test('uses HTTP/2 or HTTP/3 when available', async ({ page }) => {
    const response = await page.goto('/');
    const protocol = response?.request().response()?.headers()['protocol'];
    
    // Should use HTTP/2 or higher
    expect(['h2', 'h3', 'http/2', 'http/3']).toContain(protocol?.toLowerCase());
  });
});