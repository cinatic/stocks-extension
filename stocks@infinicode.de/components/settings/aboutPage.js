const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Adw, GdkPixbuf, Gio, GLib, GObject, Gtk } = imports.gi

const { Translations } = Me.imports.helpers.translations

var AboutPage = GObject.registerClass({
      GTypeName: 'StockExtension-AboutPage',
    },
    class AboutPagePreferencesPage extends Adw.PreferencesPage {
      _init () {
        super._init({
          title: Translations.SETTINGS.TITLE_ABOUT,
          icon_name: 'help-about-symbolic',
          name: 'AboutPage'
        })

        //Logo and project description-------------------------------------
        let headerPreferencesGroup = new Adw.PreferencesGroup()

        let extensionHeaderBox = new Gtk.Box({
          orientation: Gtk.Orientation.VERTICAL,
          hexpand: false,
          vexpand: false
        })

        let extensionTaskbarLabel = new Gtk.Label({
          label: `<span size="larger"><b>${Translations.EXTENSION.NAME}</b></span>`,
          use_markup: true,
          vexpand: true,
          valign: Gtk.Align.FILL
        })

        let projectDescriptionLabel = new Gtk.Label({
          label: Translations.EXTENSION.DESCRIPTION,
          hexpand: false,
          vexpand: false,
        })
        extensionHeaderBox.append(extensionTaskbarLabel)
        extensionHeaderBox.append(projectDescriptionLabel)
        headerPreferencesGroup.add(extensionHeaderBox)

        this.add(headerPreferencesGroup)
        //-----------------------------------------------------------------------

        //Extension/OS Info Group------------------------------------------------
        let extensionInfoGroup = new Adw.PreferencesGroup()
        let extensionTaskbarVersionRow = new Adw.ActionRow({
          title: Translations.MISC.EXTENSION_VERSION,
        })
        let releaseVersion
        if (Me.metadata.version) {
          releaseVersion = Me.metadata.version
        } else {
          releaseVersion = 'unknown'
        }
        extensionTaskbarVersionRow.add_suffix(new Gtk.Label({
          label: releaseVersion + ''
        }))
        extensionInfoGroup.add(extensionTaskbarVersionRow)

        let commitRow = new Adw.ActionRow({
          title: Translations.MISC.GIT_COMMIT
        })
        let commitVersion
        if (Me.metadata.commit) {
          commitVersion = Me.metadata.commit
        }
        commitRow.add_suffix(new Gtk.Label({
          label: commitVersion ? commitVersion : '',
        }))
        if (commitVersion) {
          extensionInfoGroup.add(commitRow)
        }

        let gnomeVersionRow = new Adw.ActionRow({
          title: Translations.MISC.GNOME_VERSION,
        })
        gnomeVersionRow.add_suffix(new Gtk.Label({
          label: imports.misc.config.PACKAGE_VERSION + '',
        }))
        extensionInfoGroup.add(gnomeVersionRow)

        let osRow = new Adw.ActionRow({
          title: Translations.MISC.OS,
        })
        let osInfoText
        let name = GLib.get_os_info('NAME')
        let prettyName = GLib.get_os_info('PRETTY_NAME')
        if (prettyName) {
          osInfoText = prettyName
        } else {
          osInfoText = name
        }
        let versionID = GLib.get_os_info('VERSION_ID')
        if (versionID) {
          osInfoText += '; Version ID: ' + versionID
        }
        let buildID = GLib.get_os_info('BUILD_ID')
        if (buildID) {
          osInfoText += '; ' + 'Build ID: ' + buildID
        }
        osRow.add_suffix(new Gtk.Label({
          label: osInfoText,
          single_line_mode: false,
          wrap: true,
        }))
        extensionInfoGroup.add(osRow)

        let sessionTypeRow = new Adw.ActionRow({
          title: Translations.MISC.SESSION_TYPE,
        })
        let windowingLabel
        if (Me.metadata.isWayland) {
          windowingLabel = 'Wayland'
        } else {
          windowingLabel = 'X11'
        }
        sessionTypeRow.add_suffix(new Gtk.Label({
          label: windowingLabel,
        }))
        extensionInfoGroup.add(sessionTypeRow)

        this.add(extensionInfoGroup)
        //-----------------------------------------------------------------------

        let linksGroup = new Adw.PreferencesGroup()
        let linksBox = new Adw.ActionRow()

        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/media/donate-icon.svg', -1, 50, true)
        let donateImage = Gtk.Picture.new_for_pixbuf(pixbuf)
        let donateLinkButton = new Gtk.LinkButton({
          child: donateImage,
          uri: 'https://www.paypal.com/donate/?hosted_button_id=US78C8SZ6UHHQ',
        })

        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/media/source-icon.svg', -1, 50, true)
        let sourceCodeImage = Gtk.Picture.new_for_pixbuf(pixbuf)
        let projectUrl = Me.metadata.url
        let projectLinkButton = new Gtk.LinkButton({
          child: sourceCodeImage,
          uri: projectUrl,
        })

        linksBox.add_prefix(projectLinkButton)
        linksBox.add_suffix(donateLinkButton)
        linksGroup.add(linksBox)
        this.add(linksGroup)

        let gnuSoftwareGroup = new Adw.PreferencesGroup()
        let gnuSofwareLabel = new Gtk.Label({
          label: GNU_SOFTWARE,
          use_markup: true,
          justify: Gtk.Justification.CENTER
        })
        let gnuSofwareLabelBox = new Gtk.Box({
          orientation: Gtk.Orientation.VERTICAL,
          valign: Gtk.Align.END,
          vexpand: true,
        })
        gnuSofwareLabelBox.append(gnuSofwareLabel)
        gnuSoftwareGroup.add(gnuSofwareLabelBox)
        this.add(gnuSoftwareGroup)
      }
    })

var GNU_SOFTWARE = '<span size="small">' +
    'This program comes with absolutely no warranty.\n' +
    'See the <a href="https://gnu.org/licenses/old-licenses/gpl-2.0.html">' +
    'GNU General Public License, version 2 or later</a> for details.' +
    '</span>';
