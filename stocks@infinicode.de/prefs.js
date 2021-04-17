const { Gio, GObject, Gtk } = imports.gi

const Config = imports.misc.config
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { getSettings, Settings } = Me.imports.helpers.settings

const { isNullOrEmpty, isNullOrUndefined } = Me.imports.helpers.data
const { initTranslations, Translations } = Me.imports.helpers.translations
const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

const EXTENSIONDIR = Me.dir.get_path()

var PrefsWidget = GObject.registerClass({
  GTypeName: 'StocksExtension_PrefsWidget'
}, class Widget extends Gtk.Box {

  /********** Properties ******************/

  _init (params = {}) {
    super._init(Object.assign(params, {
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 0
    }))

    this._treeViewItemHasDropped = false

    this.Window = new Gtk.Builder()

    this.loadConfig()
    this.initWindow()

    if (isGnome4()) {
      this.append(this.MainWidget)
    } else {
      this.add(this.MainWidget)
    }

    if (isGnome4()) {
      // FIXME: what happened with drag & drop on treeview???
    } else {
      this.treeview.connect('drag-drop', () => {
        this._treeViewItemHasDropped = true
      })
    }

    this.liststore.connect('row-deleted', () => {
      if (this._treeViewItemHasDropped) {
        this._treeViewItemHasDropped = false
        const treeModel = this.treeview.get_model()

        const newStockModels = []

        treeModel.foreach((model, path, iter) => {
          newStockModels.push({
            name: model.get_value(iter, 0),
            symbol: model.get_value(iter, 1),
            provider: model.get_value(iter, 2),
            showInTicker: model.get_value(iter, 3)
          })
        })

        Settings.symbol_pairs = newStockModels
      }
    })
  }

  initWindow () {
    let uiFile = EXTENSIONDIR + '/settings.ui'

    if (isGnome4()) {
      uiFile = EXTENSIONDIR + '/settings_40.ui'
    }

    this.Window.add_from_file(uiFile)
    this.MainWidget = this.Window.get_object('main-widget')

    const gtkConfigObjects = this.Window.get_objects()

    gtkConfigObjects.forEach(gtkWidget => {
      const gtkUiIdentifier = getWidgetUiIdentifier(gtkWidget)
      const widgetType = getWidgetType(gtkWidget)

      if (gtkUiIdentifier && (gtkUiIdentifier.startsWith('new-') || gtkUiIdentifier.startsWith('edit-'))) {
        return
      }

      switch (widgetType) {
        case 'GtkComboBoxText':
          this.initComboBox(gtkWidget, gtkUiIdentifier)
          break

        case 'GtkSwitch':
          this.initSwitch(gtkWidget, gtkUiIdentifier)
          break

        case 'GtkSpinButton':
          this.initSpinner(gtkWidget, gtkUiIdentifier)
          break
      }
    })

    if (Me.metadata.version !== undefined) {
      this.Window.get_object('version').set_label(Me.metadata.version.toString())
    }

    this.treeview = this.Window.get_object('tree-treeview')
    this.liststore = this.Window.get_object('tree-liststore')

    this.createWidget = this.Window.get_object('create-symbol-widget')
    this.newName = this.Window.get_object('new-name')
    this.newSymbol = this.Window.get_object('new-symbol')
    this.newShowInTicker = this.Window.get_object('new-show-in-ticker')
    this.newProvider = this.Window.get_object('new-provider')

    this.editWidget = this.Window.get_object('edit-symbol-widget')
    this.editName = this.Window.get_object('edit-name')
    this.editSymbol = this.Window.get_object('edit-symbol')
    this.editShowInTicker = this.Window.get_object('edit-show-in-ticker')
    this.editProvider = this.Window.get_object('edit-provider')

    // TreeView / Table Buttons
    this.Window.get_object('tree-toolbutton-add').connect('clicked', () => {
      this.createWidget.show()
    })

    this.Window.get_object('tree-toolbutton-remove').connect('clicked', this.removeSymbol.bind(this))
    this.Window.get_object('tree-toolbutton-edit').connect('clicked', this.showEditSymbolWidget.bind(this))

    // Create Widget Buttons
    this.Window.get_object('button-create-save').connect('clicked', this.saveSymbol.bind(this))
    this.Window.get_object('button-create-cancel').connect('clicked', () => {
      this.createWidget.hide()
    })

    // Edit Widget Buttons
    this.Window.get_object('button-edit-save').connect('clicked', this.updateSymbol.bind(this))
    this.Window.get_object('button-edit-cancel').connect('clicked', () => {
      this.editWidget.hide()
    })

    this.initTreeView()

    this.refreshTreeView()
  }

  /**
   * Load Config Data from file and connect change event
   */
  loadConfig () {
    this.Settings = getSettings()
  }

  initSpinner (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'value', Gio.SettingsBindFlags.DEFAULT)
  }

  initComboBox (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'active-id', Gio.SettingsBindFlags.DEFAULT)
  }

  initSwitch (gtkWidget, identifier) {
    this.Settings.bind(identifier, gtkWidget, 'active', Gio.SettingsBindFlags.DEFAULT)
  }

  /**
   * Initialize TreeView (Symbol Table)
   */
  initTreeView () {
    /**** name cell ****/
    const quoteNameColumn = new Gtk.TreeViewColumn()
    quoteNameColumn.set_title(Translations.SETTINGS.QUOTE_NAME)
    this.treeview.append_column(quoteNameColumn)

    let renderer = new Gtk.CellRendererText()
    quoteNameColumn.pack_start(renderer, null)

    quoteNameColumn.set_cell_data_func(renderer, (tree, cell, model, iter) => {
      cell.markup = model.get_value(iter, 0)
    })

    /**** symbol cell ****/
    const symbolColumn = new Gtk.TreeViewColumn()
    symbolColumn.set_title(Translations.SETTINGS.SYMBOL)
    this.treeview.append_column(symbolColumn)

    symbolColumn.pack_start(renderer, null)

    symbolColumn.set_cell_data_func(renderer, (tree, cell, model, iter) => {
      cell.markup = model.get_value(iter, 1)
    })

    /**** provider cell ****/
    const providerCell = new Gtk.TreeViewColumn()
    providerCell.set_title(Translations.SETTINGS.PROVIDER)
    this.treeview.append_column(providerCell)

    providerCell.pack_start(renderer, null)

    providerCell.set_cell_data_func(renderer, function (tree, cell, model, iter) {
      cell.markup = model.get_value(iter, 2).toString()
    })

    /**** ticker cell ****/
    const toggleRenderer = new Gtk.CellRendererToggle()
    toggleRenderer.set_activatable(true)
    toggleRenderer.connect('toggled', this._toggleTickerVisibility.bind(this))

    const showInTicker = new Gtk.TreeViewColumn()
    showInTicker.set_title(Translations.SETTINGS.SHOW_IN_TICKER)
    this.treeview.append_column(showInTicker)

    showInTicker.pack_start(toggleRenderer, null)

    showInTicker.set_cell_data_func(toggleRenderer, function (tree, cell, model, iter) {
      cell.active = model.get_value(iter, 3)
    })
  }

  _toggleTickerVisibility (cell, path) {
    const treePath = Gtk.TreePath.new_from_string(path)
    const itemIndex = treePath.get_indices()[0]

    const stockItems = Settings.symbol_pairs
    const toggledItem = stockItems[itemIndex]

    toggledItem.showInTicker = !toggledItem.showInTicker

    stockItems[itemIndex] = toggledItem

    Settings.symbol_pairs = stockItems

    this.refreshTreeView()
  }

  /**
   * this recreates the TreeView (Symbol Table)
   */
  refreshTreeView () {
    const stockItems = Settings.symbol_pairs
    this.treeview = this.Window.get_object('tree-treeview')
    this.liststore = this.Window.get_object('tree-liststore')

    this.Window.get_object('tree-toolbutton-remove').sensitive = Boolean(stockItems.length)
    this.Window.get_object('tree-toolbutton-edit').sensitive = Boolean(stockItems.length)

    if (this.liststore) {
      this.liststore.clear()
    }

    if (stockItems.length > 0) {
      let current = this.liststore.get_iter_first()

      stockItems.forEach(stockItem => {

        current = this.liststore.append()
        this.liststore.set_value(current, 0, stockItem.name)
        this.liststore.set_value(current, 1, stockItem.symbol)
        this.liststore.set_value(current, 2, stockItem.provider)
        this.liststore.set_value(current, 3, stockItem.showInTicker)
      })
    }
  }

  /**
   * show edit symbol widget
   */
  showEditSymbolWidget () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (isNullOrEmpty(selection) || isNullOrUndefined(selection[0][0])) {
      return
    }

    // check if we have data (normally we should otherwise it could not be selected...)
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedStock = Settings.symbol_pairs[selectionIndex]

    if (!selectedStock) {
      return
    }

    this.editName.set_text(selectedStock.name || '')
    this.editSymbol.set_text(selectedStock.symbol || '')
    this.editShowInTicker.set_state(selectedStock.showInTicker)
    this.editProvider.set_active(Object.values(FINANCE_PROVIDER).indexOf(selectedStock.provider))

    this.editWidget.show()
  }

  /**
   * Save new symbol
   */
  saveSymbol () {
    const name = this.newName.get_text().trim()
    const symbol = this.newSymbol.get_text().trim()
    const showInTicker = this.newShowInTicker.get_state()
    const provider = Object.values(FINANCE_PROVIDER)[this.newProvider.get_active()]

    const newItem = {
      name,
      symbol,
      showInTicker,
      provider
    }

    // append new item and write it to config
    Settings.symbol_pairs = [...Settings.symbol_pairs, newItem]

    this.refreshTreeView()

    this.createWidget.hide()
  }

  /**
   * update existing symbol
   */
  updateSymbol () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (isNullOrEmpty(selection) || isNullOrUndefined(selection[0][0])) {
      return
    }

    const stockItems = Settings.symbol_pairs
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedStock = stockItems[selectionIndex]

    if (!selectedStock) {
      return
    }

    const newStockItem = {
      name: this.editName.get_text().trim(),
      symbol: this.editSymbol.get_text().trim(),
      showInTicker: this.editShowInTicker.get_state(),
      provider: Object.values(FINANCE_PROVIDER)[this.editProvider.get_active()]
    }

    stockItems[selectionIndex] = newStockItem
    Settings.symbol_pairs = stockItems

    this.refreshTreeView()

    this.editWidget.hide()
  }

  /**
   * Remove existing symbol
   */
  removeSymbol () {
    const selection = this.treeview.get_selection().get_selected_rows()

    // check if a row has been selected
    if (isNullOrEmpty(selection) || isNullOrUndefined(selection[0][0])) {
      return
    }

    const stockItems = Settings.symbol_pairs
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedStock = stockItems[selectionIndex]

    if (!selectedStock) {
      return
    }

    stockItems.splice(selectionIndex, 1)

    Settings.symbol_pairs = stockItems

    this.refreshTreeView()
  }
})

const getWidgetUiIdentifier = gtkWidget => {
  if (isGnome4()) {
    return gtkWidget.get_buildable_id ? gtkWidget.get_buildable_id() : null
  }

  return gtkWidget.get_name ? gtkWidget.get_name() : null
}

const getWidgetType = gtkWidget => {
  if (isGnome4()) {
    return gtkWidget.get_name ? gtkWidget.get_name() : null
  }

  const classPaths = gtkWidget.class_path ? gtkWidget.class_path()[1] : []

  if (classPaths.indexOf('GtkSwitch') !== -1) {
    return 'GtkSwitch'
  } else if (classPaths.indexOf('GtkComboBoxText') !== -1) {
    return 'GtkComboBoxText'
  } else if (classPaths.indexOf('GtkSpinButton') !== -1) {
    return 'GtkSpinButton'
  }
}

const isGnome4 = () => Config.PACKAGE_VERSION.startsWith('4')

// this is called when settings has been opened
var init = () => {
  initTranslations(Settings.SETTINGS_SCHEMA_DOMAIN)
}

function buildPrefsWidget () {
  const widget = new PrefsWidget()
  widget.show()
  return widget
}
