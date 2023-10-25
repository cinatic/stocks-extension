import GObject from 'gi://GObject'
import Gio from 'gi://Gio'


import { StockItem } from './stockItem.js'

import { SettingsHandler, STOCKS_SYMBOL_PAIRS, } from '../../../helpers/settings.js'
import { Translations } from '../../../helpers/translations.js'

import { FINANCE_PROVIDER } from '../../../services/meta/generic.js'

const SETTING_KEYS_TO_REFRESH = [
  STOCKS_SYMBOL_PAIRS
]

export const SymbolModelList = GObject.registerClass({
  GTypeName: 'StockExtension-SymbolModelList',
}, class SymbolModelList extends GObject.Object {
  static [GObject.interfaces] = [Gio.ListModel]

  #items = []
  #changedId

  constructor (portfolioId) {
    super()

    this._portfolioId = portfolioId
    this._settings = new SettingsHandler()
    this.#items = this.convert_items()

    this.#changedId =
        this._settings.connect('changed', (value, key) => {
          if (!SETTING_KEYS_TO_REFRESH.includes(key)) {
            return
          }

          const removed = this.#items.length

          this.#items = this.convert_items()

          this.items_changed(0, removed, this.#items.length)
        })
  }

  convert_items () {
    return this._settings.symbolsByPortfolio(this._portfolioId).map(item => {
      const stockItem = new StockItem()

      stockItem.id = item.id || Gio.dbus_generate_guid()
      stockItem.name = item.name
      stockItem.symbol = item.symbol
      stockItem.provider = item.provider
      stockItem.showInTicker = item.showInTicker

      return stockItem
    })
  }

  append () {
    const name = Translations.SETTINGS.DEFAULT_NAME.format(this.#items.length + 1)

    const newStockItem = new StockItem()

    newStockItem.id = Gio.dbus_generate_guid()
    newStockItem.name = name
    newStockItem.symbol = 'AHLA.DE'
    newStockItem.provider = FINANCE_PROVIDER.YAHOO
    newStockItem.showInTicker = false

    this.#items.push(newStockItem)

    // https://gitlab.gnome.org/GNOME/gnome-shell-extensions/-/issues/390
    // this does not cause scroll to top / whole list refresh
    this.items_changed(this.#items.length - 1, 0, 1)

    this.save_items()
  }

  remove (id) {
    const pos = this.#items.findIndex(item => item.id === id)

    if (pos === -1) {
      return
    }

    this.#items.splice(pos, 1)

    // https://gitlab.gnome.org/GNOME/gnome-shell-extensions/-/issues/390
    // this does cause scroll to top / whole list refresh
    this.items_changed(pos, 1, 0)

    this.save_items()
  }

  edit (id, name, symbol, showInTicker, provider) {
    const pos = this.#items.findIndex(item => item.id === id)

    if (pos === -1) {
      return
    }

    const [modifiedItem] = this.#items.splice(pos, 1)
    this.items_changed(pos, 1, 0)

    modifiedItem.name = name
    modifiedItem.symbol = symbol
    modifiedItem.showInTicker = showInTicker
    modifiedItem.provider = provider

    this.#items.splice(pos, 0, modifiedItem)

    this.items_changed(pos, 0, 1)

    this.save_items()
  }

  move (movingItemId, targetId) {
    const movingItemPos = this.#items.findIndex(item => item.id === movingItemId)
    const targetPos = this.#items.findIndex(item => item.id === targetId)

    if (movingItemPos < 0 || targetPos < 0) {
      return
    }

    const [movedItem] = this.#items.splice(movingItemPos, 1)
    this.items_changed(movingItemPos, 1, 0)

    this.#items.splice(targetPos, 0, movedItem)
    this.items_changed(targetPos, 0, 1)

    this.save_items()
  }

  save_items () {
    this._settings.updatePortfolioById(this._portfolioId, null, this.#items)
  }

  vfunc_get_item_type () {
    return StockItem
  }

  vfunc_get_n_items () {
    return this.#items.length
  }

  vfunc_get_item (pos) {
    return this.#items[pos]
  }
})
