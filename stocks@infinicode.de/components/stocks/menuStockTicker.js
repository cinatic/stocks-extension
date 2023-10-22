import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import Pango from 'gi://Pango'
import St from 'gi://St'

import { getStockColorStyleClass, isNullOrEmpty, roundOrDefault } from '../../helpers/data.js'
import { SettingsHandler, STOCKS_PORTFOLIOS, STOCKS_SHOW_OFF_MARKET_TICKER_PRICES, STOCKS_SYMBOL_PAIRS, STOCKS_TICKER_DISPLAY_VARIATION, STOCKS_TICKER_INTERVAL, STOCKS_TICKER_STOCK_AMOUNT, STOCKS_USE_PROVIDER_INSTRUMENT_NAMES } from '../../helpers/settings.js'

import { Translations } from '../../helpers/translations.js'
import * as FinanceService from '../../services/financeService.js'

import { FINANCE_PROVIDER, MARKET_STATES } from '../../services/meta/generic.js'

const SETTING_KEYS_TO_REFRESH = [
  STOCKS_SYMBOL_PAIRS,
  STOCKS_PORTFOLIOS,
  STOCKS_TICKER_INTERVAL,
  STOCKS_SHOW_OFF_MARKET_TICKER_PRICES,
  STOCKS_TICKER_DISPLAY_VARIATION,
  STOCKS_TICKER_STOCK_AMOUNT,
  STOCKS_USE_PROVIDER_INSTRUMENT_NAMES
]

const TICKER_ITEM_VARIATION = {
  COMPACT: 0,
  REGULAR: 1,
  TREMENDOUS: 2,
  MINIMAL: 3
}

