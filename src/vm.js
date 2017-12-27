function VM(options) {
  this.$options = options || {}
  var data = this.$options.data
  var observer = Observer.create(data)

  data = observer.data;
  this._keys = observer.keys;

  var proxy = document.createElement('div')
  this._proxy = proxy
  proxy._data = data


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

  this._initComputed()

  this._mergeDOMProxy()

  if(options.el) {
    this.$mount(options.el)
  }

  return this._proxy
}

VM.prototype._initComputed = function() {
  var proxy = this._proxy
  var computed = this.$options.computed;
  if (typeof computed === 'object') {
    Object.keys(computed).forEach(function (key) {
      Object.defineProperty(proxy, key, {
        get: typeof computed[key] === 'function'
          ? computed[key]
          : computed[key].get,
        set: function () { }
      });
    });
  }
}

VM.prototype._mergeDOMProxy = function() {
  for (var i in this) {
    this._proxy[i] = this[i]
  }
}

VM.prototype.$mount = function(el) {
  this.$compile = new Compile(el, this._proxy)
}