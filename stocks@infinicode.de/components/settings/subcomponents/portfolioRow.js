import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gdk from 'gi://Gdk'
import GLib from 'gi://GLib'
import Gtk from 'gi://Gtk'
import Pango from 'gi://Pango'

export const PortfolioRow = GObject.registerClass({
  GTypeName: 'StockExtension-PortfolioRow',
}, class PortfolioRowClass extends Adw.PreferencesRow {
  constructor (item, portfolioModelList) {
    super({ name: item.name })

    this.item = item
    this.portfolioModelList = portfolioModelList

    this._initDragAndDrop()

    this._viewRow = this._renderViewRow()

    this._stack = new Gtk.Stack()
    this._stack.add_named(this._viewRow, 'display')
    this.child = this._stack
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

      this.portfolioModelList.move(value.item.id, this.item.id)
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
    label.label = this.item.name
    viewRowBox.append(label)

    const removeButton = new Gtk.Button({
      action_name: 'portfolio.remove',
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
})
