<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';

const selectedTool = ref('all');

// Widget categories mapping
const widgetCategories = {
  'all': [
    'chart', 'market-overview', 'stock-market', 'market-data', 'economic-calendar', 
    'forex-cross-rates', 'forex-heat-map', 'screener', 'symbol-overview', 'crypto-market', 
    'technical-analysis', 'ticker-tape', 'mini-chart', 'stock-screener', 'symbol-info',
    'watchlist', 'single-quote', 'fundamental-data', 'news', 'ideas'
  ],
  'charts': ['chart', 'symbol-overview', 'technical-analysis', 'mini-chart'],
  'market-data': ['market-overview', 'stock-market', 'market-data', 'ticker-tape', 'single-quote', 'watchlist'],
  'forex': ['forex-cross-rates', 'forex-heat-map', 'screener'],
  'crypto': ['crypto-market'],
  'screener': ['screener', 'stock-screener'],
  'calendar': ['economic-calendar'],
  'news': ['news', 'ideas'],
  'analysis': ['technical-analysis', 'fundamental-data', 'symbol-info'],
  'watchlist': ['watchlist', 'single-quote', 'symbol-info'],
  'fundamentals': ['fundamental-data', 'symbol-info']
};

// Widget container refs
const chartWidgetRef = ref(null);
const marketOverviewRef = ref(null);
const stockMarketRef = ref(null);
const marketDataRef = ref(null);
const economicCalendarRef = ref(null);
const forexCrossRatesRef = ref(null);
const forexHeatMapRef = ref(null);
const screenerRef = ref(null);
const symbolOverviewRef = ref(null);
const cryptoMarketRef = ref(null);
const technicalAnalysisRef = ref(null);
const tickerTapeRef = ref(null);
const miniChartRef = ref(null);
const stockScreenerRef = ref(null);
const symbolInfoRef = ref(null);
const watchlistRef = ref(null);
const singleQuoteRef = ref(null);
const fundamentalDataRef = ref(null);
const newsRef = ref(null);
const ideasRef = ref(null);

// Computed property to check if widget should be visible
const isWidgetVisible = (widgetId) => {
  if (!selectedTool.value || selectedTool.value === 'all') {
    return true;
  }
  return widgetCategories[selectedTool.value]?.includes(widgetId) || false;
};

// Load TradingView widgets
onMounted(async () => {
  // Wait for DOM to be fully ready
  await nextTick();
  setTimeout(() => {
    loadTradingViewWidgets();
  }, 300);
});

// Reload widgets when visibility changes
watch(selectedTool, () => {
  // Small delay to ensure DOM updates
  setTimeout(() => {
    loadTradingViewWidgets();
  }, 100);
});

