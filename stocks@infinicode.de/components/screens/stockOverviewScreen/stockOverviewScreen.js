const { GObject, St } = imports.gi

const Mainloop = imports.mainloop

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { EventHandler } = Me.imports.helpers.eventHandler
const { FlatList } = Me.imports.components.flatList.flatList
const { StockCard } = Me.imports.components.cards.stockCard
const { SearchBar } = Me.imports.components.searchBar.searchBar
const { setTimeout, clearTimeout } = Me.imports.helpers.components
const { removeCache } = Me.imports.helpers.data

const {
  Settings,
  STOCKS_SYMBOL_PAIRS,
  STOCKS_USE_PROVIDER_INSTRUMENT_NAMES
} = Me.imports.helpers.settings

const { Translations } = Me.imports.helpers.translations

const FinanceService = Me.imports.services.financeService


const SETTING_KEYS_TO_REFRESH = [
  STOCKS_SYMBOL_PAIRS,
  STOCKS_USE_PROVIDER_INSTRUMENT_NAMES
]

var StockOverviewScreen = GObject.registerClass({
  GTypeName: 'StockExtension_StockOverviewScreen'
}, class StockOverviewScreen extends St.BoxLayout {
  _init () {
    super._init({
      style_class: 'screen stock-overview-screen',
      vertical: true
    })

    this._isRendering = false
    this._showLoadingInfoTimeoutId = null
    this._autoRefreshTimeoutId = null

    const searchBar = new SearchBar()
    this._list = new FlatList()

    this.add_child(searchBar)
    this.add_child(this._list)

    this.connect('destroy', this._onDestroy.bind(this))

    searchBar.connect('refresh', () => {
      removeCache('summary_')
      this._loadData()
    })

    searchBar.connect('text-change', (sender, searchText) => this._filter_results(searchText))

    this._settingsChangedId = Settings.connect('changed', (value, key) => {
      if (SETTING_KEYS_TO_REFRESH.includes(key)) {
        this._loadData()
      }
    })

    this._list.connect('clicked-item', (sender, item) => EventHandler.emit('show-screen', {
      screen: 'stock-details',
      additionalData: {
        item: item.cardItem
      }
    }))

    this._loadData()

    this._registerTimeout()
  }

  _filter_results (searchText) {
    const listItems = this._list.items

    listItems.forEach(item => {
      const data = item.cardItem

      if (!searchText) {
        item.visible = true
        return
      }

      const searchContent = `${data.FullName} ${data.ExchangeName} ${data.Symbol}`.toUpperCase()

      item.visible = searchContent.includes(searchText.toUpperCase())
    })
  }

  _registerTimeout () {
    this._autoRefreshTimeoutId = Mainloop.timeout_add_seconds(Settings.ticker_interval || 10, () => {
      this._loadData()

      return true
    })
  }

  async _loadData () {
    if (this._showLoadingInfoTimeoutId || this._isRendering) {
      return
    }

    if (!Settings.symbol_pairs) {
      this._list.show_error_info(Translations.NO_SYMBOLS_CONFIGURED_ERROR)
      return
    }

    this._isRendering = true

    this._showLoadingInfoTimeoutId = setTimeout(() => this._list.show_loading_info(), 500)

    const quoteSummaries = await Promise.all(
        Settings.symbol_pairs.map(symbolData => FinanceService.getQuoteSummary({
          ...symbolData,
          fallbackName: symbolData.name
        }))
    )

    this._showLoadingInfoTimeoutId = clearTimeout(this._showLoadingInfoTimeoutId)

    this._list.clear_list_items()

    quoteSummaries.forEach(quoteSummary => {
      this._list.addItem(new StockCard(quoteSummary))
    })

    this._isRendering = false
  }

  _onDestroy () {
    if (this._autoRefreshTimeoutId) {
      Mainloop.source_remove(this._autoRefreshTimeoutId)
    }

    if (this._settingsChangedId) {
      Settings.disconnect(this._settingsChangedId)
    }
  }
})
