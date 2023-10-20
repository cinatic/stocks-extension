import Gio from 'gi://Gio'
import GLib from 'gi://GLib'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export const getCustomIconPath = iconName => {
  const extensionObject = Extension.lookupByURL(import.meta.url);
  return Gio.icon_new_for_string(extensionObject.dir.get_child('icons').get_path() + '/' + iconName + '.svg')
}

export const setTimeout = (func, time) => GLib.timeout_add(
    GLib.PRIORITY_DEFAULT,
    time,
    () => {
      func.call()

      return GLib.SOURCE_REMOVE
    })

export const clearTimeout = timerId => {
  GLib.source_remove(timerId)

  return null
}
