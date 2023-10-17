import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'

import { Translations } from '../../helpers/translations.js'

import { NewItemModel } from './subcomponents/newItemModel.js'
import { NewPortfolioRow } from './subcomponents/newPortfolioRow.js'
import { PortfolioModelList } from './subcomponents/portfolioModelList.js'
import { PortfolioRow } from './subcomponents/portfolioRow.js'

import { SymbolsListPage } from './symbolsListPage.js'
import { SubPage } from './subcomponents/subPage.js'

export const PortfolioListPage = GObject.registerClass({
      GTypeName: 'StockExtension-PortfolioListPage',
    },
    class PortfoliosListPreferencePage extends Adw.PreferencesPage {
      _init () {
        super._init({
          title: Translations.SETTINGS.TITLE_PORTFOLIOS,
          icon_name: 'view-list-symbolic',
          name: 'PortfolioListPage'
        })

        const preferenceGroup = new PortfolioListPreferenceGroup()
        this.add(preferenceGroup)
      }
    })

class PortfolioListPreferenceGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass({ GTypeName: 'StockExtension-PortfolioPreferenceGroup' }, this)

    this.install_action('portfolio.add', null, self => self._portfolioModelList.append())
    this.install_action('portfolio.remove', 's', (self, name, param) => self._portfolioModelList.remove(param.unpack()))
    this.install_action('portfolio.edit', '(ss)', (self, name, param) => {
      const data = param.deepUnpack()

      self._portfolioModelList.edit(...data)
    })
  }

  constructor () {
    super({
      title: Translations.SETTINGS.TITLE_PORTFOLIOS_LIST,
    })

    this._portfolioModelList = new PortfolioModelList()

    const store = new Gio.ListStore({ item_type: Gio.ListModel })
    const listModel = new Gtk.FlattenListModel({ model: store })
    store.append(this._portfolioModelList)
    store.append(new NewItemModel())

    this._list = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ['boxed-list'],
    })

    this._list.connect('row-activated', (l, row) => {
      const window = this.get_root()

      const subPage = new SubPage(`${row.item.name || '-'} Symbols`, new SymbolsListPage(row.item))

      window.present_subpage(subPage)
    })

    this.add(this._list)

    this._list.bind_model(listModel, item => {
      return !item.id
          ? new NewPortfolioRow()
          : new PortfolioRow(item, this._portfolioModelList)
    })
  }
}
