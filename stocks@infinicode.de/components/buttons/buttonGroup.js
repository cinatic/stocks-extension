import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'
import Pango from 'gi://Pango'

export const ButtonGroup = GObject.registerClass({
  GTypeName: 'StockExtension_ButtonGroup',
  Signals: {
    'clicked': {
      param_types: [GObject.TYPE_OBJECT]
    }
  }
}, class ButtonGroup extends St.ScrollView {
  _init ({ buttons, style_class, enableScrollbar = true, sync_on_click = false, y_expand = true, x_expand = true }) {
    super._init({
      style_class: `button-group ${style_class}`,
      y_expand,
      x_expand
    })

    if (!enableScrollbar) {
      this.set_policy(St.PolicyType.NEVER, St.PolicyType.NEVER)
    }

    // this.set_overlay_scrollbars(true)

    this._sync_on_click = sync_on_click
    this._selectedButton = buttons.find(item => item.selected)
    this._buttons = buttons

    this._content = new St.BoxLayout({
      style_class: 'button-group-content',
      x_align: Clutter.ActorAlign.CENTER,
      y_expand,
      x_expand
    })

    const innerContentBox = new St.BoxLayout({
      vertical: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      y_expand,
      x_expand
    })
    innerContentBox.add_child(this._content)

    this.add_child(innerContentBox)

    this.connect('destroy', this._onDestroy.bind(this))

    this._sync()
  }

  async _sync () {
    this._createButtons()
  }

  _createButtons () {
    this._content.destroy_all_children()

    this._buttons.forEach(button => {
      const additionalStyleClasses = this._selectedButton === button ? 'selected' : ''

      const stButton = new St.Button({
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
        y_expand: this.y_expand,
        x_expand: this.x_expand,
        style_class: `button ${additionalStyleClasses}`,
        label: button.label
      })

      const clutterText = stButton.get_first_child()
      clutterText.ellipsize = Pango.EllipsizeMode.NONE

      stButton.buttonData = button

      stButton.connect('clicked', () => {
        this._selectedButton = button

        this.emit('clicked', stButton)

        if (this._sync_on_click) {
          this._sync()
        }
      })

      this._content.add_child(stButton)
    })
  }

  _onDestroy () {
  }
})
