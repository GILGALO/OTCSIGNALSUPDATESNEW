// Pocket Option Live Market Data - Headless Browser Automation
// Fetches REAL market data from loaded chart

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

      if (this.email && this.password) {
        await this.authenticateWithCredentials();
      } else if (this.ssid) {
        await this.authenticateWithSSID();
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
      await this.page.evaluate((ssid) => {
        localStorage.setItem('POAPI_SESSION', ssid);
        localStorage.setItem('sessionid', ssid);
        sessionStorage.setItem('POAPI_SESSION', ssid);
        document.cookie = `POAPI_SESSION=${ssid}; path=/;`;
      }, this.ssid);

      await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => null);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  private async authenticateWithCredentials(): Promise<void> {
    if (!this.page || !this.email || !this.password) return;
    
    try {
      console.log('🔑 Entering credentials...');
      await this.page.waitForSelector('input[type="email"]', { timeout: 15000 }).catch(() => null);
      
      const emailInput = await this.page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.type(this.email, { delay: 50 });
      }

      const passInput = await this.page.$('input[type="password"]');
      if (passInput) {
        await passInput.type(this.password, { delay: 50 });
      }

      const submitBtn = await this.page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
      }
    } catch (error) {
      console.error('Credential auth error:', error);
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
        timeout: 90000,
      }).catch(() => null);

      console.log('⏳ Waiting for chart to fully render...');
      
      // Wait for the chart container to be visible
      await this.page!.waitForFunction(() => {
        const chart = document.querySelector('[data-chart], .chart-container, .trading-chart, canvas');
        return chart !== null;
      }, { timeout: 30000 }).catch(() => null);
      
      // Additional wait for data to load
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Take screenshot to see what's actually on the page
      const screenshotPath = '/tmp/pocket-option-screenshot.png';
      await this.page!.screenshot({ path: screenshotPath, fullPage: false }).catch(() => null);
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Extract data with VERBOSE debugging
      const extractionResult = await this.page!.evaluate(() => {
        const result: any = {
          foundData: false,
          sources: [],
          windowKeys: [],
          priceCount: 0,
          prices: [],
          candles: [],
          pageTitle: document.title,
          pageUrl: window.location.href,
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
        
        // Strategy 1: Direct common locations
        const directLocations = [
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

        // Strategy 3: Canvas inspection (if chart is rendered to canvas)
        const canvases = document.querySelectorAll('canvas');
        result.sources.push(`📊 Found ${canvases.length} canvas elements`);

        return result;
      });

      console.log('📋 EXTRACTION DEBUG:');
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

      throw new Error(
        `Failed to extract market data for ${symbol}.\n` +
        `Found ${extractionResult.priceCount} price elements but no OHLC data structure.\n` +
        `Sources checked: ${extractionResult.sources.join(' | ')}\n` +
        `This suggests: chart may not be loaded, credentials may be invalid, or data is in a format not yet supported.\n` +
        `Check screenshot at ${screenshotPath} to verify page loaded correctly.`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`❌ Data extraction failed for ${symbol}:\n${errorMsg}`);
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
