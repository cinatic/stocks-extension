const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, Gio, GObject, Gtk } = imports.gi

const { Translations } = Me.imports.helpers.translations

var SubPage = GObject.registerClass(
    class SubPage extends Gtk.Box {
      _init (title, page) {
        super._init({
          orientation: Gtk.Orientation.VERTICAL,
        })
        this.title = title

        this.headerBar = new Adw.HeaderBar({
          title_widget: new Adw.WindowTitle({
            title: title,
          }),
          decoration_layout: ''
        })
        this.append(this.headerBar)
        let backButton = new Gtk.Button({
          icon_name: 'go-previous-symbolic',
          tooltip_text: Translations.BACK,
          css_classes: ['flat'],
        })
        backButton.connect('clicked', () => {
          const window = this.get_root()
          window.close_subpage()
        })
        this.headerBar.pack_start(backButton)

        this.append(page)
      }
    })
