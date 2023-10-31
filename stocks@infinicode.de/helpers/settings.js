const { Gio, GLib } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault, isNullOrEmpty, isNullOrUndefined } = Me.imports.helpers.data
const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

var POSITION_IN_PANEL_KEY = 'position-in-panel'
var STOCKS_SYMBOL_PAIRS = 'symbol-pairs'
var STOCKS_PORTFOLIOS = 'portfolios'
var STOCKS_TRANSACTIONS = 'transactions'
var STOCKS_TICKER_INTERVAL = 'ticker-interval'
var STOCKS_SHOW_OFF_MARKET_TICKER_PRICES = 'show-ticker-off-market-prices'
var STOCKS_TICKER_STOCK_AMOUNT = 'ticker-stock-amount'
var STOCKS_SELECTED_PORTFOLIO = 'selected-portfolio'
var STOCKS_TICKER_DISPLAY_VARIATION = 'ticker-display-variation'
var STOCKS_USE_PROVIDER_INSTRUMENT_NAMES = 'use-provider-instrument-names'
var STOCKS_YAHOO_META = 'yahoo-meta'

var DEFAULT_SYMBOL_DATA = [
  {
    symbol: 'BABA',
    name: 'Alibaba (NY)',
    showInTicker: true,
    provider: FINANCE_PROVIDER.YAHOO
  }
]

var DEFAULT_PORTFOLIO_DATA = [
  {
    id: 'e3e619c6c567328e22f79bfd647b3003',
    name: 'List 1',
    symbols: [
      DEFAULT_SYMBOL_DATA
    ]
  }
]

var convertOldSettingsFormat = rawString => rawString.split('-&&-').map(symbolPairString => ({
  name: symbolPairString.split('-§§-')[0],
  symbol: symbolPairString.split('-§§-')[1],
  showInTicker: true,
  provider: FINANCE_PROVIDER.YAHOO
}))

