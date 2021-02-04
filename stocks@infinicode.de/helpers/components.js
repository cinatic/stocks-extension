const { Gio, GLib, GObject } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var getCustomIconPath = iconName => Gio.icon_new_for_string(Me.dir.get_child('icons').get_path() + '/' + iconName + '.svg')

var setTimeout = (func, time) => GLib.timeout_add(
    GLib.PRIORITY_DEFAULT,
    time,
    () => {
      func.call()

      return GLib.SOURCE_REMOVE
    })

var clearTimeout = timerId => {
  GLib.source_remove(timerId)

  return null
}
