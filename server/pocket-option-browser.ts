// Pocket Option Live Market Data - Headless Browser Automation with Demo Fallback
// Fetches REAL market data from loaded chart, falls back to realistic demo data if unavailable

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { generateDemoM5Candles } from './market-data-generator';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PocketOptionBrowserClient {
  private static instance: Browser | null = null;
  private static isLaunching = false;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private email: string | null = null;
  private password: string | null = null;
  private ssid: string | null = null;
  private isConnected = false;
  private lastAccess = Date.now();

  constructor(ssid?: string, email?: string, password?: string) {
    this.ssid = ssid || null;
    this.email = email || process.env.POCKET_OPTION_EMAIL || null;
    this.password = password || process.env.POCKET_OPTION_PASSWORD || null;
    console.log(`🔧 Browser Client initialized (Email: ${this.email ? 'YES (Env/Input)' : 'NO'}, SSID: ${this.ssid ? 'YES' : 'NO'})`);
  }

  private async getBrowser(): Promise<Browser> {
    if (PocketOptionBrowserClient.instance) {
      try {
        await PocketOptionBrowserClient.instance.version();
        return PocketOptionBrowserClient.instance;
      } catch (e) {
        PocketOptionBrowserClient.instance = null;
      }
    }

    if (PocketOptionBrowserClient.isLaunching) {
      while (PocketOptionBrowserClient.isLaunching) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (PocketOptionBrowserClient.instance) return PocketOptionBrowserClient.instance;
    }

    PocketOptionBrowserClient.isLaunching = true;
    try {
      const isRender = process.env.RENDER === 'true';
      const chromePath = isRender ? '/opt/render/project/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome' : undefined;

      console.log('🌐 Launching singleton headless browser...');
      
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
          '--js-flags="--max-old-space-size=128"',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ]
      });

      PocketOptionBrowserClient.instance = browser;
      return browser;
    } finally {
      PocketOptionBrowserClient.isLaunching = false;
    }
  }

  async connect(): Promise<boolean> {
    try {
      this.lastAccess = Date.now();
      
      if (this.isConnected && this.page) {
        try {
          await this.page.evaluate(() => 1);
          return true;
        } catch (e) {
          this.isConnected = false;
        }
      }

      this.browser = await this.getBrowser();
      
      const pages = await this.browser.pages();
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close().catch(() => {});
      }

      this.page = pages[0] || await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 800 });
      
      // Clear previous listeners
      this.page.removeAllListeners('request');
      await this.page.setRequestInterception(true);
      
      this.page.on('request', (req) => {
        if (req.isInterceptResolutionHandled()) return;
        
        const type = req.resourceType();
        // Only block images and media to speed up page load, but allow stylesheets and scripts
        if (['image', 'media'].includes(type)) {
          req.abort().catch(() => {});
        } else {
          req.continue().catch(() => {});
        }
      });

      console.log('📱 Navigating to Pocket Option...');
      await this.page.goto('https://pocketoption.com/en/login', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      });

      // Check if already logged in
      const initialUrl = this.page.url();
      const initialTitle = await this.page.title();
      if (!initialUrl.includes('login')) {
        console.log('✅ Already logged in - skipping authentication');
        this.isConnected = true;
        return true;
      }

      // Proceed with authentication
      if (this.email && this.password) {
        console.log('🔄 Authenticating with email/password...');
        await this.authenticateWithCredentials();
      } else if (this.ssid) {
        console.log('🔄 Authenticating with SSID token...');
        await this.authenticateWithSSID();
      } else {
        console.warn('⚠️ No credentials provided (email/password or SSID)');
      }

      this.isConnected = true;
      console.log('✅ Browser connected');
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  private async authenticateWithSSID(): Promise<void> {
    if (!this.page || !this.ssid) return;
    
    try {
      console.log('🔐 Setting SSID authentication...');
      await this.page.evaluate((ssid) => {
        localStorage.setItem('POAPI_SESSION', ssid);
        localStorage.setItem('sessionid', ssid);
        localStorage.setItem('poapi_token', ssid);
        sessionStorage.setItem('POAPI_SESSION', ssid);
        sessionStorage.setItem('sessionid', ssid);
        document.cookie = `POAPI_SESSION=${ssid}; path=/; SameSite=Lax`;
        document.cookie = `sessionid=${ssid}; path=/; SameSite=Lax`;
      }, this.ssid);

      console.log('✓ SSID set in storage and cookies');
      
      // Navigate to trading page to verify SSID works
      await this.page.goto('https://pocketoption.com/en/otc/trade/EUR_USD', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      }).catch(() => null);
      
      const pageUrl = this.page.url();
      const pageTitle = await this.page.title();
      console.log(`📄 Post-SSID: Title="${pageTitle}", URL="${pageUrl}"`);
      
      if (!pageUrl.includes('login')) {
        console.log('✅ SSID authentication appears successful');
      } else {
        console.warn('⚠️ SSID may be invalid - still on login page');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('❌ SSID auth error:', error);
    }
  }

  private async authenticateWithCredentials(): Promise<void> {
    if (!this.page || !this.email || !this.password) return;
    
    try {
      console.log('🔑 Entering credentials...');
      
      // Wait for email input field - be patient
      try {
        await this.page.waitForSelector('input[type="email"], input[placeholder*="email"], input[name*="email"]', { timeout: 20000 });
      } catch {
        console.warn('⚠️ Timeout waiting for email input - form may not be loaded');
      }
      
      // Find and fill email field
      const emailInput = await this.page.$('input[type="email"], input[placeholder*="email"], input[name*="email"]') as any;
      if (emailInput) {
        await emailInput.click({ delay: 100 });
        await emailInput.evaluate((el: HTMLInputElement) => el.value = '');
        await emailInput.type(this.email, { delay: 50 });
        console.log('✓ Email entered');
      } else {
        console.warn('⚠️ Email input not found - form may still be loading');
        return;
      }

      // Small delay between fields
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find and fill password field
      const passInput = await this.page.$('input[type="password"], input[placeholder*="password"], input[name*="password"]') as any;
      if (passInput) {
        await passInput.click({ delay: 100 });
        await passInput.evaluate((el: HTMLInputElement) => el.value = '');
        await passInput.type(this.password, { delay: 50 });
        console.log('✓ Password entered');
      } else {
        console.warn('⚠️ Password input not found');
        return;
      }

      // Delay before submission
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find and click submit button - try multiple selectors
      let submitBtn: any = await this.page.$('button[type="submit"]');
      if (!submitBtn) {
        submitBtn = await this.page.$('[class*="submit"], [class*="login"], button:not([class*="close"])');
      }
      if (!submitBtn) {
        const allButtons = await this.page.$$('button');
        for (const btn of allButtons) {
          const text = await btn.evaluate(el => el.textContent?.toLowerCase());
          const isVisible = await btn.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          if (isVisible && text && (text.includes('login') || text.includes('sign in') || text.includes('enter') || text.includes('submit'))) {
            submitBtn = btn;
            break;
          }
        }
      }

      if (submitBtn) {
        console.log('🔐 Submitting login form...');
        
        // Try clicking the button
        try {
          await submitBtn.click();
        } catch (e) {
          // If click fails, try pressing Enter in password field
          console.log('⚠️ Button click failed, trying Enter key');
          await passInput?.press('Enter').catch(() => {});
        }
        
        // Wait for navigation or content change with longer timeout
        let loginSuccess = false;
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
          loginSuccess = true;
          console.log('✓ Login navigation complete');
        } catch (navErr) {
          console.log('⚠️ Navigation timeout - checking if content changed...');
          
          // Check if page content changed (even without explicit navigation)
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const currentUrl = this.page.url();
          const pageChanged = !currentUrl.includes('/en/login') || !currentUrl.includes('login');
          if (pageChanged) {
            console.log('✓ Page content appears to have changed');
            loginSuccess = true;
          }
        }
        
        // Verify login succeeded by checking page state
        const pageTitle = await this.page.title();
        const pageUrl = this.page.url();
        console.log(`📄 Post-login: Title="${pageTitle}", URL="${pageUrl}"`);
        
        if (!pageUrl.includes('login') || loginSuccess) {
          console.log('✅ Login appears successful - redirected away from login page');
        } else {
          console.error('❌ Login FAILED - still on login page. Check credentials (email/password may be invalid)');
          // Try to capture any error messages on the page
          const errorMsgs = await this.page.$$eval('[class*="error"], [class*="alert"], .message', els => 
            els.map(el => el.textContent).filter(t => t && t.trim())
          ).catch(() => []);
          if (errorMsgs.length > 0) {
            console.error('📌 Error messages on page:', errorMsgs.join(' | '));
          }
        }
      } else {
        console.error('❌ Login button not found - form may not be present');
      }
    } catch (error) {
      console.error('❌ Credential auth error:', error);
    }
  }

  async getM5Candles(symbol: string, count: number = 50): Promise<CandleData[]> {
    this.lastAccess = Date.now();
    if (!this.isConnected || !this.page) {
      await this.connect();
    }

    try {
      const tradingUrl = `https://pocketoption.com/en/otc/trade/${symbol.replace('/', '_')}`;
      console.log(`🔗 Loading Chart: ${tradingUrl}`);
      
      await this.page!.goto(tradingUrl, {
        waitUntil: 'networkidle2',
        timeout: 45000,
      }).catch(() => null);

      console.log('⏳ Waiting for chart to fully render...');
      
      // Wait for the chart container to be visible with shorter timeout
      await this.page!.waitForFunction(() => {
        const chart = document.querySelector('[data-chart], .chart-container, .trading-chart, canvas');
        return chart !== null;
      }, { timeout: 15000 }).catch(() => null);
      
      // Shorter wait for data to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshot to see what's actually on the page
      const screenshotPath = '/tmp/pocket-option-screenshot.png';
      await this.page!.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Extract data with VERBOSE debugging
      const extractionResult: any = await this.page!.evaluate(() => {
        const result: any = {
          foundData: false,
          sources: [],
          windowKeys: [],
          priceCount: 0,
          prices: [],
          candles: [],
          pageTitle: document.title,
          pageUrl: window.location.href,
          pairFormatsFound: [],
        };

        // Find ALL numeric prices in the page - expanded pattern
        const pricePatterns = [
          /^\d+\.\d{4,5}$/,  // 1.23456
          /^\d+\.\d{1,6}$/,  // Any decimal price
          /^\d{1,6}$/,        // Whole numbers
        ];
        
        const allElements = Array.from(document.querySelectorAll('*'));
        const priceElements = allElements
          .filter(el => {
            const text = (el.textContent || '').trim();
            if (!text) return false;
            // Must be short enough to be a price
            if (text.length > 30) return false;
            return pricePatterns.some(p => p.test(text));
          })
          .map(el => {
            const text = (el.textContent || '').trim();
            const num = parseFloat(text);
            return !isNaN(num) && num > 0 && num < 10000 ? num : null;
          })
          .filter(p => p !== null) as number[];

        const uniquePrices = Array.from(new Set(priceElements)).sort((a, b) => a - b);
        result.priceCount = priceElements.length;
        result.prices = uniquePrices.slice(0, 50); // First 50 unique prices

        // Search window globals more thoroughly
        const windowObj = window as any;
        
        // Strategy 1: Direct common locations - Including Pocket Option specific paths
        const directLocations = [
          // Pocket Option specific locations
          { path: 'PocketOption.chart.candles', label: 'PocketOption chart' },
          { path: 'PocketOption.chartData', label: 'PocketOption chartData' },
          { path: 'pocketOption.candles', label: 'pocketOption candles' },
          { path: 'po.chart.candles', label: 'po.chart.candles' },
          { path: 'chart.candles', label: 'chart.candles' },
          { path: 'chartCandles', label: 'chartCandles' },
          { path: 'allCandles', label: 'allCandles' },
          { path: 'tradingData.candles', label: 'tradingData' },
          // Standard locations
          { path: 'TradingView.chart.getVisibleRange', label: 'TradingView (direct)' },
          { path: '__STORE__.getState().chart.candles', label: 'Redux Store' },
          { path: 'chartData.candles', label: 'chartData' },
          { path: 'candleData', label: 'candleData' },
          { path: 'ohlc', label: 'ohlc' },
          { path: 'marketData.candles', label: 'marketData' },
          { path: 'bars', label: 'bars' },
          { path: 'prices', label: 'prices' },
          { path: 'PoChart.candles', label: 'PoChart' },
          { path: '__APP_DATA__', label: '__APP_DATA__' },
          { path: '__INITIAL_STATE__', label: '__INITIAL_STATE__' },
          { path: 'app.store', label: 'app.store' },
          { path: 'state.chart.candles', label: 'state.chart.candles' },
        ];

        for (const loc of directLocations) {
          try {
            let obj = windowObj;
            for (const key of loc.path.split('.')) {
              obj = obj?.[key];
            }
            if (Array.isArray(obj) && obj.length > 0) {
              result.sources.push(`✅ ${loc.label}: ${obj.length} items`);
              if (obj[0]?.close || obj[0]?.c) {
                result.candles = obj;
                result.foundData = true;
              }
            }
          } catch (e) {
            // Continue
          }
        }

        // Strategy 2: Search ALL window properties for OHLC data
        const allKeys = Object.keys(windowObj);
        result.windowKeys = allKeys.slice(0, 50); // Log first 50 keys

        for (const key of allKeys) {
          try {
            const obj = windowObj[key];
            
            // Check if it's an array of candles
            if (Array.isArray(obj) && obj.length >= 26) {
              const first = obj[0];
              if ((first?.open !== undefined || first?.o !== undefined) &&
                  (first?.close !== undefined || first?.c !== undefined) &&
                  (first?.high !== undefined || first?.h !== undefined) &&
                  (first?.low !== undefined || first?.l !== undefined)) {
                result.sources.push(`✅ window.${key}: Found ${obj.length} candles!`);
                result.candles = obj;
                result.foundData = true;
                break;
              }
            }
          } catch (e) {
            // Continue
          }
        }

        // Strategy 4: Canvas inspection (if chart is rendered to canvas)
        const canvases = document.querySelectorAll('canvas');
        result.sources.push(`📊 Found ${canvases.length} canvas elements`);

        return result;
      });

      console.log('📋 EXTRACTION DEBUG:');
      console.log(`   - Pair formats tried: ${extractionResult.pairFormatsFound.join(', ') || 'None found'}`);
      console.log(`   - Price elements found: ${extractionResult.priceCount}`);
      console.log(`   - Unique prices: ${extractionResult.prices.slice(0, 10).join(', ')}`);
      console.log(`   - Data sources found: ${extractionResult.sources.join(' | ')}`);
      console.log(`   - Window keys (sample): ${extractionResult.windowKeys.slice(0, 10).join(', ')}`);

      if (extractionResult.candles.length > 0) {
        const candles = extractionResult.candles.map((c: any) => ({
          timestamp: Math.floor((c.time || c.timestamp || c.t || Date.now()) / (c.time && c.time > 1e10 ? 1000 : 1)),
          open: parseFloat(c.open || c.o || 0),
          high: parseFloat(c.high || c.h || 0),
          low: parseFloat(c.low || c.l || 0),
          close: parseFloat(c.close || c.c || 0),
          volume: parseFloat(c.volume || c.v || 5000),
        })).filter((c: any) => c.open > 0 && c.close > 0);

        if (candles.length >= 26) {
          console.log(`✅ SUCCESS: Extracted ${candles.length} real candles for ${symbol}`);
          return candles.slice(-count);
        }
      }

      // If we found prices but no structured candles, create synthetic candles from prices
      if (extractionResult.prices.length >= 26) {
        console.log(`⚠️ Found ${extractionResult.prices.length} prices, creating structured candles...`);
        const prices = extractionResult.prices.slice(-50);
        const candles = prices.map((price: number, i: number) => ({
          timestamp: Math.floor((Date.now() - (50 - i) * 5 * 60 * 1000) / 1000),
          open: price,
          high: price * 1.0001,
          low: price * 0.9999,
          close: price,
          volume: 5000,
        }));
        console.log(`📊 Created ${candles.length} candles from extracted prices`);
        return candles;
      }

      console.warn(`⚠️ Real data extraction failed, using demo mode fallback...`);
      return generateDemoM5Candles(symbol, count);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Error in chart extraction: ${errorMsg}`);
      console.log(`📊 Falling back to demo market data for ${symbol}...`);
      return generateDemoM5Candles(symbol, count);
    }
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch (error) {
      console.error(`Error getting current price: ${error}`);
      return null;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.isConnected = false;
      console.log('🔌 Browser connection closed');
    }
  }
}

let globalBrowser: PocketOptionBrowserClient | null = null;

export async function getPocketOptionBrowserClient(
  ssid: string,
  email?: string,
  password?: string
): Promise<PocketOptionBrowserClient> {
  if (globalBrowser) {
    return globalBrowser;
  }

  const client = new PocketOptionBrowserClient(ssid, email, password);
  const connected = await client.connect();
  
  if (!connected) {
    throw new Error('Failed to connect to Pocket Option');
  }

  globalBrowser = client;
  return client;
}
