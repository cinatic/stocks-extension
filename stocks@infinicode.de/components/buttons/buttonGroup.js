const { GObject, St, Clutter } = imports.gi

var ButtonGroup = GObject.registerClass({
  GTypeName: 'StockExtension_ButtonGroup',
  Signals: {
    'clicked': {
      param_types: [GObject.TYPE_OBJECT]
    },
  }
}, class ButtonGroup extends St.BoxLayout {
  _init ({ buttons }) {
    super._init({
      style_class: 'button-group',
      x_align: Clutter.ActorAlign.CENTER
    })

    this._selectedButton = buttons.find(item => item.selected)
    this._buttons = buttons

    this.connect('destroy', this._onDestroy.bind(this))

    this._sync()
  }

  async _sync () {
    this._createButtons()
  }

  _createButtons () {
    this.destroy_all_children()

    this._buttons.forEach(button => {
      const additionalStyleClasses = this._selectedButton === button ? 'selected' : ''

      const stButton = new St.Button({
        style_class: `button ${additionalStyleClasses}`,
        label: button.label
      })

      stButton.buttonData = button

      stButton.connect('clicked', () => {
        this.emit('clicked', stButton)
        this._selectedButton = button
        this._sync()
      })

      this.add_child(stButton)
    })
  }

  _onDestroy () {
  }
})
