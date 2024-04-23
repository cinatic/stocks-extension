import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { fallbackIfNaN, roundOrDefault, getStockColorStyleClass, toLocalDateFormat } from '../../helpers/data.js'
import { Translations } from '../../helpers/translations.js'
import { MARKET_STATES } from '../../services/meta/generic.js'

export const StockDetails = GObject.registerClass({
  GTypeName: 'StockExtension_StockDetails'
}, class StockDetails extends St.BoxLayout {
  _init ({ quoteSummary }) {
    super._init({
      style_class: 'stock-details',
      x_expand: true,
      y_expand: true,
      vertical: true
    })

    this._sync({ quoteSummary })

    this.connect('destroy', this._onDestroy.bind(this))
  }

  _sync ({ quoteSummary }) {
    this._headerBox = this._createHeaderBox({ quoteSummary })
    this._detailsTableBox = this._createDetailBox({ quoteSummary })

    this.add_child(this._headerBox)
    this.add_child(this._detailsTableBox)
  }

  _createHeaderBox ({ quoteSummary }) {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    })

    if (quoteSummary.Error) {
      const errorLabel = new St.Label({
        style_class: `error-label`,
        text: `${quoteSummary.Error}`
      })

      headerBox.add_child(errorLabel)
    } else {
      const leftBox = this._createStockInfo({ quoteSummary })
      const rightBox = this._createQuoteInfo({ quoteSummary })

      headerBox.add_child(leftBox)
      headerBox.add_child(rightBox)
    }

    return headerBox
  }

  _createStockInfo ({ quoteSummary }) {
    const stockInformationBox = new St.Bin({
      style_class: 'stock-information-box',
      x_expand: true,
      y_expand: true,
      child: new St.Label({
        style_class: 'stock-full-name',
        text: quoteSummary.FullName
      })
    })

    return stockInformationBox
  }

  _createQuoteInfo ({ quoteSummary }) {
    const quoteColorStyleClass = getStockColorStyleClass(quoteSummary.Change)

    const quoteInformationBox = new St.BoxLayout({
      style_class: 'quote-information-box tar',
      x_expand: false,
      y_expand: true
    })

    const regularQuoteLabel = new St.Label({
      style_class: `quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(quoteSummary.Close)}${quoteSummary.CurrencySymbol ? ` ${quoteSummary.CurrencySymbol}` : ''}`
    })

    quoteInformationBox.add_child(regularQuoteLabel)

    if (quoteSummary.MarketState === MARKET_STATES.PRE) {
      const preMarketQuoteColorStyleClass = getStockColorStyleClass(quoteSummary.PreMarketChange)

      quoteInformationBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))

      const preMarketQuoteLabel = new St.Label({
        style_class: `quote-label pre-market ${preMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(quoteSummary.PreMarketPrice)}${quoteSummary.CurrencySymbol ? ` ${quoteSummary.CurrencySymbol}` : ''}*`
      })

      quoteInformationBox.add_child(preMarketQuoteLabel)
    }

    if (quoteSummary.MarketState === MARKET_STATES.POST) {
      const postMarketQuoteColorStyleClass = getStockColorStyleClass(quoteSummary.PostMarketChange)

      quoteInformationBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))

      const postMarketQuoteLabel = new St.Label({
        style_class: `quote-label post-market ${postMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(quoteSummary.PostMarketPrice)}${quoteSummary.CurrencySymbol ? ` ${quoteSummary.CurrencySymbol}` : ''}*`
      })

      quoteInformationBox.add_child(postMarketQuoteLabel)
    }

    return quoteInformationBox
  }

  _createDetailBox ({ quoteSummary }) {
    const detailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
      x_expand: true,
      y_expand: false
    })

    detailBox.add_child(this._createLeftDetailBox({ quoteSummary }))
    detailBox.add_child(this._createRightDetailBox({ quoteSummary }))

    return detailBox
  }

  _createLeftDetailBox ({ quoteSummary }) {
    const leftDetailBox = new St.BoxLayout({
      style_class: 'stock-left-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    leftDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.SYMBOL),
        this._createDetailItemValue(quoteSummary.Symbol)
    ))

    leftDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.CHANGE),
        this._createDetailItemValueForChange(quoteSummary.Change, quoteSummary.CurrencySymbol, quoteSummary.ChangePercent)
    ))

    if (quoteSummary.MarketState === MARKET_STATES.PRE) {
      leftDetailBox.add_child(this._createDetailItem(
          this._createDetailItemLabel(Translations.STOCKS.CHANGE_PRE_MARKET),
          this._createDetailItemValueForChange(quoteSummary.PreMarketChange, quoteSummary.CurrencySymbol, quoteSummary.PreMarketChangePercent)
      ))
    }

    if (quoteSummary.MarketState === MARKET_STATES.POST) {
      leftDetailBox.add_child(this._createDetailItem(
          this._createDetailItemLabel(Translations.STOCKS.CHANGE_POST_MARKET),
          this._createDetailItemValueForChange(quoteSummary.PostMarketChange, quoteSummary.CurrencySymbol, quoteSummary.PostMarketChangePercent)
      ))
    }

    leftDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.OPEN),
        this._createDetailItemValue(roundOrDefault(quoteSummary.Open))
    ))

    leftDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.HIGH),
        this._createDetailItemValue(roundOrDefault(quoteSummary.High))
    ))

    leftDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.TIME),
        this._createDetailItemValue(toLocalDateFormat(quoteSummary.Timestamp, Translations.FORMATS.DEFAULT_DATE_TIME))
    ))

    return leftDetailBox
  }

  _createRightDetailBox ({ quoteSummary }) {
    const rightDetailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    rightDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.EXCHANGE),
        this._createDetailItemValue(quoteSummary.ExchangeName || Translations.UNKNOWN)
    ))

    rightDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.PREVIOUS_CLOSE),
        this._createDetailItemValue(roundOrDefault(quoteSummary.PreviousClose))
    ))

    if (quoteSummary.MarketState === MARKET_STATES.PRE) {
      rightDetailBox.add_child(this._createDetailItem(
          this._createDetailItemLabel(Translations.STOCKS.TIME_PRE_MARKET),
          this._createDetailItemValue(toLocalDateFormat(quoteSummary.PreMarketTimestamp, Translations.FORMATS.DEFAULT_DATE_TIME))
      ))
    }

    if (quoteSummary.MarketState === MARKET_STATES.POST) {
      rightDetailBox.add_child(this._createDetailItem(
          this._createDetailItemLabel(Translations.STOCKS.TIME_POST_MARKET),
          this._createDetailItemValue(toLocalDateFormat(quoteSummary.PostMarketTimestamp, Translations.FORMATS.DEFAULT_DATE_TIME))
      ))
    }

    rightDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.CLOSE),
        this._createDetailItemValue(roundOrDefault(quoteSummary.Close))
    ))

    rightDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.LOW),
        this._createDetailItemValue(roundOrDefault(quoteSummary.Low))
    ))

    rightDetailBox.add_child(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.VOLUME),
        this._createDetailItemValue(fallbackIfNaN(quoteSummary.Volume))
    ))

    return rightDetailBox
  }

  _createDetailItem (label, value) {
    const detailItem = new St.BoxLayout({
      style_class: 'detail-item-bin',
      x_expand: true,
      y_expand: true
    })

    detailItem.add_child(label)
    detailItem.add_child(value)

    return detailItem
  }

  _createDetailItemLabel (text) {
    const detailItemLabel = new St.Bin({
      style_class: 'detail-item-label-bin',
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.START,
      child: new St.Label({ style_class: 'detail-item-label', text })
    })

    return detailItemLabel
  }

  _createDetailItemValue (text, additionalStyleClass) {
    const detailItemValue = new St.Bin({
      style_class: 'detail-item-value-bin',
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.END,
      child: new St.Label({ style_class: `detail-item-value tar ${additionalStyleClass || ''}`, text: text.toString() })
    })

    return detailItemValue
  }

  _createDetailItemValueForChange (change, currency, changePercent) {
    const detailItem = new St.BoxLayout({
      style_class: 'detail-item-value-box change',
      x_expand: false,
      y_expand: false,
      x_align: Clutter.ActorAlign.END
    })

    const quoteColorStyleClass = getStockColorStyleClass(change)

    const changeLabel = new St.Label({ style_class: `detail-item-value change tar ${quoteColorStyleClass}`, text: `${roundOrDefault(change)}${currency ? ` ${currency}` : ''}` })
    detailItem.add_child(changeLabel)

    detailItem.add_child(new St.Label({ style_class: 'detail-item-value tar', text: ' / ' }))

    const changePercentLabel = new St.Label({ style_class: `detail-item-value change tar ${quoteColorStyleClass}`, text: `${roundOrDefault(changePercent)} %` })
    detailItem.add_child(changePercentLabel)

    return detailItem
  }

  _onDestroy () {
  }
})
