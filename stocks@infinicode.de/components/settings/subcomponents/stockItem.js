import GObject from 'gi://GObject'

export const StockItem = GObject.registerClass({
  GTypeName: 'StockExtension-StockItem',
  Properties: {
    'id': GObject.ParamSpec.string('id', 'id', 'id', GObject.ParamFlags.READWRITE, null),
    'name': GObject.ParamSpec.string('name', 'name', 'name', GObject.ParamFlags.READWRITE, null),
    'symbol': GObject.ParamSpec.string('symbol', 'symbol', 'symbol', GObject.ParamFlags.READWRITE, 'AHLA.DE'),
    'provider': GObject.ParamSpec.string('provider', 'provider', 'provider', GObject.ParamFlags.READWRITE, 'yahoo'),
    'showInTicker': GObject.ParamSpec.boolean('showInTicker', 'showInTicker', 'showInTicker', GObject.ParamFlags.READWRITE, false),
  },
}, class StockItemClass extends GObject.Object {
  id = null
  name = null
  symbol = null
  provider = null
  showInTicker = false
})
