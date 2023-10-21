import Gio from 'gi://Gio'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export const getCustomIconPath = iconName => {
  const extensionObject = Extension.lookupByURL(import.meta.url);
  return Gio.icon_new_for_string(extensionObject.dir.get_child('icons').get_path() + '/' + iconName + '.svg')
}
