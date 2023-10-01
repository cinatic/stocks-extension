const { Gio, GLib } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault, isNullOrEmpty, isNullOrUndefined } = Me.imports.helpers.data
const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

var POSITION_IN_PANEL_KEY = 'position-in-panel'
var STOCKS_SYMBOL_PAIRS = 'symbol-pairs'
var STOCKS_TICKER_INTERVAL = 'ticker-interval'
var STOCKS_SHOW_OFF_MARKET_TICKER_PRICES = 'show-ticker-off-market-prices'
var STOCKS_TICKER_STOCK_AMOUNT = 'ticker-stock-amount'
var STOCKS_TICKER_DISPLAY_VARIATION = 'ticker-display-variation'
var STOCKS_USE_PROVIDER_INSTRUMENT_NAMES = 'use-provider-instrument-names'

var DEFAULT_SYMBOL_DATA = [
  {
    symbol: 'BABA',
    name: 'Alibaba (NY)',
    showInTicker: true,
    provider: FINANCE_PROVIDER.YAHOO
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

  connect (identifier, onChange) {
    return this._settings.connect(identifier, onChange)
  }

  disconnect (connectId) {
    this._settings.disconnect(connectId)
  }

  _validateStockItems (rawString) {
    let stockItems = this._migrateStockItemsFromV1Structure(rawString)

    if (isNullOrEmpty(stockItems)) {
      stockItems = decodeBase64JsonOrDefault(rawString, DEFAULT_SYMBOL_DATA)
    }

    return this._ensureHealthyStockItemStructure(stockItems)
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