function loadTradingViewWidgets() {
  // Chart Widget - Use proper TradingView embedding method
  if (chartWidgetRef.value) {
    // Don't reload if already loaded
    if (chartWidgetRef.value.querySelector('script[src*="embed-widget-advanced-chart"]')) {
      console.log('Chart widget already loaded');
      return;
    }
    
    // Ensure widget div exists (it should already be in template)
    let widgetDiv = chartWidgetRef.value.querySelector('.tradingview-widget-container__widget');
    if (!widgetDiv) {
      widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      chartWidgetRef.value.appendChild(widgetDiv);
      console.log('Created widget div');
    }
    
    // Create and append script - TradingView requires this exact structure
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    const config = {
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    };
    
    // TradingView requires innerHTML for JSON config
    script.innerHTML = JSON.stringify(config);
    
    // Handle script load errors
    script.onerror = () => {
      console.error('❌ Failed to load TradingView chart script');
    };
    
    script.onload = () => {
      console.log('✅ TradingView chart script loaded successfully');
    };
    
    chartWidgetRef.value.appendChild(script);
    
    console.log('✅ Chart widget script added to DOM', {
      containerExists: !!chartWidgetRef.value,
      widgetDivExists: !!widgetDiv,
      scriptSrc: script.src,
      config: config
    });
  } else {
    console.error('❌ Chart widget ref not available');
    // Retry after delay
    setTimeout(() => {
      if (chartWidgetRef.value) {
        loadTradingViewWidgets();
      }
    }, 500);
  }

  // Market Overview Widget
  if (marketOverviewRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'light',
      dateRange: '1D',
      showChart: true,
      locale: 'en',
      isTransparent: false,
      showSymbolLogo: true,
      width: '100%',
      height: '500',
      tabs: [
        {
          title: 'Major Pairs',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR/USD' },
            { s: 'FX:GBPUSD', d: 'GBP/USD' },
            { s: 'FX:USDJPY', d: 'USD/JPY' },
            { s: 'FX:USDCHF', d: 'USD/CHF' },
            { s: 'FX:AUDUSD', d: 'AUD/USD' },
            { s: 'FX:USDCAD', d: 'USD/CAD' }
          ]
        },
        {
          title: 'Minor Pairs',
          symbols: [
            { s: 'FX:EURGBP', d: 'EUR/GBP' },
            { s: 'FX:EURJPY', d: 'EUR/JPY' },
            { s: 'FX:GBPJPY', d: 'GBP/JPY' },
            { s: 'FX:AUDJPY', d: 'AUD/JPY' },
            { s: 'FX:EURAUD', d: 'EUR/AUD' },
            { s: 'FX:GBPAUD', d: 'GBP/AUD' }
          ]
        },
        {
          title: 'Exotic Pairs',
          symbols: [
            { s: 'FX:USDZAR', d: 'USD/ZAR' },
            { s: 'FX:USDMXN', d: 'USD/MXN' },
            { s: 'FX:USDTRY', d: 'USD/TRY' },
            { s: 'FX:USDSGD', d: 'USD/SGD' },
            { s: 'FX:USDHKD', d: 'USD/HKD' },
            { s: 'FX:USDNOK', d: 'USD/NOK' }
          ]
        },
        {
          title: 'Commodities',
          symbols: [
            { s: 'OANDA:XAUUSD', d: 'Gold/USD' },
            { s: 'OANDA:XAGUSD', d: 'Silver/USD' },
            { s: 'TVC:CRUDE_OIL', d: 'Crude Oil' },
            { s: 'TVC:NATURAL_GAS', d: 'Natural Gas' }
          ]
        }
      ]
    });
    marketOverviewRef.value.appendChild(script);
  }

  // Stock Market Widget - Changed to Forex Market
  if (stockMarketRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      symbolsGroups: [
        {
          name: 'Forex Major Pairs',
          symbols: [
            { name: 'FX:EURUSD', displayName: 'EUR/USD' },
            { name: 'FX:GBPUSD', displayName: 'GBP/USD' },
            { name: 'FX:USDJPY', displayName: 'USD/JPY' },
            { name: 'FX:USDCHF', displayName: 'USD/CHF' },
            { name: 'FX:AUDUSD', displayName: 'AUD/USD' },
            { name: 'FX:USDCAD', displayName: 'USD/CAD' }
          ]
        }
      ],
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en'
    });
    stockMarketRef.value.appendChild(script);
  }

  // Market Data Widget
  if (marketDataRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      symbolsGroups: [
        {
          name: 'Major Forex Pairs',
          symbols: [
            { name: 'FX:EURUSD', displayName: 'EUR/USD' },
            { name: 'FX:GBPUSD', displayName: 'GBP/USD' },
            { name: 'FX:USDJPY', displayName: 'USD/JPY' },
            { name: 'FX:USDCHF', displayName: 'USD/CHF' },
            { name: 'FX:AUDUSD', displayName: 'AUD/USD' },
            { name: 'FX:USDCAD', displayName: 'USD/CAD' }
          ]
        },
        {
          name: 'Minor Forex Pairs',
          symbols: [
            { name: 'FX:EURGBP', displayName: 'EUR/GBP' },
            { name: 'FX:EURJPY', displayName: 'EUR/JPY' },
            { name: 'FX:GBPJPY', displayName: 'GBP/JPY' },
            { name: 'FX:AUDJPY', displayName: 'AUD/JPY' },
            { name: 'FX:EURAUD', displayName: 'EUR/AUD' },
            { name: 'FX:GBPAUD', displayName: 'GBP/AUD' }
          ]
        },
        {
          name: 'Forex Commodities',
          symbols: [
            { name: 'OANDA:XAUUSD', displayName: 'Gold/USD' },
            { name: 'OANDA:XAGUSD', displayName: 'Silver/USD' },
            { name: 'TVC:CRUDE_OIL', displayName: 'Crude Oil' }
          ]
        }
      ],
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en'
    });
    marketDataRef.value.appendChild(script);
  }

  // Economic Calendar Widget
  if (economicCalendarRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'light',
      isTransparent: false,
      width: '100%',
      height: '500',
      locale: 'en',
      importanceFilter: '-1,0,1'
    });
    economicCalendarRef.value.appendChild(script);
  }

  // Forex Cross Rates Widget
  if (forexCrossRatesRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'],
      isTransparent: false,
      colorTheme: 'light',
      locale: 'en'
    });
    forexCrossRatesRef.value.appendChild(script);
  }

  // Forex Heat Map Widget
  if (forexHeatMapRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'FX_IDC',
      blockSize: 'market_cap_calc',
      blockColor: 'change',
      locale: 'en',
      colorTheme: 'light',
      hasTopBar: false,
      isTransparent: false,
      width: '100%',
      height: '400'
    });
    forexHeatMapRef.value.appendChild(script);
  }

  // Screener Widget
  if (screenerRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      defaultColumn: 'overview',
      screener_type: 'forex',
      displayCurrency: 'USD',
      colorTheme: 'light',
      locale: 'en',
      isTransparent: false
    });
    screenerRef.value.appendChild(script);
  }

  // Symbol Overview Widget
  if (symbolOverviewRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        ['EUR/USD', 'FX:EURUSD|1D'],
        ['GBP/USD', 'FX:GBPUSD|1D'],
        ['USD/JPY', 'FX:USDJPY|1D']
      ],
      chartOnly: false,
      width: '100%',
      height: '500',
      locale: 'en',
      colorTheme: 'light',
      autosize: true,
      showVolume: false,
      hideDateRanges: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontSize: '10',
      noTimeScale: false,
      valuesScale: 'normal',
      chartType: 'area',
      lineColor: 'rgba(25, 118, 210, 1)',
      bottomColor: 'rgba(25, 118, 210, 0.12)',
      topColor: 'rgba(25, 118, 210, 0.12)',
      gridLineColor: 'rgba(42, 46, 57, 0.06)',
      isTransparent: false
    });
    symbolOverviewRef.value.appendChild(script);
  }

  // Cryptocurrency Market Widget - Changed to Forex Exotic Pairs
  if (cryptoMarketRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      symbolsGroups: [
        {
          name: 'Forex Exotic Pairs',
          symbols: [
            { name: 'FX:USDZAR', displayName: 'USD/ZAR' },
            { name: 'FX:USDMXN', displayName: 'USD/MXN' },
            { name: 'FX:USDTRY', displayName: 'USD/TRY' },
            { name: 'FX:USDSGD', displayName: 'USD/SGD' },
            { name: 'FX:USDHKD', displayName: 'USD/HKD' },
            { name: 'FX:USDNOK', displayName: 'USD/NOK' }
          ]
        }
      ],
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en'
    });
    cryptoMarketRef.value.appendChild(script);
  }

  // Technical Analysis Widget
  if (technicalAnalysisRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: false,
      height: '500',
      symbol: 'FX:EURUSD',
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'en',
      colorTheme: 'light'
    });
    technicalAnalysisRef.value.appendChild(script);
  }

  // Ticker Tape Widget
  if (tickerTapeRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FX:EURUSD', title: 'EUR/USD' },
        { proName: 'FX:GBPUSD', title: 'GBP/USD' },
        { proName: 'FX:USDJPY', title: 'USD/JPY' },
        { proName: 'FX:USDCHF', title: 'USD/CHF' },
        { proName: 'FX:AUDUSD', title: 'AUD/USD' },
        { proName: 'FX:USDCAD', title: 'USD/CAD' },
        { proName: 'OANDA:XAUUSD', title: 'Gold/USD' },
        { proName: 'OANDA:XAGUSD', title: 'Silver/USD' },
        { proName: 'FX:EURJPY', title: 'EUR/JPY' },
        { proName: 'FX:GBPJPY', title: 'GBP/JPY' }
      ],
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      displayMode: 'adaptive',
      locale: 'en'
    });
    tickerTapeRef.value.appendChild(script);
  }

  // Mini Chart Widget
  if (miniChartRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: 'OANDA:XAUUSD',
      width: '100%',
      height: '350',
      locale: 'en',
      dateRange: '1D',
      colorTheme: 'light',
      isTransparent: false,
      autosize: true,
      largeChartUrl: ''
    });
    miniChartRef.value.appendChild(script);
  }

  // Stock Screener Widget - Changed to Forex Screener
  if (stockScreenerRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      defaultColumn: 'overview',
      screener_type: 'forex',
      displayCurrency: 'USD',
      colorTheme: 'light',
      locale: 'en',
      isTransparent: false
    });
    stockScreenerRef.value.appendChild(script);
  }

  // Symbol Info Widget
  if (symbolInfoRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: 'FX:EURUSD',
      width: '100%',
      locale: 'en',
      colorTheme: 'light',
      isTransparent: false
    });
    symbolInfoRef.value.appendChild(script);
  }

  // Watchlist Widget
  if (watchlistRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '500',
      symbolsGroups: [
        {
          name: 'Forex Watchlist',
          symbols: [
            { name: 'FX:EURUSD', displayName: 'EUR/USD' },
            { name: 'FX:GBPUSD', displayName: 'GBP/USD' },
            { name: 'FX:USDJPY', displayName: 'USD/JPY' },
            { name: 'OANDA:XAUUSD', displayName: 'Gold/USD' },
            { name: 'FX:AUDUSD', displayName: 'AUD/USD' }
          ]
        }
      ],
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en'
    });
    watchlistRef.value.appendChild(script);
  }

  // Single Quote Widget
  if (singleQuoteRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: 'FX:EURUSD',
      width: '100%',
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en'
    });
    singleQuoteRef.value.appendChild(script);
  }

  // Fundamental Data Widget
  if (fundamentalDataRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: 'OANDA:XAUUSD',
      colorTheme: 'light',
      isTransparent: false,
      largeChartUrl: '',
      displayMode: 'regular',
      width: '100%',
      height: '500',
      locale: 'en'
    });
    fundamentalDataRef.value.appendChild(script);
  }

  // News Widget
  if (newsRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols',
      colorTheme: 'light',
      isTransparent: false,
      displayMode: 'regular',
      width: '100%',
      height: '500',
      locale: 'en'
    });
    newsRef.value.appendChild(script);
  }

  // Ideas Widget
  if (ideasRef.value) {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols',
      colorTheme: 'light',
      isTransparent: false,
      displayMode: 'regular',
      width: '100%',
      height: '500',
      locale: 'en'
    });
    ideasRef.value.appendChild(script);
  }
}
</script>

