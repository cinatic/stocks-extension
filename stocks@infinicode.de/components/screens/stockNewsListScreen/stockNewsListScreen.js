import GObject from 'gi://GObject'
import St from 'gi://St'
import Gio from 'gi://Gio'

import { ButtonGroup } from '../../buttons/buttonGroup.js'
import { NewsCard } from '../../cards/newsCard.js'
import { FlatList } from '../../flatList/flatList.js'
import { SearchBar } from '../../searchBar/searchBar.js'

import { removeCache } from '../../../helpers/data.js'

import * as FinanceService from '../../../services/financeService.js'

export const StockNewsListScreen = GObject.registerClass({
  GTypeName: 'StockExtension_StockNewsListScreen'
}, class StockNewsListScreen extends St.BoxLayout {
  _init ({ quoteSummary, portfolioId, mainEventHandler }) {
    super._init({
      style_class: 'screen stock-details-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler
    this._passedQuoteSummary = quoteSummary
    this._portfolioId = portfolioId

    this._isRendering = false
    this._showLoadingInfoTimeoutId = null

    this._searchBar = new SearchBar({ back_screen_name: 'overview', mainEventHandler: this._mainEventHandler })
    this._list = new FlatList()

    const stockDetailsTabButtonGroup = new ButtonGroup({
      style_class: 'stock-details-tab-button-group',
      enableScrollbar: false,
      y_expand: false,
      buttons: ['KeyData', 'Transactions', 'NewsList'].map(tabKey => ({
        label: tabKey,
        value: tabKey,
        selected: tabKey === 'NewsList'
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
          portfolioId: this._portfolioId,
          item: this._passedQuoteSummary
        }
      })
    })

    this.add_child(this._searchBar)
    this.add_child(stockDetailsTabButtonGroup)
    this.add_child(this._list)

    this.connect('destroy', this._onDestroy.bind(this))

    this._searchBar.connect('refresh', () => {
      removeCache(`news_${this._passedQuoteSummary.Provider}_${this._passedQuoteSummary.Symbol}`)
      this._loadData().catch(e => log(e))
    })

    this._searchBar.connect('text-change', (sender, searchText) => this._filter_results(searchText))

    this._list.connect('clicked-item', (sender, item) => Gio.AppInfo.launch_default_for_uri_async(item.cardItem.Link, null, null, null))

    this._loadData().catch(e => log(e))
  }

  async _loadData () {
    if (this._showLoadingInfoTimeoutId || this._isRendering) {
      return
    }

    this._isRendering = true

    this._showLoadingInfoTimeoutId = setTimeout(() => this._list.show_loading_info(), 500)

    const newsList = await FinanceService.getNewsList({
      symbol: this._passedQuoteSummary.Symbol,
      provider: this._passedQuoteSummary.Provider,
    })

    const themeNode = this.get_theme_node()
    const fgColor = themeNode.get_foreground_color().to_string().substring(0, 7)

    this._showLoadingInfoTimeoutId = clearTimeout(this._showLoadingInfoTimeoutId)

    this._list.clear_list_items()

    newsList.Items.forEach(quoteSummary => {
      this._list.addItem(new NewsCard(quoteSummary, fgColor))
    })

    this._filter_results(this._searchBar.search_text())

    this._isRendering = false
  }

  _filter_results (searchText) {
    const listItems = this._list.items

    listItems.forEach(item => {
      const data = item.cardItem

      if (!searchText) {
        item.visible = true
        return
      }

      const searchContent = `${data.Title} ${data.Description}`.toUpperCase()

      item.visible = searchContent.includes(searchText.toUpperCase())
    })
  }

  _onDestroy () {
    if (this._showLoadingInfoTimeoutId) {
      clearTimeout(this._showLoadingInfoTimeoutId)
    }
  }
})
