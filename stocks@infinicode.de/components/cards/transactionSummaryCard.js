import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { roundOrDefault, getStockColorStyleClass } from '../../helpers/data.js'
import { Translations } from '../../helpers/translations.js'


export const TransactionSummaryCard = GObject.registerClass({
  GTypeName: 'StockExtension_TransactionSummaryCard'
}, class TransactionSummaryCard extends St.Button {
  _init (quoteSummary, transactionResult) {
    super._init({
      style_class: 'card message stock-card',
      can_focus: true,
      x_expand: true
    })

    this.cardItem = quoteSummary
    this._transaction = transactionResult

    const vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const cardHeaderBox = this._createCardHeader()
    const detailBox = this._createDetailBox({ quoteSummary, transactionResult })

    vContentBox.add_child(cardHeaderBox)
    vContentBox.add_child(detailBox)

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
      style_class: 'fwb stock-full-name',
      text: this.cardItem.FullName
    })

    stockInformationBox.add_child(quoteLabel)

    return stockInformationBox
  }

  _createQuoteInfo () {
    const quoteInformationBox = new St.BoxLayout({
      style_class: 'quote-information-box',
      vertical: true
    })

    const quoteInformationPriceBox = this._createRegularAdditionalInformationBox()

    if (!this.cardItem.Error) {
      quoteInformationBox.add_child(quoteInformationPriceBox)
    }

    return quoteInformationBox
  }

  _createRegularAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const infoBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const regularQuoteLabel = new St.Label({
      style_class: `quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Close)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangeLabel = new St.Label({
      style_class: `fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Change)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.ChangePercent)} %`
    })

    const openBracket = new St.Label({
      style_class: 'fwb',
      text: ' ('
    })

    const closeBracket = new St.Label({
      style_class: 'fwb',
      text: ')'
    })

    const placeHolder = new St.Label({
      style_class: 'fwb',
      text: ' | '
    })

    infoBox.add_child(regularQuoteLabel)
    infoBox.add_child(openBracket)
    infoBox.add_child(quoteChangeLabel)
    infoBox.add_child(placeHolder)
    infoBox.add_child(quoteChangePercentLabel)
    infoBox.add_child(closeBracket)

    return infoBox
  }

  _createDetailBox ({ quoteSummary, transactionResult }) {
    const detailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
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

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.VALUE),
        this._createDetailItemValue(`${roundOrDefault(transactionResult.value, '--')} ${quoteSummary.CurrencySymbol}`)
    ))

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.MISC.ALLTIME),
        this._createDetailItemValueForChange(transactionResult.alltime, quoteSummary.CurrencySymbol, transactionResult.alltimePercent)
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

    rightDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.COST),
        this._createDetailItemValue(`${roundOrDefault(transactionResult.unrealizedCost, '--')} ${quoteSummary.CurrencySymbol}`)
    ))

    rightDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.REALIZED),
        this._createDetailItemValueForChange(transactionResult.realized, quoteSummary.CurrencySymbol, transactionResult.realizedPercent)
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
      child: new St.Label({ style_class: 'detail-item-label', text })
    })

    return detailItemLabel
  }

  _createDetailItemValue (text, additionalStyleClass) {
    const detailItemValue = new St.Bin({
      style_class: 'detail-item-value-bin',
      x_expand: true,
      y_expand: false,
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

  _sync () {
  }

  _onDestroy () {
  }
})
