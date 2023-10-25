import GObject from 'gi://GObject'
import St from 'gi://St'

import { IconButton } from '../../buttons/iconButton.js'
import { ButtonGroup } from '../../buttons/buttonGroup.js'
import { FlatList } from '../../flatList/flatList.js'
import { TransactionCard } from '../../cards/transactionCard.js'
import { TransactionSummaryCard } from '../../cards/transactionSummaryCard.js'
import { SearchBar } from '../../searchBar/searchBar.js'

import { isNullOrEmpty } from '../../../helpers/data.js'
import { Translations } from '../../../helpers/translations.js'

import * as FinanceService from '../../../services/financeService.js'
import * as TransactionService from '../../../services/transactionService.js'

import {
  SettingsHandler,
  STOCKS_PORTFOLIOS,
  STOCKS_SYMBOL_PAIRS,
  STOCKS_TRANSACTIONS
} from '../../../helpers/settings.js'

const SETTING_KEYS_TO_REFRESH = [
  STOCKS_SYMBOL_PAIRS,
  STOCKS_PORTFOLIOS,
  STOCKS_TRANSACTIONS
]

export const StockTransactionsScreen = GObject.registerClass({
  GTypeName: 'StockExtension_StockTransactionsScreen'
}, class StockTransactionsScreen extends St.BoxLayout {
  _init ({ portfolioId, quoteSummary, mainEventHandler }) {
    super._init({
      style_class: 'screen stock-details-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler

    this._passedQuoteSummary = quoteSummary
    this._portfolioId = portfolioId
    this._quoteSummary = null

    this._settings = new SettingsHandler()

    const searchBar = new SearchBar({
      back_screen_name: 'overview',
      showFilterInputBox: false,
      mainEventHandler: this._mainEventHandler,
      additionalIcons: [
        new IconButton({
          style_class: 'create-icon',
          icon_name: 'list-add-symbolic',
          icon_size: 22,
          onClick: () => {
            this._mainEventHandler.emit('show-screen', {
              screen: 'edit-transaction',
              additionalData: {
                portfolioId: this._portfolioId,
                item: quoteSummary
              }
            })
          }
        })
      ]
    })

    searchBar.connect('refresh', () => {
      this._sync().catch(e => log(e))
    })

    this._content = new St.BoxLayout({
      y_expand: true,
      x_expand: true,
      vertical: true
    })

    const stockDetailsTabButtonGroup = new ButtonGroup({
      style_class: 'stock-details-tab-button-group',
      enableScrollbar: false,
      y_expand: false,
      buttons: ['KeyData', 'Transactions', 'NewsList'].map(tabKey => ({
        label: tabKey,
        value: tabKey,
        selected: tabKey === 'Transactions'
      }))
    })

    stockDetailsTabButtonGroup.connect('clicked', (_, stButton) => {
      const selectedTab = stButton.buttonData.value

      let screen

      if (selectedTab === 'KeyData') {
        screen = 'stock-details'
      } else if (selectedTab === 'Transactions') {
        screen = 'stock-transactions'
      } else {
        screen = 'stock-news-list'
      }

      this._mainEventHandler.emit('show-screen', {
        screen,
        additionalData: {
          item: this._passedQuoteSummary,
          portfolioId: this._portfolioId
        }
      })
    })

    this.add_child(searchBar)
    this.add_child(stockDetailsTabButtonGroup)
    this.add_child(this._content)

    this._settingsChangedId = this._settings.connect('changed', (value, key) => {
      if (SETTING_KEYS_TO_REFRESH.includes(key)) {
        this._sync().catch(e => log(e))
      }
    })

    this.connect('destroy', this._onDestroy.bind(this))

    this._sync().catch(e => log(e))
  }

  async _sync () {
    const quoteSummary = await FinanceService.getQuoteSummary({
      symbol: this._passedQuoteSummary.Symbol,
      provider: this._passedQuoteSummary.Provider,
      fallbackName: this._passedQuoteSummary.FullName
    })

    this._quoteSummary = quoteSummary
    const transactionResult = TransactionService.loadCalculatedTransactionsForSymbol({ portfolioId: this._portfolioId, quoteSummary: this._quoteSummary })

    this._content.destroy_all_children()

    const summaryCard = new TransactionSummaryCard(quoteSummary, transactionResult)
    this._list = new FlatList({ id: 'transactions', persistScrollPosition: false })

    this._content.add_child(summaryCard)
    this._content.add_child(this._list)

    this._loadData(transactionResult)
  }

  _loadData (transactionResult) {

    if (isNullOrEmpty(transactionResult) || isNullOrEmpty(transactionResult.transactions)) {
      this._list.show_error_info(Translations.TRANSACTIONS.NO_TRANSACTIONS_ERROR)
      return
    }

    this._list.clear_list_items()

    transactionResult.transactions.forEach(transaction => {
      this._list.addItem(new TransactionCard({ portfolioId: this._portfolioId, transaction, quoteSummary: this._quoteSummary, mainEventHandler: this._mainEventHandler }))
    })
  }

  _onDestroy () {
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
    }
  }
})
