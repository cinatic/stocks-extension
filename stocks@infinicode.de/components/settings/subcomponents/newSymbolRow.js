import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk'

import { Translations } from '../../../helpers/translations.js'

export const NewSymbolRow = GObject.registerClass({
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
