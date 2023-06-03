const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { Translations } = Me.imports.helpers.translations

const { NewItemModel } = Me.imports.components.settings.subcomponents.newItemModel
const { NewPortfolioRow } = Me.imports.components.settings.subcomponents.newPortfolioRow
const { PortfolioModelList } = Me.imports.components.settings.subcomponents.portfolioModelList
const { PortfolioRow } = Me.imports.components.settings.subcomponents.portfolioRow

const { SymbolsListPage } = Me.imports.components.settings.symbolsListPage

const { SubPage } = Me.imports.components.settings.subcomponents.subPage

var PortfolioListPage = GObject.registerClass({
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
