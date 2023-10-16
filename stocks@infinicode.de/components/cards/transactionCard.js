import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { IconButton } from '../buttons/iconButton.js'
import { roundOrDefault, getStockColorStyleClass } from '../../helpers/data.js'
import { Translations } from '../../helpers/translations.js'
import { TRANSACTION_TYPES } from '../../services/meta/generic.js'

import * as TransactionService from '../../services/transactionService.js'

export const TransactionCard = GObject.registerClass({
  GTypeName: 'StockExtension_TransactionCard'
}, class TransactionCard extends St.Button {
  _init ({ portfolioId, transaction, quoteSummary, mainEventHandler }) {
    super._init({
      style_class: 'card message transaction-card',
      can_focus: true,
      x_expand: true
    })

    this.cardItem = transaction || {}
    this._quoteSummary = quoteSummary
    this._portfolioId = portfolioId
    this._mainEventHandler = mainEventHandler

    const vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const cardHeaderBox = this._createCardHeader()
    vContentBox.add_child(cardHeaderBox)

    if (this.cardItem.type === TRANSACTION_TYPES.BUY) {
      const detailBox = this._createDetailBox({ transaction, quoteSummary })
      vContentBox.add_child(detailBox)
    }

    this.connect('destroy', this._onDestroy.bind(this))
    this._sync()
  }

  _createCardHeader () {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    })

    const leftBox = this._createStockInfo()
    const quickIconBox = this._createQuickIconBox()

    headerBox.add_child(leftBox)
    headerBox.add_child(quickIconBox)

    return headerBox
  }

  _createStockInfo () {
    const stockInformationBox = new St.BoxLayout({
      style_class: 'stock-information-box',
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      vertical: true
    })

    const quoteLabel = new St.Label({
      style_class: 'stock-full-name',
      text: `${this.cardItem.amount} @ ${this.cardItem.price} (${this.cardItem.type} | ${this.cardItem.date})`
    })

    stockInformationBox.add_child(quoteLabel)

    if (this.cardItem.type === TRANSACTION_TYPES.SELL && this.cardItem.sold !== this.cardItem.amount) {
      const additionalInformationLabel = new St.Label({
        style_class: 'additional-stock-information-label small-text fwb'
      })

      additionalInformationLabel.text = `${Translations.TRANSACTIONS.UNSOLD_ITEMS.format(this.cardItem.amount - this.cardItem.sold)}`

      stockInformationBox.add_child(additionalInformationLabel)
    }

    return stockInformationBox
  }

  _createQuickIconBox () {
    const quickIconBox = new St.BoxLayout({
      style_class: 'content-box',
      y_expand: false,
      y_align: Clutter.ActorAlign.CENTER
    })

    const startTaskIconButton = new IconButton({
      isCustomIcon: false,
      icon_name: 'user-trash-symbolic',
      style_class: 'button quick-action',
      icon_size: 14,
      onClick: () => this._removeItem()
    })

    quickIconBox.add_child(startTaskIconButton)

    const editTaskIconButton = new IconButton({
      isCustomIcon: false,
      icon_name: 'document-edit-symbolic',
      style_class: 'button quick-action',
      icon_size: 14,
      onClick: () => this._editItem()
    })

    quickIconBox.add_child(editTaskIconButton)

    return quickIconBox
  }

  _createDetailBox ({ transaction, quoteSummary }) {
    const detailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
      x_expand: true,
      y_expand: false
    })

    detailBox.add_child(this._createLeftDetailBox({ transaction, quoteSummary }))
    detailBox.add_child(this._createRightDetailBox({ transaction, quoteSummary }))

    return detailBox
  }

  _createLeftDetailBox ({ transaction, quoteSummary }) {
    const leftDetailBox = new St.BoxLayout({
      style_class: 'stock-left-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.MISC.TODAY),
        this._createDetailItemValueForChange(transaction.today, quoteSummary.CurrencySymbol, transaction.todayPercent)
    ))

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.VALUE),
        this._createDetailItemValue(`${roundOrDefault(transaction.value, '--')} ${quoteSummary.CurrencySymbol}`)
    ))

    leftDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.REALIZED),
        this._createDetailItemValueForChange(transaction.realized, quoteSummary.CurrencySymbol, transaction.realizedPercent)
    ))

    return leftDetailBox
  }

  _createRightDetailBox ({ transaction, quoteSummary }) {
    const rightDetailBox = new St.BoxLayout({
      style_class: 'stock-details-box',
      x_expand: true,
      y_expand: false,
      vertical: true
    })

    rightDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.MISC.TOTAL),
        this._createDetailItemValueForChange(transaction.total, quoteSummary.CurrencySymbol, transaction.totalPercent)
    ))

    rightDetailBox.add(this._createDetailItem(
        this._createDetailItemLabel(Translations.STOCKS.COST),
        this._createDetailItemValue(`${roundOrDefault(transaction.cost, '--')} ${quoteSummary.CurrencySymbol}`)
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

  _editItem () {
    this._mainEventHandler.emit('show-screen', {
      screen: 'edit-transaction',
      additionalData: {
        portfolioId: this._portfolioId,
        item: this._quoteSummary,
        transaction: this.cardItem
      }
    })
  }

  _removeItem () {
    TransactionService.remove({ portfolioId: this._portfolioId, transaction: this.cardItem, symbol: this._quoteSummary.Symbol })
  }

  _sync () {
  }

  _onDestroy () {
  }
})
