const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { IconButton } = Me.imports.components.buttons.iconButton
const { ButtonGroup } = Me.imports.components.buttons.buttonGroup
const { FlatList } = Me.imports.components.flatList.flatList
const { TransactionCard } = Me.imports.components.cards.transactionCard
const { TransactionSummaryCard } = Me.imports.components.cards.transactionSummaryCard
const { Chart } = Me.imports.components.chart.chart
const { StockDetails } = Me.imports.components.stocks.stockDetails
const { SearchBar } = Me.imports.components.searchBar.searchBar

const { isNullOrEmpty } = Me.imports.helpers.data
const { Translations } = Me.imports.helpers.translations

const FinanceService = Me.imports.services.financeService

const { SettingsHandler } = Me.imports.helpers.settings

var StockTransactionsScreen = GObject.registerClass({
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

    this._sync().catch(e => {
      log(e)
    })
  }

  async _sync () {
    const quoteSummary = await FinanceService.getQuoteSummary({
      symbol: this._passedQuoteSummary.Symbol,
      provider: this._passedQuoteSummary.Provider,
      fallbackName: this._passedQuoteSummary.FullName
    })

    this._quoteSummary = quoteSummary

    this.destroy_all_children()

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
      // clearCache()
      this._sync()
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
          item: this._passedQuoteSummary
        }
      })
    })

    const summaryCard = new TransactionSummaryCard(quoteSummary)
    this._list = new FlatList({ id: 'transactions', persistScrollPosition: false })

    this.add_child(searchBar)

    this.add_child(stockDetailsTabButtonGroup)
    this.add_child(summaryCard)
    this.add_child(this._list)

    this._loadData()
  }

  _loadData () {
    const transactions = (this._settings.transactions[this._portfolioId] || {})[this._quoteSummary.Symbol]

    if (isNullOrEmpty(transactions)) {
      this._list.show_error_info(Translations.NO_SYMBOLS_CONFIGURED_ERROR)
      return
    }

    this._list.clear_list_items()

    transactions.forEach(transaction => {
      this._list.addItem(new TransactionCard({ portfolioId: this._portfolioId, transaction }))
    })
  }
})
