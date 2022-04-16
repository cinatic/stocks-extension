const { Gdk, Gio, GObject, Gtk } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { AboutPage } = Me.imports.components.settings.aboutPage
const { SymbolsListPage } = Me.imports.components.settings.symbolsListPage
const { SettingsPage } = Me.imports.components.settings.settingsPage

const { SETTINGS_SCHEMA_DOMAIN } = Me.imports.helpers.settings

function init () {
  ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
}

function fillPreferencesWindow (window) {
  let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default())
  if (!iconTheme.get_search_path().includes(Me.path + '/media')) {
    iconTheme.add_search_path(Me.path + '/media')
  }

  window.set_search_enabled(true)

  const symbolsListPage = new SymbolsListPage()
  window.add(symbolsListPage)

  const settingsPage = new SettingsPage()
  window.add(settingsPage)

  const aboutPage = new AboutPage()
  window.add(aboutPage)
}
