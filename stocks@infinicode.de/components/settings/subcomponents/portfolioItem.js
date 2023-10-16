import GObject from 'gi://GObject'

export const PortfolioItem = GObject.registerClass({
  GTypeName: 'PortfolioExtension-PortfolioItem',
  Properties: {
    'id': GObject.ParamSpec.string('id', 'id', 'id', GObject.ParamFlags.READWRITE, null),
    'name': GObject.ParamSpec.string('name', 'name', 'name', GObject.ParamFlags.READWRITE, null)
  },
}, class PortfolioItemClass extends GObject.Object {
  id = null
  name = null
  symbols = []
})
