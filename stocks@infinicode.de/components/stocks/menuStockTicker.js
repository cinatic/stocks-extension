const { GObject, St } = imports.gi

const Mainloop = imports.mainloop

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { setTimeout, clearTimeout } = Me.imports.helpers.components
const { roundOrDefault, getStockColorStyleClass } = Me.imports.helpers.data
const { Settings } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations

const FinanceService = Me.imports.services.financeService

var MenuStockTicker = GObject.registerClass({}, class MenuStockTicker extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'menu-stock-ticker',
      x_expand: false,
      y_expand: false,
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

      if (key === 'symbol-pairs') {
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

    const quoteColorStyleClass = getStockColorStyleClass(quoteSummary.Change)

    const stockInfoBox = new St.BoxLayout({
      style_class: 'stock-info-box',
      x_expand: true,
      y_expand: true,
      vertical: true
    })

    const stockNameLabel = new St.Label({
      style_class: 'ticker-stock-name-label',
      text: quoteSummary.FullName || Translations.UNKNOWN
    })

    stockInfoBox.add_child(stockNameLabel)

    const stockQuoteLabel = new St.Label({
      style_class: `ticker-stock-quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(quoteSummary.Close)}${quoteSummary.CurrencySymbol ? ` ${quoteSummary.CurrencySymbol}` : ''}`
    })

    stockInfoBox.add_child(stockQuoteLabel)

    this.add_child(stockInfoBox)
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
