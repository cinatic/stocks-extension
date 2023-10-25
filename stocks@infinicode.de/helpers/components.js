import Gio from 'gi://Gio'

import { SettingsHandler } from './settings.js'

export const getCustomIconPath = iconName => {
  const settings = new SettingsHandler()
  return Gio.icon_new_for_string(settings.extensionObject.path + '/icons/' + iconName + '.svg')
}
