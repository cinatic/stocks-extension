import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gdk from 'gi://Gdk'
import GLib from 'gi://GLib'
import Gtk from 'gi://Gtk'
import Pango from 'gi://Pango'

import { FINANCE_PROVIDER } from '../../../services/meta/generic.js'
import { Translations } from '../../../helpers/translations.js'

export const SymbolRow = GObject.registerClass({
  GTypeName: 'StockExtension-SymbolRow',
}, class SymbolRowClass extends Adw.PreferencesRow {
  constructor (item, symbolModelList) {
    super({ name: item.name })

    this.item = item
    this.symbolModelList = symbolModelList

    this._initDragAndDrop()

    this._viewRow = this._renderViewRow()
    this._editRow = this._renderEditRow()

    this._stack = new Gtk.Stack()
    this._stack.add_named(this._viewRow, 'display')
    this._stack.add_named(this._editRow, 'edit')
    this.child = this._stack
  }

  edit () {
    if (this._stack.visible_child_name === 'edit') {
      return
    }

    this._editRow.initForm(this.item)

    this._stack.visible_child_name = 'edit'
  }

  _stopEdit () {
    // this.grab_focus()
    this._stack.visible_child_name = 'display'
  }

  _initDragAndDrop () {
    const dragSource = new Gtk.DragSource()
    dragSource.set_actions(Gdk.DragAction.MOVE)

    dragSource.connect('prepare', () => {
      return Gdk.ContentProvider.new_for_value(this)
    })

    this.add_controller(dragSource)

    const dropTarget = new Gtk.DropTarget()
    dropTarget.set_gtypes([this.constructor.$gtype])
    dropTarget.set_actions(Gdk.DragAction.MOVE)

    dropTarget.connect('drop', (target, value) => {
      if (value === this) {
        return
      }

      this.symbolModelList.move(value.item.id, this.item.id)
    })
    this.add_controller(dropTarget)
  }

  _renderViewRow () {
    const viewRowBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 4,
      margin_top: 4,
      margin_bottom: 4,
      margin_start: 8,
      margin_end: 8,
    })

    const label = new Gtk.Label({
      hexpand: true,
      xalign: 0,
      max_width_chars: 25,
      ellipsize: Pango.EllipsizeMode.END,
    })
    label.label = `${this.item.name} (${this.item.symbol}@${this.item.provider}${this.item.showInTicker ? Translations.SETTINGS.SHOW_IN_TICKER_INFO : ''})`
    viewRowBox.append(label)

    const removeButton = new Gtk.Button({
      action_name: 'symbol.remove',
      icon_name: 'edit-delete-symbolic',
      has_frame: false,
    })
    viewRowBox.append(removeButton)

    this.item.bind_property_full('id',
        removeButton, 'action-target',
        GObject.BindingFlags.SYNC_CREATE,
        (bind, target) => [true, new GLib.Variant('s', target)],
        null)

    return viewRowBox
  }

  _renderEditRow () {
    const editRowBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 4,
      margin_top: 4,
      margin_bottom: 4,
      margin_start: 8,
      margin_end: 8,
    })

    editRowBox.initForm = item => {
      editRowBox._nameEntry.text = item.name || ''
      editRowBox._symbolEntry.text = item.symbol || ''
      editRowBox._providerDropDown.selected = Object.values(FINANCE_PROVIDER).indexOf(item.provider) || 0
      editRowBox._showInTickerCheckButton.active = Boolean(item.showInTicker)
    }

    editRowBox._nameEntry = new Gtk.Entry({
      max_width_chars: 25,
      placeholder_text: Translations.SETTINGS.QUOTE_NAME
    })

    editRowBox._symbolEntry = new Gtk.Entry({
      max_width_chars: 25,
      placeholder_text: Translations.SETTINGS.SYMBOL
    })

    const providerList = new Gtk.StringList()
    providerList.append(Translations.PROVIDERS.YAHOO)
    providerList.append(Translations.PROVIDERS.EAST_MONEY)

    editRowBox._providerDropDown = new Gtk.DropDown({
      model: providerList
    })

    editRowBox._showInTickerCheckButton = new Gtk.CheckButton({
      label: Translations.SETTINGS.SHOW_IN_TICKER_LABEL
    })

    const saveButton = new Gtk.Button({
      icon_name: 'object-select-symbolic',
      has_frame: false,
    })

    saveButton.connect('clicked', () => {
      const data = [
        this.item.id,
        editRowBox._nameEntry.text,
        editRowBox._symbolEntry.text,
        editRowBox._showInTickerCheckButton.active,
        Object.values(FINANCE_PROVIDER)[editRowBox._providerDropDown.selected]
      ]

      this.activate_action('symbol.edit', new GLib.Variant('(sssbs)', data))
      this._stopEdit()
    })

    editRowBox.append(editRowBox._nameEntry)
    editRowBox.append(editRowBox._symbolEntry)
    editRowBox.append(editRowBox._providerDropDown)
    editRowBox.append(editRowBox._showInTickerCheckButton)
    editRowBox.append(saveButton)

    const controller = new Gtk.ShortcutController()
    controller.add_shortcut(new Gtk.Shortcut({
      trigger: Gtk.ShortcutTrigger.parse_string('Escape'),
      action: Gtk.CallbackAction.new(() => {
        this._stopEdit()
        return true
      }),
    }))
    editRowBox._nameEntry.add_controller(controller)

    return editRowBox
  }
})
