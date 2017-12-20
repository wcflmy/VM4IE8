function VM(options) {
  this.$options = options || {}
  var data = this.$options.data
  var observer = Observer.create(data)

  data = observer.data;
  this._keys = observer.keys;

  var proxy = document.createElement('div')
  this._proxy = proxy
  proxy._data = data


  // 数据代理
  // 实现 vm.xxx -> vm._data.xxx
  this._keys.forEach(function (key) {
    Object.defineProperty(proxy, key, {
      get: function () {
        return proxy._data[key]
      },
      set: function (val) {
        proxy._data[key] = val
      }
    })
  });

  if(options.el) {
    this.$mount(options.el)
  }
  return this._mergeDOMProxy(proxy)
}

VM.prototype._mergeDOMProxy = function(proxy) {
  for (var i in this) {
    proxy[i] = this[i]
  }
  return proxy
}

VM.prototype.$mount = function(el) {
  this.$compile = new Compile(el, this._proxy)
}