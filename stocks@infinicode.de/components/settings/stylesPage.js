const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk, Gdk } = imports.gi

const { SettingsHandler } = Me.imports.helpers.settings
const { Translations } = Me.imports.helpers.translations
const { QuoteStyleGroup } = Me.imports.components.settings.quoteStyleGroup

var StylesPage = GObject.registerClass(
  {
    GTypeName: 'StockExtension-StylesPage',
  },
  class StockStylesPreferencePage extends Adw.PreferencesPage {
    _init() {
      super._init({
        title: Translations.SETTINGS.TITLE_STYLES,
        icon_name: 'font-select-symbolic',
        name: 'StylesPage'
      });

      this.add(new QuoteStyleGroup());
    }
  }
)
