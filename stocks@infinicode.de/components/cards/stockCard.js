import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'
import Pango from 'gi://Pango'

import { isNullOrEmpty, fallbackIfNaN, roundOrDefault, getStockColorStyleClass, toLocalDateFormat } from '../../helpers/data.js'
import { Translations } from '../../helpers/translations.js'
import { MARKET_STATES } from '../../services/meta/generic.js'
import * as TransactionService from '../../services/transactionService.js'

export const StockCard = GObject.registerClass({
  GTypeName: 'StockExtension_StockCard'
}, class StockCard extends St.Button {
  _init (quoteSummary, portfolioId) {
    super._init({
      style_class: 'card message stock-card',
      can_focus: true,
      x_expand: true
    })

    this.cardItem = quoteSummary
    const transactionResult = TransactionService.loadCalculatedTransactionsForSymbol({ portfolioId, quoteSummary })

    const vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const cardHeaderBox = this._createCardHeader()

    vContentBox.add_child(cardHeaderBox)

    if (transactionResult && !isNullOrEmpty(transactionResult.transactions)) {
      const transactionDetails = this._createDetailBox({ quoteSummary, transactionResult })
      vContentBox.add_child(transactionDetails)
    }

    this.connect('destroy', this._onDestroy.bind(this))
    this._sync()
  }

  _createCardHeader () {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    })

    const leftBox = this._createStockInfo()
    const rightBox = this._createQuoteInfo()

    headerBox.add_child(leftBox)
    headerBox.add_child(rightBox)

    return headerBox
  }

  _createStockInfo () {
    const stockInformationBox = new St.BoxLayout({
      style_class: 'stock-information-box',
      x_expand: true,
      vertical: true
    })

    const quoteLabel = new St.Label({
      style_class: 'stock-full-name',
      text: this.cardItem.FullName
    })

    stockInformationBox.add_child(quoteLabel)

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-stock-information-label small-text fwb'
    })

    if (this.cardItem.Error) {
      additionalInformationLabel.text = `${this.cardItem.Error}`
    } else {
      additionalInformationLabel.text = `${this.cardItem.Symbol}  |  ${this.cardItem.ExchangeName || Translations.UNKNOWN}`
    }

    stockInformationBox.add_child(additionalInformationLabel)

    return stockInformationBox
  }

  _createQuoteInfo () {
    const quoteInformationBox = new St.BoxLayout({
      style_class: 'quote-information-box',
      vertical: true
    })

    const quoteInformationPriceBox = new St.BoxLayout({
      style_class: 'quote-information-price-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const regularQuoteLabel = new St.Label({
      style_class: `quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Close)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    quoteInformationPriceBox.add_child(regularQuoteLabel)

    if (this.cardItem.MarketState === MARKET_STATES.PRE) {
      const preMarketQuoteColorStyleClass = getStockColorStyleClass(this.cardItem.PreMarketChange)

      const preMarketQuoteLabel = new St.Label({
        style_class: `quote-label pre-market ${preMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.PreMarketPrice)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}*`
      })

      quoteInformationPriceBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))
      quoteInformationPriceBox.add_child(preMarketQuoteLabel)
    }

    if (this.cardItem.MarketState === MARKET_STATES.POST) {
      const postMarketQuoteColorStyleClass = getStockColorStyleClass(this.cardItem.PostMarketChange)

      const postMarketQuoteLabel = new St.Label({
        style_class: `quote-label post-market ${postMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.PostMarketPrice)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}*`
      })

      quoteInformationPriceBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))
      quoteInformationPriceBox.add_child(postMarketQuoteLabel)
    }

    if (!this.cardItem.Error) {
      quoteInformationBox.add_child(quoteInformationPriceBox)
      quoteInformationBox.add_child(this._createRegularAdditionalInformationBox())

      if (this.cardItem.MarketState === MARKET_STATES.PRE) {
        quoteInformationBox.add_child(this._createPreMarketAdditionalInformationBox())
      }

      if (this.cardItem.MarketState === MARKET_STATES.POST) {
        quoteInformationBox.add_child(this._createPostMarketAdditionalInformationBox())
      }
    }

    return quoteInformationBox
  }

  _createRegularAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteChangeLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Change)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.ChangePercent)} %`
    })

    const placeHolder = new St.Label({
      style_class: 'small-text fwb',
      text: '  |  '
    })

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-quote-information-label small-text fwb',
      text: `  |  ${fallbackIfNaN(Math.round(this.cardItem.Volume / 1000))} k  |  ${toLocalDateFormat(this.cardItem.Timestamp, Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _createPreMarketAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.PreMarketChange)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteChangeLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PreMarketChange)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PreMarketChangePercent)} %`
    })

    const placeHolder = new St.Label({
      style_class: 'small-text fwb',
      text: '  |  '
    })

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-quote-information-label small-text fwb',
      text: ` |  ${Translations.STOCKS.PRE_MARKET}  |  ${toLocalDateFormat(this.cardItem.PreMarketTimestamp, Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _createPostMarketAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.PostMarketChange)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteChangeLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PostMarketChange)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PostMarketChangePercent)} %`
    })

    const placeHolder = new St.Label({
      style_class: 'small-text fwb',
      text: '  |  '
    })

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-quote-information-label small-text fwb',
      text: `  |  ${Translations.STOCKS.POST_MARKET}  |  ${toLocalDateFormat(this.cardItem.PostMarketTimestamp, Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _createDetailBox ({ quoteSummary, transactionResult }) {
    const detailBox = new St.BoxLayout({
      style_class: 'stock-transactions-box',
      x_expand: true,
      y_expand: false
    })

    detailBox.add_child(this._createLeftDetailBox({ quoteSummary, transactionResult }))
    detailBox.add_child(this._createRightDetailBox({ quoteSummary, transactionResult }))

    return detailBox
  }

  _createLeftDetailBox ({ quoteSummary, transactionResult }) {
    const leftDetailBox = new St.BoxLayout({
      style_class: 'stock-left-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.MISC.TODAY),
        this._createDetailItemValueForChange(transactionResult.today, quoteSummary.CurrencySymbol, transactionResult.todayPercent)
    ))

    return leftDetailBox
  }

  _createRightDetailBox ({ quoteSummary, transactionResult }) {
    const rightDetailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    rightDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.MISC.TOTAL),
        this._createDetailItemValueForChange(transactionResult.total, quoteSummary.CurrencySymbol, transactionResult.totalPercent)
    ))

    return rightDetailBox
  }

  _createDetailItem (label, value) {
    const detailItem = new St.BoxLayout({
      style_class: 'detail-item-bin',
      x_expand: true,
      y_expand: false
    })

    detailItem.add_child(label)
    detailItem.add_child(value)

    return detailItem
  }

  _createDetailItemLabel (text) {
    const detailItemLabel = new St.Bin({
      style_class: 'detail-item-label-bin',
      x_expand: true,
      y_expand: false,
      child: new St.Label({ style_class: 'detail-item-label small-text fwb', text })
    })

    return detailItemLabel
  }

  _createDetailItemValueForChange (change, currency, changePercent) {
    const detailItem = new St.BoxLayout({
      style_class: 'detail-item-value-box change',
      x_expand: false,
      y_expand: false,
      x_align: Clutter.ActorAlign.END
    })

    const quoteColorStyleClass = getStockColorStyleClass(change)

    const changeLabel = new St.Label({ style_class: `detail-item-value small-text fwb change tar ${quoteColorStyleClass}`, text: `${roundOrDefault(change)}${currency ? ` ${currency}` : ''}` })
    detailItem.add_child(changeLabel)

    detailItem.add_child(new St.Label({ style_class: 'detail-item-value small-text fwb tar', text: ' / ' }))

    const changePercentLabel = new St.Label({ style_class: `detail-item-value change small-text fwb tar ${quoteColorStyleClass}`, text: `${roundOrDefault(changePercent)} %` })
    detailItem.add_child(changePercentLabel)

    return detailItem
  }

  _sync () {
  }

  _onDestroy () {
  }
})
