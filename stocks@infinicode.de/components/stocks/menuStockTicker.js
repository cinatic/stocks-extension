const { Clutter, GObject, St } = imports.gi

const Mainloop = imports.mainloop

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { setTimeout, clearTimeout } = Me.imports.helpers.components
const { roundOrDefault, getStockColorStyleClass } = Me.imports.helpers.data
const { Settings, STOCKS_SYMBOL_PAIRS, STOCKS_TICKER_INTERVAL, STOCKS_SHOW_OFF_MARKET_TICKER_PRICES } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

const { MARKET_STATES } = Me.imports.services.meta.yahoo
const FinanceService = Me.imports.services.financeService

const SETTING_KEYS_TO_REFRESH = [
  STOCKS_SYMBOL_PAIRS,
  STOCKS_TICKER_INTERVAL,
  STOCKS_SHOW_OFF_MARKET_TICKER_PRICES
]

var MenuStockTicker = GObject.registerClass({}, class MenuStockTicker extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'menu-stock-ticker',
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      reactive: true
    })

    this._visibleStockIndex = 0
    this._toggleDisplayTimeout = null
    this._settingsChangedId = null

    this._sync()

    this.connect('destroy', this._onDestroy.bind(this))
    this.connect('button-press-event', this._onPress.bind(this))

    this._settingsChangedId = Settings.connect('changed', (value, key) => {
      this._registerTimeout(false)

      if (SETTING_KEYS_TO_REFRESH.includes(key)) {
        this._sync()
      }
    })

    this._registerTimeout(false)
  }

  async _sync () {
    const tickerEnabledItems = Settings.symbol_pairs.filter(item => item.showInTicker)
    let stockItem = tickerEnabledItems[this._visibleStockIndex]

    if (!stockItem) {
      this._visibleStockIndex = 0
      stockItem = tickerEnabledItems[0]
    }

    if (!stockItem) {
      this._showInfoMessage(Translations.EMPTY_TICKER_TEXT)
      return
    }

    const showLoadingInfoTimeoutId = setTimeout(this._showInfoMessage.bind(this), 500)

    const quoteSummary = await FinanceService.getQuoteSummary({ symbol: stockItem.symbol, fallbackName: stockItem.name })

    clearTimeout(showLoadingInfoTimeoutId)

    this._createMenuTicker({ quoteSummary })
  }

  _createMenuTicker ({ quoteSummary }) {
    this.destroy_all_children()

    const stockInfoDetails = {
      name: quoteSummary.FullName,
      currencySymbol: quoteSummary.CurrencySymbol,
      price: quoteSummary.Close,
      change: quoteSummary.Change,
      changePercent: quoteSummary.ChangePercent,
      isOffMarket: false
    }

    if (Settings.show_ticker_off_market_prices) {
      if (quoteSummary.MarketState === MARKET_STATES.PRE) {
        stockInfoDetails.price = quoteSummary.PreMarketPrice
        stockInfoDetails.change = quoteSummary.PreMarketChange
        stockInfoDetails.changePercent = quoteSummary.PreMarketChangePercent
        stockInfoDetails.isOffMarket = true
      }

      if (quoteSummary.MarketState === MARKET_STATES.POST) {
        stockInfoDetails.price = quoteSummary.PostMarketPrice
        stockInfoDetails.change = quoteSummary.PostMarketChange
        stockInfoDetails.changePercent = quoteSummary.PostMarketChangePercent
        stockInfoDetails.isOffMarket = true
      }
    }

    const stockInfoBox = this._createStockInfoBox(stockInfoDetails)

    this.add_child(stockInfoBox)
  }

  _createStockInfoBox ({ name, currencySymbol, price, change, changePercent, isOffMarket }) {
    const quoteColorStyleClass = getStockColorStyleClass(change)

    currencySymbol = currencySymbol || ''

    const stockInfoBox = new St.BoxLayout({
      style_class: 'stock-info-box',
      vertical: true
    })

    const stockNameLabel = new St.Label({
      style_class: 'ticker-stock-name-label',
      text: name || Translations.UNKNOWN
    })

    stockInfoBox.add_child(stockNameLabel)

    const stockQuoteBox = new St.BoxLayout({
      style_class: 'stock-quote-box'
    })

    const stockQuoteLabel = new St.Label({
      style_class: `ticker-stock-quote-label fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(price)}${currencySymbol}`
    })

    const stockQuoteChangeLabel = new St.Label({
      style_class: `ticker-stock-quote-label-change small-text fwb ${quoteColorStyleClass}`,
      text: `(${roundOrDefault(change)}${currencySymbol} | ${roundOrDefault(changePercent)} %)${isOffMarket ? '*' : ''}`
    })

    stockQuoteBox.add_child(stockQuoteLabel)
    stockQuoteBox.add_child(stockQuoteChangeLabel)

    stockInfoBox.add_child(stockQuoteBox)

    return stockInfoBox
  }

  _showInfoMessage (message) {
    this.destroy_all_children()

    const infoMessageBin = new St.Bin({
      style_class: 'info-message-bin',
      x_expand: true,
      y_expand: true,
      child: new St.Label({
        style_class: `tac`,
        text: message || Translations.LOADING_DATA
      })
    })

    this.add_child(infoMessageBin)
  }

  _onPress (actor, event) {
    // left click === 1, middle click === 2, right click === 3
    const buttonID = event.get_button()

    if (buttonID === 2 || buttonID === 3) {
      this._registerTimeout()

      // avoid propagation
      return true
    }
  }

  _registerTimeout (toggleImmediately = true) {
    if (this._toggleDisplayTimeout) {
      Mainloop.source_remove(this._toggleDisplayTimeout)
      this._toggleDisplayTimeout = null
    }

    if (toggleImmediately) {
      this._showNextStock()
    }

    this._toggleDisplayTimeout = Mainloop.timeout_add_seconds(Settings.ticker_interval || 10, () => {
      this._showNextStock()

      return true
    })
  }

  _showNextStock () {
    this._visibleStockIndex = this._visibleStockIndex + 1 >= Settings.symbol_pairs.filter(item => item.showInTicker).length ? 0 : this._visibleStockIndex + 1
    this._sync()
  }

  _onDestroy () {
    if (this._toggleDisplayTimeout) {
      Mainloop.source_remove(this._toggleDisplayTimeout)
    }

    if (this._settingsChangedId) {
      Settings.disconnect(this._settingsChangedId)
    }
  }
})
