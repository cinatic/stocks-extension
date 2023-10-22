import Gdk from 'gi://Gdk'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { initTranslations } from './helpers/translations.js'
import { initSettings } from './helpers/settings.js'

import { AboutPage } from './components/settings/aboutPage.js'
import { PortfolioListPage } from './components/settings/portfolioListPage.js'
import { SettingsPage } from './components/settings/settingsPage.js'

export default class StocksExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow (window) {
    initSettings(this)
    initTranslations(_)

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
