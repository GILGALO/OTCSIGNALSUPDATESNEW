// Pocket Option Direct API Client
// Uses SSID token to authenticate and fetch real data directly via HTTP
// No browser automation - just pure API calls

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PocketOptionDirectClient {
  private ssid: string;
  private baseUrl = "https://web.po.market";

  constructor(ssid: string) {
    if (!ssid) {
      throw new Error("SSID token is required");
    }
    this.ssid = ssid;
    console.log(`✅ Pocket Option Direct Client initialized with SSID`);
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Cookie: `PHPSESSID=${this.ssid}`,
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: "https://web.po.market",
      Referer: "https://web.po.market/",
    };
  }

  async getM5Candles(
    symbol: string,
    count: number = 26
  ): Promise<CandleData[]> {
    console.log(
      `🔄 Fetching real Pocket Option data for ${symbol} using SSID...`
    );

    try {
      // Try multiple API endpoints that Pocket Option might use
      const endpoints = [
        // Try common API paths
        `/api/quotes/${symbol.toUpperCase()}`,
        `/api/candles/${symbol.toUpperCase()}`,
        `/api/chart/candles/${symbol.toUpperCase()}`,
        `/api/instrument/${symbol.toUpperCase()}/candles`,
        `/api/v2/quotes/${symbol.toUpperCase()}`,
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Trying endpoint: ${endpoint}`);
          const url = `${this.baseUrl}${endpoint}?interval=300&count=${count}`;

          const response = await this.fetchWithTimeout(url, {
            headers: this.getHeaders(),
          });

          if (response.ok) {
            const data = await response.json();
            const candles = this.parseCandles(data, symbol);

            if (candles && candles.length > 0) {
              console.log(`✅ SUCCESS! Got ${candles.length} candles from ${endpoint}`);
              return candles;
            }
          }
        } catch (error) {
          console.log(
            `⚠️ Endpoint ${endpoint} failed: ${error instanceof Error ? error.message : String(error)}`
          );
          continue;
        }
      }

      throw new Error("All Pocket Option API endpoints exhausted");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch from Pocket Option: ${msg}`);
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 15000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseCandles(data: any, symbol: string): CandleData[] {
    // Handle different response formats
    const candles: CandleData[] = [];

    if (Array.isArray(data)) {
      // Direct array of candles
      return data
        .map((candle) => this.parseCandle(candle))
        .filter((c: CandleData | null) => c !== null) as CandleData[];
    }

    if (data.candles && Array.isArray(data.candles)) {
      // Nested in 'candles' property
      return data.candles
        .map((candle: any) => this.parseCandle(candle))
        .filter((c: CandleData | null) => c !== null) as CandleData[];
    }

    if (data.quotes && Array.isArray(data.quotes)) {
      // Nested in 'quotes' property
      return data.quotes
        .map((candle: any) => this.parseCandle(candle))
        .filter((c: CandleData | null) => c !== null) as CandleData[];
    }

    if (data.data && Array.isArray(data.data)) {
      // Nested in 'data' property
      return data.data
        .map((candle: any) => this.parseCandle(candle))
        .filter((c: CandleData | null) => c !== null) as CandleData[];
    }

    console.warn(
      `⚠️ Could not parse candles from response: ${JSON.stringify(data).substring(0, 200)}`
    );
    return [];
  }

  private parseCandle(raw: any): CandleData | null {
    try {
      // Handle various timestamp formats
      let timestamp = raw.timestamp || raw.time || raw.t || raw.date;
      if (typeof timestamp === "string") {
        timestamp = Math.floor(new Date(timestamp).getTime() / 1000);
      } else if (timestamp > 10000000000) {
        // Convert milliseconds to seconds
        timestamp = Math.floor(timestamp / 1000);
      }

      return {
        timestamp,
        open:
          parseFloat(raw.open || raw.o) ||
          parseFloat(raw.price) ||
          parseFloat(raw.c),
        high:
          parseFloat(raw.high || raw.h) || parseFloat(raw.maxPrice) || 0,
        low:
          parseFloat(raw.low || raw.l) || parseFloat(raw.minPrice) || 0,
        close: parseFloat(raw.close || raw.c) || parseFloat(raw.price) || 0,
        volume: parseInt(raw.volume || raw.v || "0") || 0,
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse candle: ${error}`);
      return null;
    }
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch (error) {
      console.warn(
        `⚠️ Could not get current price: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}

export function createPocketOptionDirectClient(
  ssid: string
): PocketOptionDirectClient {
  return new PocketOptionDirectClient(ssid);
}
