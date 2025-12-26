// Pocket Option Live Market Data - Headless Browser Automation
// Fetches REAL market data directly from Pocket Option website ONLY

import puppeteer, { Browser, Page } from 'puppeteer';

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
          '--disable-features=IsolateOrigins,site-per-process,Translate,PasswordImport,Autofill',
          '--disable-ipc-flooding-protection',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-pings'
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
      
      // Clear previous listeners to avoid "Request is already handled" error
      this.page.removeAllListeners('request');
      await this.page.setRequestInterception(true);
      
      this.page.on('request', (req) => {
        if (req.isInterceptResolutionHandled()) return;
        
        const type = req.resourceType();
        if (['image', 'media', 'font', 'stylesheet', 'other'].includes(type)) {
          req.abort().catch(() => {});
        } else {
          req.continue().catch(() => {});
        }
      });

      console.log('📱 Navigating to Pocket Option...');
      await this.page.goto('https://pocketoption.com/en/login', {
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 90000 // Increased timeout for Render
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
        localStorage.setItem('session', ssid);
        sessionStorage.setItem('POAPI_SESSION', ssid);
        sessionStorage.setItem('sessionid', ssid);
        document.cookie = `POAPI_SESSION=${ssid}; path=/;`;
        document.cookie = `sessionid=${ssid}; path=/;`;
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
      await this.page.waitForSelector('input[name="email"]', { timeout: 15000 }).catch(() => null);
      
      const emailInput = await this.page.$('input[name="email"]') || 
                         await this.page.$('input[type="email"]') ||
                         await this.page.$('[placeholder*="Email"]');
      
      if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.press('Backspace');
        await emailInput.type(this.email, { delay: 50 });
      }

      const passInput = await this.page.$('input[name="password"]') || 
                        await this.page.$('input[type="password"]') ||
                        await this.page.$('[placeholder*="Password"]');
      
      if (passInput) {
        await passInput.type(this.password, { delay: 50 });
      }

      const submitBtn = await this.page.$('button[type="submit"]') || 
                        await this.page.$('.btn-primary') ||
                        await this.page.$('button:not([disabled])');
      
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
      
      // Track API responses for candle data
      const capturedResponses: any[] = [];
      const responseHandler = async (response: any) => {
        try {
          const url = response.url();
          // Capture API calls that might contain candle data
          if (url.includes('candle') || url.includes('chart') || url.includes('history') || url.includes('bar')) {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              try {
                const data = await response.json();
                capturedResponses.push(data);
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        } catch (e) {
          // Ignore response errors
        }
      };

      this.page!.on('response', responseHandler);
      
      await this.page!.goto(tradingUrl, {
        waitUntil: 'networkidle2',
        timeout: 90000,
      }).catch(() => null);

      // Wait a bit more for any delayed API calls
      await new Promise(resolve => setTimeout(resolve, 5000));
      this.page!.off('response', responseHandler);

      // Try to extract candles from captured API responses
      for (const response of capturedResponses) {
        const candles = this.extractCandlesFromResponse(response);
        if (candles.length > 0) {
          console.log(`✅ Extracted ${candles.length} candles from API response`);
          return candles.slice(-count);
        }
      }

      // Fallback: try to extract from window globals
      const candles = await this.page!.evaluate(() => {
        const windowGlobals = (window as any);
        const dataStructures = [
          windowGlobals.TradingApp?.chart?.candles,
          windowGlobals.TradingApp?.data?.candles,
          windowGlobals.TradingApp?.candles,
          windowGlobals.__STORE__?.getState?.()?.chart?.candles,
          windowGlobals.PoChart?.candles,
          windowGlobals.state?.candles,
          windowGlobals.chartsData?.candles,
          // Try to find any window property that has array of candle-like objects
          Object.values(windowGlobals).find((obj: any) => 
            Array.isArray(obj) && obj.length > 0 && 
            obj[0]?.open && obj[0]?.close && obj[0]?.high && obj[0]?.low
          )
        ];

        for (const data of dataStructures) {
          if (Array.isArray(data) && data.length > 0) {
            return data.map((c: any) => ({
              timestamp: Math.floor((c.time || c.timestamp || c.t || Date.now()) / 1000),
              open: parseFloat(c.open || c.o || 0),
              high: parseFloat(c.high || c.h || 0),
              low: parseFloat(c.low || c.l || 0),
              close: parseFloat(c.close || c.c || 0),
              volume: parseFloat(c.volume || c.v || 5000),
            })).filter(c => c.open > 0 && c.close > 0);
          }
        }
        return [];
      });

      if (candles.length > 0) {
        console.log(`✅ Extracted ${candles.length} candles from window globals`);
        return candles.slice(-count);
      }

      console.warn('⚠️ No candle data extracted from page - neither API nor window globals');
      return [];
    } catch (error) {
      console.error(`❌ Data fetch error: ${error}`);
      return [];
    }
  }

  private extractCandlesFromResponse(data: any): CandleData[] {
    // Try common response structures
    const candleArrays = [
      data?.data?.candles,
      data?.candles,
      data?.bars,
      data?.history,
      data?.chart?.candles,
      data?.ohlc,
      data?.prices,
      // If data is directly an array of candles
      Array.isArray(data) ? data : null
    ];

    for (const arr of candleArrays) {
      if (Array.isArray(arr) && arr.length > 0) {
        const mapped = arr.map((c: any) => ({
          timestamp: Math.floor((c.time || c.timestamp || c.t || c.timeStamp || Date.now()) / (c.time && c.time > 1e10 ? 1000 : 1)),
          open: parseFloat(c.open || c.o || c.Open || 0),
          high: parseFloat(c.high || c.h || c.High || 0),
          low: parseFloat(c.low || c.l || c.Low || 0),
          close: parseFloat(c.close || c.c || c.Close || 0),
          volume: parseFloat(c.volume || c.v || c.Volume || 5000),
        })).filter(c => c.open > 0 && c.close > 0 && c.high > 0 && c.low > 0);

        if (mapped.length > 0) return mapped;
      }
    }
    return [];
  }

  async validateSSID(): Promise<boolean> {
    if ((!this.ssid || this.ssid.length < 5) && (!this.email || !this.password)) {
      console.log('❌ No valid credentials (SSID or Email/Password) provided');
      return false;
    }
    return true;
  }

  async close(): Promise<void> {
    if (this.page) {
      this.page.removeAllListeners('request');
      await this.page.close().catch(() => null);
      this.page = null;
    }
    this.isConnected = false;
  }
}

let globalBrowser: PocketOptionBrowserClient | null = null;

export async function getPocketOptionBrowserClient(
  ssid: string,
  email?: string,
  password?: string
): Promise<PocketOptionBrowserClient> {
  if (globalBrowser) return globalBrowser;
  const client = new PocketOptionBrowserClient(ssid, email, password);
  await client.connect();
  globalBrowser = client;
  return client;
}

export function closeBrowserClient(): void {
  if (globalBrowser) {
    globalBrowser.close();
  }
}
