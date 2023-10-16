import Gdk from 'gi://Gdk'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { Translations, setTranslationFn } from './helpers/translationsForPrefs.js'

import { SettingsHandler, setSettingsGetter } from './helpers/settings.js'

setSettingsGetter(() => ExtensionPreferences.lookupByURL(import.meta.url).getSettings())

log("s 1 1")
import { AboutPage } from './components/settings/aboutPage.js'
log("s 1 2")
import { PortfolioListPage } from './components/settings/portfolioListPage.js'
log("s 1 3")
import { SettingsPage } from './components/settings/settingsPage.js'

export default class StocksExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow (window) {
    let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default())
    if (!iconTheme.get_search_path().includes(this.path + '/media')) {
      iconTheme.add_search_path(this.path + '/media')
    }

    window.set_search_enabled(true)

    const portfolioListPage = new PortfolioListPage()
    window.add(portfolioListPage)

    const settingsPage = new SettingsPage()
    window.add(settingsPage)

    const aboutPage = new AboutPage(this.path, this.metadata)
    window.add(aboutPage)
  }
}
