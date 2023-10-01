const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { Translations } = Me.imports.helpers.translations

var NewSymbolRow = GObject.registerClass({
      GTypeName: 'StockExtension-NewSymbolRow',
    },
    class StocksNewSymbolRowClass extends Adw.PreferencesRow {

      constructor () {
        super({
          action_name: 'symbol.add',
          child: new Gtk.Image({
            icon_name: 'list-add-symbolic',
            pixel_size: 16,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
          }),
        })
        this.update_property(
            [Gtk.AccessibleProperty.LABEL], [Translations.SETTINGS.ADD_SYMBOL])
      }
    }
)
