const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { StockOverviewScreen } = Me.imports.components.screens.stockOverviewScreen.stockOverviewScreen
const { StockDetailsScreen } = Me.imports.components.screens.stockDetailsScreen.stockDetailsScreen
const { EventHandler } = Me.imports.helpers.eventHandler

var ScreenWrapper = GObject.registerClass({
      GTypeName: 'StockExtension.ScreenWrapper'
    },
    class ScreenWrapper extends St.Widget {
      _init () {
        super._init({
          style_class: 'screen-wrapper'
        })

        EventHandler.connect('show-screen', (sender, { screen, additionalData }) => this.showScreen(screen, additionalData))

        this.showScreen()
      }

      showScreen (screenName, additionalData) {
        let screen

        switch (screenName) {
          case 'stock-details':
            screen = new StockDetailsScreen({ quoteSummary: additionalData.item })
            break

          case 'overview':
          default:
            screen = new StockOverviewScreen()
            break
        }

        this.destroy_all_children()

        this.add_actor(screen)
      }
    }
)
