function VM(options) {
  return this._init(options)
}

VM.nextTick = nextTick

VM.prototype._init = function(options) {
  this.$options = options || {}

  // create dom proxy
  this._domProxy = createDomProxy()
  for (var i in this) {
    var v = this[i]
    this._domProxy[i] = v
  }

  this._domProxy._directives = []
  this._domProxy._watchers = []

  this._domProxy._initMethods()

  this._domProxy._initData()

  this._domProxy._initComputed()

  if (options.el) {
    this._domProxy.$mount(options.el)
  }

  return this._domProxy
}

VM.prototype._initData = function() {
  var data = this.$options.data
  var observer = Observer.create(data)

  this._keys = observer.keys
  this._data = observer.data

  var i, key
  i = this._keys.length
  while (i--) {
    key = this._keys[i]
    this._proxy(key)
  }
}

VM.prototype._initComputed = function() {
  var computed = this.$options.computed
  if (typeof computed === 'object') {
    Object.keys(computed).forEach(function (key) {
      Object.defineProperty(this, key, {
        get: typeof computed[key] === 'function'
          ? computed[key]
          : computed[key].get,
        set: typeof computed[key] === 'function'
          ? function () { }
          : computed[key].set
      })
    }.bind(this))
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
  Object.defineProperty(this, key, {
    configurable: true,
    get: function proxyGetter() {
      return this._data[key]
    },
    set: function proxySetter(val) {
      this._data[key] = val
    }
  })
}

VM.prototype._bindDir = function(dir, el) {
  this._directives.push(new Directive(dir, this, el))
}

VM.prototype.$mount = function(el) {
  el = el.nodeType === 1 ? el : document.querySelector(el)
  el = Compile.transclude(el, this.$options)
  this.$compile = new Compile(el, this)
}

VM.prototype.$watch = function(key, cb) {
  new Watcher(this, key, cb)
}

VM.prototype.$nextTick = function(cb) {
  VM.nextTick(cb, this)
}