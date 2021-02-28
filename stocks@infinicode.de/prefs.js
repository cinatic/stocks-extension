const { GLib, GObject, Gtk } = imports.gi

const Mainloop = imports.mainloop

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Settings = Me.imports.helpers.settings

const { decodeBase64JsonOrDefault, isNullOrEmpty, isNullOrUndefined } = Me.imports.helpers.data
const { initTranslations, Translations } = Me.imports.helpers.translations
const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

const EXTENSIONDIR = Me.dir.get_path()

const POSITION_IN_PANEL_KEY = 'position-in-panel'
const STOCKS_SYMBOL_PAIRS = 'symbol-pairs'
const STOCKS_TICKER_INTERVAL = 'ticker-interval'
const STOCKS_SHOW_OFF_MARKET_TICKER_PRICES = 'show-ticker-off-market-prices'

let inRealize = false
let defaultSize = [-1, -1]

var PrefsWidget = GObject.registerClass({
  GTypeName: 'StocksExtensionPrefsWidget'
}, class Widget extends Gtk.Box {

  /********** Properties ******************/

  // The names must be equal to the ID in settings.ui!
  get position_in_panel () {
    if (!this.Settings) {
      this.loadConfig()
    }

    return this.Settings.get_enum(POSITION_IN_PANEL_KEY)
  }

  set position_in_panel (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_enum(POSITION_IN_PANEL_KEY, v)
  }

  get symbolPairs () {
    if (!this.Settings) {
      this.loadConfig()
    }

    const rawString = this.Settings.get_string(STOCKS_SYMBOL_PAIRS)

    /****
     * For backwards compatiblity intercept here if it contains certain string -&&- && -§§-
     * if we found old format convert to new format and save
     */
    if (rawString.includes('-&&-') && rawString.includes('-§§-')) {
      try {
        let newData = Settings.convertOldSettingsFormat(rawString)

        if (!newData) {
          newData = Settings.DEFAULT_SYMBOL_DATA
        }

        this.Settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(newData)))

        return newData
      } catch (e) {
        log(`failed to convert old data ${e}`)
        return Settings.DEFAULT_SYMBOL_DATA
      }
    }

    const stockItems = decodeBase64JsonOrDefault(rawString, Settings.DEFAULT_SYMBOL_DATA)

    if (isNullOrEmpty(stockItems)) {
      this.Settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(Settings.DEFAULT_SYMBOL_DATA)))
      return Settings.DEFAULT_SYMBOL_DATA
    }

    return stockItems
  }

  set symbolPairs (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(v)))
  }

  get ticker_interval () {
    if (!this.Settings) {
      this.loadConfig()
    }

    return this.Settings.get_int(STOCKS_TICKER_INTERVAL)
  }

  set ticker_interval (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_int(STOCKS_TICKER_INTERVAL, v)
  }

  get show_ticker_off_market_prices () {
    if (!this.Settings) {
      this.loadConfig()
    }

    return this.Settings.get_boolean(STOCKS_SHOW_OFF_MARKET_TICKER_PRICES)
  }

  set show_ticker_off_market_prices (v) {
    if (!this.Settings) {
      this.loadConfig()
    }

    this.Settings.set_boolean(STOCKS_SHOW_OFF_MARKET_TICKER_PRICES, v)
  }

  _init (params = {}) {
    super._init(Object.assign(params, {
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 0
    }))

    this.configWidgets = []
    this.componentTimeoutIds = {}
    this._settingsChangedId = null
    this._treeViewItemHasDropped = false
    this.Window = new Gtk.Builder()

    this.initWindow()

    defaultSize = this.MainWidget.get_size_request()
    let borderWidth = this.MainWidget.get_border_width()

    defaultSize[0] += 2 * borderWidth
    defaultSize[1] += 2 * borderWidth

    this.MainWidget.set_size_request(-1, -1)
    this.MainWidget.set_border_width(0)

    this.evaluateValues()

    this.add(this.MainWidget)

    this.connect('destroy', this._onDestroy.bind(this))

    this.MainWidget.connect('realize', () => {
      if (inRealize) {
        return
      }
      inRealize = true

      this.MainWidget.get_toplevel().resize(defaultSize[0], defaultSize[1])
      inRealize = false
    })

    this.treeview.connect('drag-drop', () => {
      this._treeViewItemHasDropped = true
    })

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

        this.symbolPairs = newStockModels
      }
    })
  }

  initWindow () {
    this.Window.add_from_file(EXTENSIONDIR + '/settings.ui')
    this.MainWidget = this.Window.get_object('main-widget')

    let theObjects = this.Window.get_objects()
    for (let i in theObjects) {
      const name = theObjects[i].get_name ? theObjects[i].get_name() : 'dummy'

      if (this[name] !== undefined) {
        const classPath = theObjects[i].class_path()[1]

        if (classPath.indexOf('GtkEntry') != -1) {
          this.initEntry(theObjects[i])
        } else if (classPath.indexOf('GtkComboBoxText') != -1) {
          this.initComboBox(theObjects[i])
        } else if (classPath.indexOf('GtkSwitch') != -1) {
          this.initSwitch(theObjects[i])
        } else if (classPath.indexOf('GtkScale') != -1) {
          this.initScale(theObjects[i])
        } else if (classPath.indexOf('GtkSpinButton') != -1) {
          this.initSpinner(theObjects[i])
        }

        this.configWidgets.push([theObjects[i], name])
      }
    }

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
      this.createWidget.show_all()
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
  }

  /**
   * Load Config Data from file and connect change event
   */
  loadConfig () {
    this.Settings = Settings.getSettings()
    this._settingsChangedId = this.Settings.connect('changed', this.evaluateValues.bind(this))
  }

  /**
   * initialize entry items (input boxes)
   * @param theEntry entry element
   */
  initEntry (theEntry) {
    let name = theEntry.get_name()
    theEntry.text = this[name]
    if (this[name].length != 32) {
      theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning')
    }

    theEntry.connect('notify::text', () => {
      let key = arguments[0].text
      this[name] = key
      if (key.length == 32) {
        theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, '')
      } else {
        theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning')
      }
    })
  }

  /**
   * initialize entry items (input boxes)
   * @param theEntry entry element
   */
  initSpinner (theEntry) {
    const name = theEntry.get_name()

    theEntry.set_value(this[name])

    // prevent from continously updating the value
    delete this.componentTimeoutIds[name]

    theEntry.connect('value-changed', (button) => {
      const timeoutId = this.componentTimeoutIds[name]

      if (timeoutId) {
        Mainloop.source_remove(timeoutId)
      }

      this.componentTimeoutIds[name] = Mainloop.timeout_add(250, () => {
        this[name] = button.get_value()
        return false
      })
    })
  }

  /**
   * initialize combo box items
   * @param theComboBox comboBox element
   */
  initComboBox (theComboBox) {
    const name = theComboBox.get_name()
    theComboBox.connect('changed', () => {
      this[name] = arguments[0].active
    })
  }

  /**
   * initialize boolean switches
   * @param theSwitch switch element
   */
  initSwitch (theSwitch) {
    const name = theSwitch.get_name()

    theSwitch.connect('notify::active', () => {
      this[name] = arguments[0].active
    })
  }

  /**
   * initialize scale items (range slider?)
   * @param theScale scale element
   */
  initScale (theScale) {
    let name = theScale.get_name()
    theScale.set_value(this[name])
    this[name + 'Timeout'] = undefined
    theScale.connect('value-changed', (slider) => {
      if (this[name + 'Timeout'] !== undefined) {
        Mainloop.source_remove(this[name + 'Timeout'])
      }
      this[name + 'Timeout'] = Mainloop.timeout_add(250, () => {
        this[name] = slider.get_value()
        return false
      })
    })
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
    const showInTicker = new Gtk.TreeViewColumn()
    showInTicker.set_title(Translations.SETTINGS.SHOW_IN_TICKER)
    this.treeview.append_column(showInTicker)

    showInTicker.pack_start(renderer, null)

    showInTicker.set_cell_data_func(renderer, function (tree, cell, model, iter) {
      const value = model.get_value(iter, 3)

      if (!isNullOrUndefined(value)) {
        cell.markup = value.toString()
      }
    })
  }

  /**
   * This is triggered when config has changed
   * 1. refresh the settings UI view
   * 2. synchronize config values and settings elements
   */
  evaluateValues () {
    this.refreshUI()

    let config = this.configWidgets

    for (let i in config) {
      if (config[i][0].active != this[config[i][1]]) {
        config[i][0].active = this[config[i][1]]
      }
    }
  }

  /**
   * this recreates the TreeView (Symbol Table)
   */
  refreshUI () {
    const stockItems = this.symbolPairs
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

  _onDestroy () {
    if (this._settingsChangedId) {
      this.Settings.disconnect(this._settingsChangedId)
    }
  }

  /**
   * clear a entry input element
   */
  clearEntry () {
    arguments[0].set_text('')
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
    const selectedStock = this.symbolPairs[selectionIndex]

    if (!selectedStock) {
      return
    }

    this.editName.set_text(selectedStock.name || '')
    this.editSymbol.set_text(selectedStock.symbol || '')
    this.editShowInTicker.set_state(selectedStock.showInTicker)
    this.editProvider.set_active(Object.values(FINANCE_PROVIDER).indexOf(selectedStock.provider))

    this.editWidget.show_all()
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
    this.symbolPairs = [...this.symbolPairs, newItem]

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

    const stockItems = this.symbolPairs
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
    this.symbolPairs = stockItems

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

    const stockItems = this.symbolPairs
    const selectionIndex = parseInt(selection[0][0].to_string())
    const selectedStock = stockItems[selectionIndex]

    if (!selectedStock) {
      return
    }

    stockItems.splice(selectionIndex, 1)

    this.symbolPairs = stockItems
  }
})

// this is called when settings has been opened
var init = () => {
  initTranslations(Settings.SETTINGS_SCHEMA_DOMAIN)
}

function buildPrefsWidget () {
  let widget = new PrefsWidget()
  widget.show_all()
  return widget
}