<template>
  <div class="useful-tools-page">
    <!-- Header Section -->
    <div class="header-card">
      <div class="header-content">
        <div>
          <h1 class="page-title">Useful Tools</h1>
          <p class="page-subtitle">
            This area is customizable for embedding internal or external tools to enhance your trading experience.
          </p>
        </div>
        <div class="tool-selector">
          <select v-model="selectedTool" class="tool-select">
            <option value="all">All Tools</option>
            <option value="charts">Charts (4)</option>
            <option value="market-data">Market Data (6)</option>
            <option value="forex">Forex (3)</option>
            <option value="crypto">Cryptocurrency (1)</option>
            <option value="screener">Screeners (2)</option>
            <option value="calendar">Economic Calendar (1)</option>
            <option value="news">News & Ideas (2)</option>
            <option value="analysis">Technical Analysis (3)</option>
            <option value="watchlist">Watchlist & Quotes (3)</option>
            <option value="fundamentals">Fundamentals (2)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Widgets Grid -->
    <div class="widgets-grid">
      <!-- Row 1: TradingView Chart + Market Overview + Stock Market (3 columns) -->
      <div class="widget-row widget-row-3col">
        <!-- TradingView Chart Widget -->
        <div v-show="isWidgetVisible('chart')" class="widget-card chart-widget-card">
          <div class="widget-header">
            <h3 class="widget-title">TradingView Chart</h3>
          </div>
          <div class="widget-content chart-content-wrapper">
            <div class="tradingview-widget-container" ref="chartWidgetRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Market Overview Widget -->
        <div v-show="isWidgetVisible('market-overview')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Market Overview</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="marketOverviewRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Stock Market Widget -->
        <div v-show="isWidgetVisible('stock-market')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Stock Market</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="stockMarketRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Market Data + Economic Calendar + Forex Cross Rates (3 columns) -->
      <div class="widget-row widget-row-3col">
        <!-- Market Data Widget -->
        <div v-show="isWidgetVisible('market-data')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Market Data</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="marketDataRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Economic Calendar Widget -->
        <div v-show="isWidgetVisible('economic-calendar')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Economic Calendar</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="economicCalendarRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Forex Cross Rates Widget -->
        <div v-show="isWidgetVisible('forex-cross-rates')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Forex Cross Rates</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="forexCrossRatesRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Forex Heat Map + Forex Screener + Symbol Overview (3 columns) -->
      <div class="widget-row widget-row-3col">
        <!-- Forex Heat Map Widget -->
        <div v-show="isWidgetVisible('forex-heat-map')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Forex Heat Map</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="forexHeatMapRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Screener Widget -->
        <div v-show="isWidgetVisible('screener')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Forex Screener</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="screenerRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Symbol Overview Widget -->
        <div v-show="isWidgetVisible('symbol-overview')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Symbol Overview</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="symbolOverviewRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 4: Cryptocurrency Market + Technical Analysis (2 columns) -->
      <div class="widget-row widget-row-2col">
        <!-- Cryptocurrency Market Widget -->
        <div v-show="isWidgetVisible('crypto-market')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Cryptocurrency Market</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="cryptoMarketRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Technical Analysis Widget -->
        <div v-show="isWidgetVisible('technical-analysis')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Technical Analysis</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="technicalAnalysisRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 5: Market Ticker (Full Width) -->
      <div v-show="isWidgetVisible('ticker-tape')" class="ticker-tape-full">
        <div class="widget-card ticker-tape-card">
          <div class="widget-header">
            <h3 class="widget-title">Market Ticker</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="tickerTapeRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 6: Mini Chart + Stock Screener + Symbol Information (3 columns) -->
      <div class="widget-row widget-row-3col">
        <!-- Mini Chart Widget -->
        <div v-show="isWidgetVisible('mini-chart')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Mini Chart</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="miniChartRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Stock Screener Widget -->
        <div v-show="isWidgetVisible('stock-screener')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Stock Screener</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="stockScreenerRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Symbol Info Widget -->
        <div v-show="isWidgetVisible('symbol-info')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Symbol Information</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="symbolInfoRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 7: Watchlist + Live Quote + Fundamental Data (3 columns) -->
      <div class="widget-row widget-row-3col">
        <!-- Watchlist Widget -->
        <div v-show="isWidgetVisible('watchlist')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Watchlist</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="watchlistRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Single Quote Widget -->
        <div v-show="isWidgetVisible('single-quote')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Live Quote</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="singleQuoteRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Fundamental Data Widget -->
        <div v-show="isWidgetVisible('fundamental-data')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Fundamental Data</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="fundamentalDataRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 8: Market News + Trading Ideas (2 columns) -->
      <div class="widget-row widget-row-2col">
        <!-- News Widget -->
        <div v-show="isWidgetVisible('news')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Market News</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="newsRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>

        <!-- Ideas Widget -->
        <div v-show="isWidgetVisible('ideas')" class="widget-card">
          <div class="widget-header">
            <h3 class="widget-title">Trading Ideas</h3>
          </div>
          <div class="widget-content">
            <div class="tradingview-widget-container" ref="ideasRef">
              <div class="tradingview-widget-container__widget"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.useful-tools-page {
  padding: 24px 32px;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Header Card */
.header-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 1px solid #e5e5e5;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111111;
  margin: 0;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #666666;
  margin: 0;
  line-height: 1.5;
}