export const MenuStockTicker = GObject.registerClass({
  GTypeName: 'StockExtension_MenuStockTicker'
}, class MenuStockTicker extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'menu-stock-ticker',
      y_align: Clutter.ActorAlign.CENTER,
      reactive: true
    })

    this._visibleStockIndex = 0
    this._toggleDisplayTimeout = null
    this._settingsChangedId = null
    this._showLoadingInfoTimeoutId = null

    this._settings = new SettingsHandler()

    this._sync().catch(e => log(e))

    this.connect('destroy', this._onDestroy.bind(this))
    this.connect('button-press-event', this._onPress.bind(this))

    this._settingsChangedId = this._settings.connect('changed', (value, key) => {
      this._registerTimeout(false)

      if (SETTING_KEYS_TO_REFRESH.includes(key)) {
        this._sync().catch(e => log(e))
      }
    })

    this._registerTimeout(false)
  }

  _getEnabledSymbols () {
    const tickerEnabledItems = []

    this._settings.portfolios.forEach(item => item.symbols.forEach(item => {
      if (item.showInTicker) {
        tickerEnabledItems.push(item)
      }
    }))

    return tickerEnabledItems
  }

  async _sync () {
    const tickerEnabledItems = this._getEnabledSymbols()

    const tickerBatch = this._getBatch(tickerEnabledItems, this._visibleStockIndex, this._settings.ticker_stock_amount)

    if (isNullOrEmpty(tickerBatch)) {
      this._showInfoMessage(Translations.EMPTY_TICKER_TEXT)
      return
    }

    this._showLoadingInfoTimeoutId = setTimeout(this._showInfoMessage.bind(this), 500)

    const [yahooQuoteSummaries, otherQuoteSummaries] = await Promise.all([
      FinanceService.getQuoteSummaryList({
        symbolsWithFallbackName: tickerBatch.filter(item => item.provider === FINANCE_PROVIDER.YAHOO).map(symbolData => ({ ...symbolData, fallbackName: symbolData.name })),
        provider: FINANCE_PROVIDER.YAHOO
      }),

      tickerBatch.filter(item => item.provider !== FINANCE_PROVIDER.YAHOO).map(symbolData => FinanceService.getQuoteSummary({
        ...symbolData,
        fallbackName: symbolData.name
      }))
    ])

    const wildMixOfQuoteSummaries = [...yahooQuoteSummaries, ...otherQuoteSummaries]

    clearTimeout(this._showLoadingInfoTimeoutId)

    this._createMenuTicker({ tickerBatch, quoteSummaries: wildMixOfQuoteSummaries })
  }

  _createMenuTicker ({ tickerBatch, quoteSummaries }) {
    this.destroy_all_children()

    const tickerItemCreationFn = this._getTickerItemCreationFunction()

    tickerBatch.forEach((symbolData, index) => {
      const { symbol, provider } = symbolData

      const quoteSummary = quoteSummaries?.find(item => item.Symbol === symbol && item.Provider === provider)

      if (!quoteSummary) {
        return
      }

      const stockTickerItemBox = tickerItemCreationFn.call(this, quoteSummary)
      this.add_child(stockTickerItemBox)

      if (index + 1 !== quoteSummaries.length) {
        const separatorBin = new St.Bin({
          style_class: 'separator-bin',
          y_align: Clutter.ActorAlign.CENTER,
          child: new St.Label({
            style_class: 'separator',
            text: '|'
          })
        })

        this.add_child(separatorBin)
      }
    })
  }

  _createCompactTickerItemBox (quoteSummary) {
    let { name, currencySymbol, price, change, changePercent, isOffMarket } = this._generateTickerInformation(quoteSummary)
    const quoteColorStyleClass = getStockColorStyleClass(change)

    currencySymbol = currencySymbol || ''

    const stockInfoBox = new St.BoxLayout({
      style_class: 'stock-info-box compact',
      vertical: false,
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true
    })

    const stockNameLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      style_class: 'ticker-stock-name-label',
      text: name
    })

    const stockQuoteLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      style_class: `ticker-stock-quote-label fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(price)}${currencySymbol}`
    })

    const changeLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      style_class: `ticker-stock-quote-change-label fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(change)}  ${roundOrDefault(changePercent)} %${isOffMarket ? '*' : ''}`
    })

    stockNameLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)
    stockQuoteLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)
    changeLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    stockInfoBox.add_child(stockNameLabel)
    stockInfoBox.add_child(stockQuoteLabel)
    stockInfoBox.add_child(changeLabel)

    return stockInfoBox
  }

  _createTremendousTickerItemBox (quoteSummary, regular) {
    let { name, currencySymbol, price, change, changePercent, isOffMarket } = this._generateTickerInformation(quoteSummary)
    const quoteColorStyleClass = getStockColorStyleClass(change)

    currencySymbol = currencySymbol || ''

    const stockInfoBox = new St.BoxLayout({
      style_class: `stock-info-box ${regular ? 'regular' : 'tremendous'}`,
      vertical: !regular,
      y_align: regular ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START
    })

    const stockNameLabel = new St.Label({
      style_class: 'ticker-stock-name-label',
      text: name || Translations.UNKNOWN,
      y_align: regular ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START
    })
    stockNameLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    stockInfoBox.add_child(stockNameLabel)

    const stockQuoteBox = new St.BoxLayout({
      style_class: 'stock-quote-box',
      y_align: Clutter.ActorAlign.START
    })

    const stockQuoteLabel = new St.Label({
      y_align: regular ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START,
      y_expand: true,
      style_class: `ticker-stock-quote-label fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(price)}${currencySymbol}`
    })

    const stockQuoteChangeLabel = new St.Label({
      y_align: regular ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START,
      y_expand: true,
      style_class: `ticker-stock-quote-change-label fwb ${quoteColorStyleClass}`,
      text: `(${roundOrDefault(change)}${currencySymbol} | ${roundOrDefault(changePercent)} %)${isOffMarket ? '*' : ''}`
    })

    stockQuoteLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)
    stockQuoteChangeLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    stockQuoteBox.add_child(stockQuoteLabel)
    stockQuoteBox.add_child(stockQuoteChangeLabel)

    stockInfoBox.add_child(stockQuoteBox)

    return stockInfoBox
  }

  _createMinimalTickerItemBox (quoteSummary) {
    let { symbol, currencySymbol, price, change } = this._generateTickerInformation(quoteSummary)
    const quoteColorStyleClass = getStockColorStyleClass(change)

    currencySymbol = currencySymbol || ''

    const stockInfoBox = new St.BoxLayout({
      style_class: 'stock-info-box compact',
      vertical: false,
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true
    })

    const stockNameLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      style_class: 'ticker-stock-name-label',
      text: symbol
    })

    const stockQuoteLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      style_class: `ticker-stock-quote-label fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(price)}${currencySymbol}`
    })

    stockNameLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)
    stockQuoteLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    stockInfoBox.add_child(stockNameLabel)
    stockInfoBox.add_child(stockQuoteLabel)

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
      clearInterval(this._toggleDisplayTimeout)
      this._toggleDisplayTimeout = null
    }

    if (toggleImmediately) {
      this._showNextStock()
    }

    this._toggleDisplayTimeout = setInterval(() => {
      this._showNextStock()
    }, (this._settings.ticker_interval || 10) * 1000)
  }

  _showNextStock () {
    this._visibleStockIndex = this._visibleStockIndex + 1 >= this._getEnabledSymbols().length ? 0 : this._visibleStockIndex + 1
    this._sync().catch(e => log(e))
  }

  _onDestroy () {
    if (this._toggleDisplayTimeout) {
      clearInterval(this._toggleDisplayTimeout)
    }

    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
    }

    if (this._showLoadingInfoTimeoutId) {
      clearTimeout(this._showLoadingInfoTimeoutId)
    }
  }

  _getTickerItemCreationFunction () {
    switch (this._settings.ticker_display_variation) {
      case TICKER_ITEM_VARIATION.COMPACT:
        return this._createCompactTickerItemBox

      case TICKER_ITEM_VARIATION.TREMENDOUS:
        return this._createTremendousTickerItemBox

      case TICKER_ITEM_VARIATION.MINIMAL:
        return this._createMinimalTickerItemBox

      default:
      case TICKER_ITEM_VARIATION.REGULAR:
        return quoteSummary => this._createTremendousTickerItemBox(quoteSummary, true)
    }
  }

  _generateTickerInformation (quoteSummary) {
    const stockInfoDetails = {
      name: quoteSummary.FullName,
      currencySymbol: quoteSummary.CurrencySymbol,
      price: quoteSummary.Close,
      change: quoteSummary.Change,
      changePercent: quoteSummary.ChangePercent,
      isOffMarket: false,
      symbol: quoteSummary.Symbol
    }

    if (this._settings.show_ticker_off_market_prices) {
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

    return stockInfoDetails
  }

  _getBatch (items, index, amount) {
    const start = index * amount
    const end = start + amount

    const batch = items.slice(start, end)

    if (isNullOrEmpty(batch)) {
      this._visibleStockIndex = 0
      return items.slice(0, amount)
    }

    return batch
  }
})
