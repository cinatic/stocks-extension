const { Gio, GLib } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { decodeBase64JsonOrDefault, isNullOrEmpty } = Me.imports.helpers.data
const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

var POSITION_IN_PANEL_KEY = 'position-in-panel'
var STOCKS_SYMBOL_PAIRS = 'symbol-pairs'
var STOCKS_TICKER_INTERVAL = 'ticker-interval'
var STOCKS_SHOW_OFF_MARKET_TICKER_PRICES = 'show-ticker-off-market-prices'

var SETTINGS_SCHEMA_DOMAIN = 'org.gnome.shell.extensions.stocks'

var DEFAULT_SYMBOL_DATA = [
  {
    symbol: 'BABA',
    name: 'Alibaba (NY)',
    showInTicker: true,
    provider: FINANCE_PROVIDER.YAHOO
  }
]

/**
 * getSettings:
 * @schemaName: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
var getSettings = () => {
  const extension = ExtensionUtils.getCurrentExtension()

  const schemaName = SETTINGS_SCHEMA_DOMAIN || extension.metadata['settings-schema']

  const GioSSS = Gio.SettingsSchemaSource

  // check if this extension was built with "make zip-file", and thus
  // has the schema files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell (and therefore schemas are available
  // in the standard folders)
  const schemaDir = extension.dir.get_child('schemas')

  let schemaSource

  if (schemaDir.query_exists(null)) {
    schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
        GioSSS.get_default(),
        false)
  } else {
    schemaSource = GioSSS.get_default()
  }

  const schemaObj = schemaSource.lookup(schemaName, true)

  if (!schemaObj) {
    throw new Error('Schema ' + schemaName + ' could not be found for extension ' + extension.metadata.uuid + '. Please check your installation.')
  }

  return new Gio.Settings({
    settings_schema: schemaObj
  })
}

var convertOldSettingsFormat = rawString => rawString.split('-&&-').map(symbolPairString => ({
  name: symbolPairString.split('-§§-')[0],
  symbol: symbolPairString.split('-§§-')[1],
  showInTicker: true,
  provider: FINANCE_PROVIDER.YAHOO
}))

const Handler = class {
  constructor () {
    this._settings = getSettings(SETTINGS_SCHEMA_DOMAIN)
  }

  get position_in_panel () {
    return this._settings.get_enum(POSITION_IN_PANEL_KEY)
  }

  get symbol_pairs () {
    const rawString = this._settings.get_string(STOCKS_SYMBOL_PAIRS)

    /****
     * For backwards compatiblity intercept here if it contains certain string -&&- && -§§-
     * if we found old format convert to new format and save
     */
    if (rawString.includes('-&&-') && rawString.includes('-§§-')) {
      try {
        let newData = convertOldSettingsFormat(rawString)

        if (!newData) {
          newData = DEFAULT_SYMBOL_DATA
        }

        this._settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(newData)))

        return newData
      } catch (e) {
        return DEFAULT_SYMBOL_DATA
      }
    }

    const stockItems = decodeBase64JsonOrDefault(rawString, DEFAULT_SYMBOL_DATA)

    if (isNullOrEmpty(stockItems)) {
      this._settings.set_string(STOCKS_SYMBOL_PAIRS, GLib.base64_encode(JSON.stringify(DEFAULT_SYMBOL_DATA)))
      return DEFAULT_SYMBOL_DATA
    }

    return stockItems
  }

  get ticker_interval () {
    return this._settings.get_int(STOCKS_TICKER_INTERVAL)
  }

  get show_ticker_off_market_prices () {
    return this._settings.get_boolean(STOCKS_SHOW_OFF_MARKET_TICKER_PRICES)
  }

  connect (identifier, onChange) {
    return this._settings.connect(identifier, onChange)
  }

  disconnect (connectId) {
    this._settings.disconnect(connectId)
  }
}

var Settings = new Handler()