.tool-selector {
  flex-shrink: 0;
}

.tool-select {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #111111;
  background: #ffffff;
  cursor: pointer;
  min-width: 200px;
}

.tool-select:focus {
  outline: none;
  border-color: #111111;
}

/* Widgets Grid */
.widgets-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.widget-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

/* 2 Column Layout */
.widget-row-2col {
  grid-template-columns: repeat(2, 1fr);
}

/* 3 Column Layout */
.widget-row-3col {
  grid-template-columns: repeat(3, 1fr);
}

/* Ticker Tape Full Width */
.ticker-tape-full {
  width: 100%;
  margin-bottom: 24px;
}

/* Widget Card */
.widget-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e5e5;
  overflow: hidden;
  transition: all 0.3s ease;
}

.widget-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #111111;
}

.widget-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.widget-title {
  font-size: 16px;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.widget-content {
  padding: 0;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-top: none;
}

.tradingview-widget-container {
  width: 100%;
  height: 100%;
  min-height: 450px;
}

.tradingview-widget-container__widget {
  width: 100%;
  height: 100%;
}

/* Chart Widget Card Styling */
.chart-widget-card {
  width: 100%;
}

.chart-content-wrapper {
  width: 100%;
  min-height: 450px;
  height: 450px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  border-top: none;
}

.chart-content-wrapper .tradingview-widget-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.chart-content-wrapper .tradingview-widget-container .tradingview-widget-container__widget {
  width: 100%;
  height: 100%;
}

/* Chart Widget Specific Styling (for other charts) */
.chart-widget {
  grid-column: span 1;
}

.chart-content {
  min-height: 500px;
  padding: 0;
  overflow: hidden;
}

.chart-content .tradingview-widget-container {
  min-height: 500px;
  height: 100%;
  width: 100%;
}

/* When widgets are hidden, maintain grid layout */
.widget-card[style*="display: none"] {
  display: none !important;
}

/* Ticker Tape Specific Styling */
.ticker-tape-card {
  width: 100%;
}

.ticker-tape-card .widget-content {
  min-height: 100px;
  padding: 10px 0;
}

.ticker-tape-card .tradingview-widget-container {
  min-height: 100px;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .widget-row-3col {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .widget-row-2col {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .useful-tools-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .widget-row {
    grid-template-columns: 1fr;
  }
  
  .ticker-tape-card {
    grid-column: span 1;
  }
  
  .chart-widget-card {
    margin-bottom: 20px;
  }
  
  .chart-content-wrapper {
    min-height: 450px;
    height: 450px;
  }
  
  .tool-select {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }
  
  .widget-card {
    border-radius: 8px;
  }
  
  .widget-header {
    padding: 12px 16px;
  }
  
  .widget-title {
    font-size: 14px;
  }
}
</style>
