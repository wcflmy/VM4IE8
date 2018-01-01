function VM(options) {
  return this._init(options)
}

VM.nextTick = nextTick

VM.prototype._init = function(options) {
  this.$options = options || {}
  this._directives = []

  this._initMethods()

  this._initData()

  this._initComputed()

  for (var i in this) {
    this._domProxy[i] = this[i]
  }

  if (options.el) {
    this.$mount(options.el)
  }

  return this._domProxy
}

VM.prototype._initData = function() {
  var data = this.$options.data
  var observer = Observer.create(data)

  data = observer.data
  this._keys = observer.keys

  var proxy = document.createElement('div')
  this._domProxy = proxy
  proxy._data = data

  var i, key
  i = this._keys.length
  while (i--) {
    key = this._keys[i]
    this._proxy(key)
  }
}

VM.prototype._initComputed = function() {
  var proxy = this._domProxy
  var computed = this.$options.computed
  if (typeof computed === 'object') {
    Object.keys(computed).forEach(function (key) {
      Object.defineProperty(proxy, key, {
        get: typeof computed[key] === 'function'
          ? computed[key]
          : computed[key].get,
        set: function () { }
      })
    })
  }
}

VM.prototype._initMethods = function() {
  var methods = this.$options.methods
  if (methods) {
    for (var key in methods) {
      this[key] = methods[key]
    }
  }
}

VM.prototype._proxy = function(key) {
  var self = this
  Object.defineProperty(self._domProxy, key, {
    configurable: true,
    get: function proxyGetter() {
      return self._domProxy._data[key]
    },
    set: function proxySetter(val) {
      self._domProxy._data[key] = val
    }
  })
}

VM.prototype._bindDir = function(dir, el) {
  this._domProxy._directives.push(new Directive(dir, this._domProxy, el))
}

VM.prototype.$mount = function(el) {
  this.$compile = new Compile(el, this._domProxy)
}

VM.prototype.$watch = function(key, cb) {
  new Watcher(this, key, cb)
}

VM.prototype.$nextTick = function(cb) {
  VM.nextTick(cb, this)
}