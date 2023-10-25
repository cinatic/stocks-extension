import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { ButtonGroup } from '../../buttons/buttonGroup.js'
import { SearchBar } from '../../searchBar/searchBar.js'
import { Translations } from '../../../helpers/translations.js'
import { TRANSACTION_TYPES } from '../../../services/meta/generic.js'
import * as TransactionService from '../../../services/transactionService.js'

export const EditTransactionScreen = GObject.registerClass({
  GTypeName: 'StockExtension_EditTransactionScreen'
}, class EditTransactionScreen extends St.BoxLayout {
  _init ({ portfolioId, quoteSummary, transaction, mainEventHandler }) {
    super._init({
      style_class: 'screen edit-screen edit-transaction-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler
    this.transaction = transaction || {}
    this._saveDelayTimeOutId = null

    this.newTransaction = {
      id: this.transaction.id,
      type: this.transaction.type,
      amount: this.transaction.amount,
      price: this.transaction.price
    }

    this._portfolioId = portfolioId
    this._quoteSummary = quoteSummary

    this._errorPlaceHolder = null

    const searchBar = new SearchBar({
      back_screen_name: 'stock-transactions',
      additionalDataForBackScreen: {
        portfolioId,
        item: quoteSummary
      },
      showFilterInputBox: false,
      showRefreshIcon: false,
      mainEventHandler: this._mainEventHandler
    })

    this.add_child(searchBar)

    this._createForm()

    this.connect('destroy', this._onDestroy.bind(this))
  }

  _createForm () {
    this.add_child(this._createErrorBox())

    this.add_child(this._createFormElement({
      placeholder: Translations.MISC.AMOUNT,
      dataField: 'amount',
      text: this.transaction.amount
    }))

    this.add_child(this._createFormElement({
      placeholder: Translations.STOCKS.PRICE,
      dataField: 'price',
      text: this.transaction.price
    }))

    const selectedDate = this.transaction.date || (new Date()).toISOString().slice(0, -5)

    this.add_child(this._createFormElement({
      placeholder: Translations.MISC.DATE,
      dataField: 'date',
      text: selectedDate
    }))

    this.newTransaction.date = selectedDate

    let selectedTransactionType = TRANSACTION_TYPES.BUY

    if (this.transaction && this.transaction.type) {
      selectedTransactionType = this.transaction.type
    }

    this.newTransaction.type = selectedTransactionType

    const transactionTypeButtonGroup = new ButtonGroup({
      sync_on_click: true,
      y_expand: false,
      buttons: Object.keys(TRANSACTION_TYPES).map(key => {
        const value = TRANSACTION_TYPES[key]

        return {
          label: Translations.STOCKS.TRANSACTION_TYPE[key],
          value: value,
          selected: value === selectedTransactionType
        }
      })
    })

    transactionTypeButtonGroup.connect('clicked', (_, stButton) => {
      this.newTransaction.type = stButton.buttonData.value
    })

    this.add_child(this._createFormElement({
      placeholder: Translations.TRANSACTIONS.TITLE_TRANSACTION_TYPE,
      customFormElement: transactionTypeButtonGroup
    }))

    const saveButton = new St.Button({
      style_class: 'button save-button',
      label: Translations.MISC.SAVE
    })

    saveButton.connect('clicked', () => this._save())

    this.add_child(saveButton)
  }

  _createErrorBox () {
    const errorBox = new St.BoxLayout({
      style_class: 'error-box p05',
      x_align: Clutter.ActorAlign.CENTER
    })

    this._errorPlaceHolder = new St.Label({
      style_class: 'fwb error-place-holder',
      text: ''
    })

    errorBox.add_child(this._errorPlaceHolder)

    return errorBox
  }

  _createFormElement ({ text, placeholder, dataField, customFormElement }) {
    const formElementbox = new St.BoxLayout({
      style_class: 'form-element-box',
      vertical: true
    })

    const label = new St.Label({
      style_class: 'form-element-label',
      text: `${placeholder}:`
    })

    formElementbox.add_child(label)

    if (customFormElement) {
      formElementbox.add_child(customFormElement)
    } else {
      const formElement = new St.Entry({
        style_class: 'form-element-entry',
        hint_text: placeholder,
        text: (text || '').toString(),
        can_focus: true
      })

      formElement.connect('notify::text', entry => {
        this.newTransaction[dataField] = entry.text
      })

      formElementbox.add_child(formElement)
    }

    return formElementbox
  }

  _save () {
    const error = TransactionService.validate(this.newTransaction)

    if (error) {
      this._errorPlaceHolder.text = error
    } else {
      TransactionService.save({ portfolioId: this._portfolioId, transaction: this.newTransaction, symbol: this._quoteSummary.Symbol })

      // FIXME: had to set this timeout otherwise some weird stuff will happen
      // clutter_actor_contains: assertion 'CLUTTER_IS_ACTOR (descendant)' failed
      this._saveDelayTimeOutId = setTimeout(() => {
        this._mainEventHandler.emit('show-screen', {
          screen: 'stock-transactions',
          additionalData: {
            portfolioId: this._portfolioId,
            item: this._quoteSummary
          },
        })
      }, 250)
    }
  }

  _onDestroy () {
    if (this._saveDelayTimeOutId) {
      clearTimeout(this._saveDelayTimeOutId)
    }
  }
})
