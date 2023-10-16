import Gio from 'gi://Gio'
import GObject from 'gi://GObject'

export const NewItemModel = GObject.registerClass({
  GTypeName: 'StockExtension-NewItemModel',
}, class NewItemModelClass extends GObject.Object {
  static [GObject.interfaces] = [Gio.ListModel]

  #item = new GObject.Object()

  vfunc_get_item_type () {
    return GObject.Object
  }

  vfunc_get_n_items () {
    return 1
  }

  vfunc_get_item (_pos) {
    return this.#item
  }
})
