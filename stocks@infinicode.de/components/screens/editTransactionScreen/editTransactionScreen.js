const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { ButtonGroup } = Me.imports.components.buttons.buttonGroup
const { SearchBar } = Me.imports.components.searchBar.searchBar
const { Translations } = Me.imports.helpers.translations
const { TRANSACTION_TYPES } = Me.imports.services.meta.generic

const { SettingsHandler } = Me.imports.helpers.settings

var EditTransactionScreen = GObject.registerClass({
  GTypeName: 'StockExtension_EditTransactionScreen'
}, class EditTransactionScreen extends St.BoxLayout {
  _init ({ portfolioId, quoteSummary, transactionItem, mainEventHandler }) {
    super._init({
      style_class: 'screen edit-screen edit-transaction-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler
    this.transaction = transactionItem || {}
    this.newTransaction = { ...transactionItem }
    this._portfolioId = portfolioId
    this._quoteSummary = quoteSummary

    this._settings = new SettingsHandler()

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

    let formElement

    if (customFormElement) {
      formElement = customFormElement
    } else {
      formElement = new St.Entry({
        style_class: 'form-element-entry',
        hint_text: placeholder,
        text: text || '',
        can_focus: true
      })

      formElement.connect('notify::text', entry => {
        this.newTransaction[dataField] = entry.text
      })
    }

    formElementbox.add_child(label)
    formElementbox.add_child(formElement)

    return formElementbox
  }

  _save () {
    const error = this.validateTransaction()
    log(JSON.stringify(this.newTransaction, null, 4))

    if (error) {
      this._errorPlaceHolder.text = error
    } else {
      const transactions = this._settings.transactions
      const transactionsByPortfolio = transactions[this._portfolioId] || {}
      const transactionsBySymbol = transactionsByPortfolio[this._quoteSummary.Symbol] || []

      // slice if necesaary
      transactionsBySymbol.push(this.newTransaction)

      transactionsByPortfolio[this._quoteSummary.Symbol] = transactionsBySymbol
      transactions[this._portfolioId] = transactionsByPortfolio

      this._settings.transactions = transactions

      this._mainEventHandler.emit('show-screen', {
        screen: 'stock-transactions',
        additionalDataForBackScreen: {
          portfolioId: this._portfolioId,
          item: this._quoteSummary
        },
      })
    }
  }

  validateTransaction () {
    if (isNaN(parseInt(this.newTransaction.amount))) {
      return Translations.TRANSACTIONS.INVALID_AMOUNT
    }

    if (isNaN(parseFloat(this.newTransaction.price))) {
      return Translations.TRANSACTIONS.INVALID_PRICE
    }

    const timestamp = Date.parse(this.newTransaction.date)

    if (isNaN(timestamp)) {
      return Translations.TRANSACTIONS.INVALID_DATE
    }
  }

  _onDestroy () {
  }
})
