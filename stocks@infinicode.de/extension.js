/* jshint esnext:true */
/*
 *
 *  GNOME Shell Extension for the great Taskwarrior application
 *  - Displays pending Tasks.
 *  - adding / modifieing tasks.
 *
 * Copyright (C) 2020
 *     Florijan Hamzic <fh @ infinicode.de>
 *
 * This file is part of gnome-shell-extension-stocks.
 *
 * gnome-shell-extension-stocks is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell-extension-stocks is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-stocks.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import { ScreenWrapper } from './components/screenWrapper/screenWrapper.js'

import { MenuStockTicker } from './components/stocks/menuStockTicker.js'

import { EventHandler } from './helpers/eventHandler.js'
import { initSettings, SettingsHandler } from './helpers/settings.js'
import { initTranslations } from './helpers/translations.js'


const MenuPosition = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2
}

let StocksMenuButton = GObject.registerClass(class StocksMenuButton extends PanelMenu.Button {
  _init () {
    this._previousPanelPosition = null
    this._settingsChangedId = null

    this._settings = new SettingsHandler()
    this._mainEventHandler = new EventHandler()

    // Panel menu item - the current class
    let menuAlignment = 0.25

    if (Clutter.get_default_text_direction() == Clutter.TextDirection.RTL) {
      menuAlignment = 1.0 - menuAlignment
    }

    super._init(menuAlignment, _('Stocks'))
    this.add_style_class_name('stocks-extension')

    this.add_child(new MenuStockTicker())

    const bin = new St.Widget({ style_class: 'stocks-extension' })
    bin._delegate = this
    this.menu.box.add_child(bin)

    this._screenWrapper = new ScreenWrapper(this._mainEventHandler)
    bin.add_child(this._screenWrapper)

    // Bind events
    // FIXME: figure out and fix why this triggers
    // Apr 21 14:31:45 station gnome-shell[2006]: Object .Gjs_ui_boxpointer_BoxPointer (0x55853c5181c0), has been already deallocated — impossible to get any property from it. This might be caused by the object having been destroyed from C code using something such as destroy(), dispose(), or remove() vfuncs.
    this._mainEventHandler.connect('hide-panel', () => this.menu.close())
    this._settingsChangedId = this._settings.connect('changed', this._sync.bind(this))

    this.menu.connect('destroy', this._destroyExtension.bind(this))
    this.menu.connect('open-state-changed', (menu, isOpen) => {
      this._mainEventHandler.emit('open-state-changed', { isOpen })
    })

    this._sync()
  }

  _sync (changedValue, changedKey) {
    this.checkPositionInPanel()
  }

  checkPositionInPanel () {
    const container = this.container
    const parent = container.get_parent()

    if (!parent || this._previousPanelPosition === this._settings.position_in_panel) {
      return
    }

    parent.remove_child(container)

    let children = null

    switch (this._settings.position_in_panel) {
      case MenuPosition.LEFT:
        children = Main.panel._leftBox.get_children()
        Main.panel._leftBox.insert_child_at_index(container, children.length)
        break
      case MenuPosition.CENTER:
        children = Main.panel._centerBox.get_children()
        Main.panel._centerBox.insert_child_at_index(container, children.length)
        break
      case MenuPosition.RIGHT:
        children = Main.panel._rightBox.get_children()
        Main.panel._rightBox.insert_child_at_index(container, 0)
        break
    }

    this._previousPanelPosition = this._settings.position_in_panel
  }

  _destroyExtension () {
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
    }
  }
})

let _stocksMenu

export default class StocksExtension extends Extension {
  enable () {
    initSettings(this)
    initTranslations(_)
    _stocksMenu = new StocksMenuButton()
    Main.panel.addToStatusArea('stocksMenu', _stocksMenu)
    _stocksMenu.checkPositionInPanel()
  }

  disable () {
    if (_stocksMenu) {
      _stocksMenu.destroy()
      _stocksMenu = null
    }
  }
}