var SettingsHandler = class SettingsHandler {
  constructor () {
    this._settings = ExtensionUtils.getSettings()
  }

  get position_in_panel () {
    return this._settings.get_enum(POSITION_IN_PANEL_KEY)
  }

  set position_in_panel (value) {
    return this._settings.set_enum(POSITION_IN_PANEL_KEY, value)
  }

  get symbol_pairs () {
    const rawString = this._settings.get_string(STOCKS_SYMBOL_PAIRS)
    const stockItems = this._validateStockItems(rawString)

    if (isNullOrEmpty(stockItems)) {
      this._settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(DEFAULT_SYMBOL_DATA)))
      return DEFAULT_SYMBOL_DATA
    }

    return stockItems
  }

  set symbol_pairs (value) {
    this._settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(value)))
  }

  get portfolios () {
    const rawString = this._settings.get_string(STOCKS_PORTFOLIOS)
    return this._validatePortfolioItems(rawString)
  }

  set portfolios (value) {
    this._settings.set_string(STOCKS_PORTFOLIOS, GLib.base64_encode(JSON.stringify(value)))
  }

  get transactions () {
    const rawString = this._settings.get_string(STOCKS_TRANSACTIONS)
    return decodeBase64JsonOrDefault(rawString, {})
  }

  set transactions (value) {
    this._settings.set_string(STOCKS_TRANSACTIONS, GLib.base64_encode(JSON.stringify(value)))
  }

  get ticker_interval () {
    return this._settings.get_int(STOCKS_TICKER_INTERVAL)
  }

  set ticker_interval (value) {
    return this._settings.set_int(STOCKS_TICKER_INTERVAL, value)
  }

  get ticker_stock_amount () {
    return this._settings.get_int(STOCKS_TICKER_STOCK_AMOUNT)
  }

  set ticker_stock_amount (value) {
    return this._settings.set_int(STOCKS_TICKER_STOCK_AMOUNT, value)
  }

  get ticker_display_variation () {
    return this._settings.get_enum(STOCKS_TICKER_DISPLAY_VARIATION)
  }

  set ticker_display_variation (value) {
    return this._settings.set_enum(STOCKS_TICKER_DISPLAY_VARIATION, value)
  }

  get show_ticker_off_market_prices () {
    return this._settings.get_boolean(STOCKS_SHOW_OFF_MARKET_TICKER_PRICES)
  }

  set show_ticker_off_market_prices (value) {
    return this._settings.set_boolean(STOCKS_SHOW_OFF_MARKET_TICKER_PRICES, value)
  }

  get use_provider_instrument_names () {
    return this._settings.get_boolean(STOCKS_USE_PROVIDER_INSTRUMENT_NAMES)
  }

  set use_provider_instrument_names (value) {
    return this._settings.set_boolean(STOCKS_USE_PROVIDER_INSTRUMENT_NAMES, value)
  }

  get selected_portfolio () {
    return this._settings.get_string(STOCKS_SELECTED_PORTFOLIO)
  }

  set selected_portfolio (v) {
    this._settings.set_string(STOCKS_SELECTED_PORTFOLIO, v)
  }

  get yahoo_meta () {
    const rawString = this._settings.get_string(STOCKS_YAHOO_META)
    return decodeBase64JsonOrDefault(rawString, {})
  }

  set yahoo_meta (value) {
    this._settings.set_string(STOCKS_YAHOO_META, GLib.base64_encode(JSON.stringify(value)))
  }

  connect (identifier, onChange) {
    return this._settings.connect(identifier, onChange)
  }

  disconnect (connectId) {
    this._settings.disconnect(connectId)
  }

  symbolsByPortfolio (portfolioId) {
    return ((this.portfolios || []).find(item => item.id == portfolioId) || {}).symbols || []
  }

  updatePortfolioById (portfolioId, name = null, symbols = null) {
    const portfolios = this.portfolios
    const portfolio = portfolios.find(item => item.id == portfolioId)
    if (portfolio) {
      if (symbols) {
        portfolio.symbols = symbols
      }

      if (name) {
        portfolio.name = name
      }
    }

    this.portfolios = portfolios
  }

  _validateStockItems (rawString) {
    let stockItems = this._migrateStockItemsFromV1Structure(rawString)

    if (isNullOrEmpty(stockItems)) {
      stockItems = decodeBase64JsonOrDefault(rawString, DEFAULT_SYMBOL_DATA)
    }

    return this._ensureHealthyStockItemStructure(stockItems)
  }

  _validatePortfolioItems (rawString) {
    if (!rawString) {
      // try migration from old stuff
      const migrated = [
        {
          ...DEFAULT_PORTFOLIO_DATA[0],
          symbols: this.symbol_pairs
        }
      ]

      this._settings.set_string(STOCKS_PORTFOLIOS, GLib.base64_encode(JSON.stringify(migrated)))

      return migrated
    }

    return decodeBase64JsonOrDefault(rawString, DEFAULT_PORTFOLIO_DATA)
  }

  _migrateStockItemsFromV1Structure (rawString) {
    /****
     * For backwards compatiblity intercept here if it contains certain string -&&- && -§§-
     * if we found old format convert to new format and save
     */
    if (rawString.includes('-&&-') && rawString.includes('-§§-')) {
      try {
        let newData = convertOldSettingsFormat(rawString)

        if (!newData) {
          newData = DEFAULT_SYMBOL_DATA
        }

        this._settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(newData)))

        return newData
      } catch (e) {
        return DEFAULT_SYMBOL_DATA
      }
    }
  }

  _ensureHealthyStockItemStructure (stockItems) {
    return stockItems.map(item => ({
      name: item.name || '',
      symbol: item.symbol || '',
      showInTicker: isNullOrUndefined(item.showInTicker) ? true : item.showInTicker,
      provider: item.provider || FINANCE_PROVIDER.YAHOO
    }))
  }
}
