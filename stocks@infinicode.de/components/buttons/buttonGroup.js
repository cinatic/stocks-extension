const { GObject, St, Clutter, Gtk, Pango } = imports.gi

var ButtonGroup = GObject.registerClass({
  GTypeName: 'StockExtension_ButtonGroup',
  Signals: {
    'clicked': {
      param_types: [GObject.TYPE_OBJECT]
    }
  }
}, class ButtonGroup extends St.ScrollView {
  _init ({ buttons, style_class, enableScrollbar = true }) {
    super._init({
      style_class: `button-group ${style_class}`,
      y_expand: true,
      x_expand: true
    })

    if (!enableScrollbar) {
      this.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.NEVER)
    }

    this.set_overlay_scrollbars(true)

    this._selectedButton = buttons.find(item => item.selected)
    this._buttons = buttons

    this._content = new St.BoxLayout({
      style_class: 'button-group-content',
      y_align: Clutter.ActorAlign.CENTER,
      x_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      x_expand: true
    })

    const innerContentBox = new St.BoxLayout({
      vertical: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
      x_expand: true
    })
    innerContentBox.add_child(this._content)

    this.add_actor(innerContentBox)

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
        y_expand: true,
        x_expand: true,
        style_class: `button ${additionalStyleClasses}`,
        label: button.label
      })

      const clutterText = stButton.get_first_child()
      clutterText.ellipsize = Pango.EllipsizeMode.NONE

      stButton.buttonData = button

      stButton.connect('clicked', () => {
        this.emit('clicked', stButton)
        this._selectedButton = button
        this._sync()
      })

      this._content.add_child(stButton)
    })
  }

  _onDestroy () {
  }
})
