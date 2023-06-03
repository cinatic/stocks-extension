const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { Translations } = Me.imports.helpers.translations
const { SettingsHandler } = Me.imports.helpers.settings

const { NewItemModel } = Me.imports.components.settings.subcomponents.newItemModel
const { NewSymbolRow } = Me.imports.components.settings.subcomponents.newSymbolRow
const { SymbolModelList } = Me.imports.components.settings.subcomponents.symbolModelList
const { SymbolRow } = Me.imports.components.settings.subcomponents.symbolRow

var SymbolsListPage = GObject.registerClass({
      GTypeName: 'StockExtension-SymbolsListPage',
    },
    class SymbolsListPreferencePage extends Adw.PreferencesPage {
      _init (portfolioItem) {
        super._init({
          title: Translations.SETTINGS.TITLE_SYMBOLS,
          icon_name: 'view-list-symbolic',
          name: 'SymbolsListPage'
        })

        const preferenceGroup = new SymbolListPreferenceGroup(portfolioItem)
        this.add(preferenceGroup)
      }
    })

class SymbolListPreferenceGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass({ GTypeName: 'StockExtension-SymbolListPreferenceGroup' }, this)

    this.install_action('symbol.add', null, self => self._symbolModelList.append())
    this.install_action('symbol.remove', 's', (self, name, param) => self._symbolModelList.remove(param.unpack()))
    this.install_action('symbol.edit', '(ss)', (self, name, param) => {
      const data = param.deepUnpack()

      self._symbolModelList.edit(...data)
    })
  }

  constructor (portfolioItem) {
    super()

    let symbols = []
    this._settings = new SettingsHandler()

    try {
      symbols = JSON.parse(portfolioItem.symbols || '[]')
    } catch (e) {
    }

    this._symbolModelList = new SymbolModelList(portfolioItem.id, symbols)

    const store = new Gio.ListStore({ item_type: Gio.ListModel })
    const listModel = new Gtk.FlattenListModel({ model: store })
    store.append(this._symbolModelList)
    store.append(new NewItemModel())

    const listNameEntryRow = new Adw.EntryRow({
      title: Translations.SETTINGS.PORTFOLIO_NAME,
      text: portfolioItem.name
    })

    listNameEntryRow.connect('changed', () => {
      this._settings.updatePortfolioById(portfolioItem.id, listNameEntryRow.get_text())
    })

    this.add(listNameEntryRow)

    this._list = new Gtk.ListBox({
      margin_top: 4,
      margin_end: 4,
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ['boxed-list'],
    })
    this._list.connect('row-activated', (l, row) => row.edit())
    this.add(this._list)

    this._list.bind_model(listModel, item => {
      return !item.id
          ? new NewSymbolRow()
          : new SymbolRow(item, this._symbolModelList)
    })
  }
}
