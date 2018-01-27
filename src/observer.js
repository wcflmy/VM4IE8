function Observer(data) {
  var proxy = createDomProxy()
  var keys = Object.keys(data)
  var i = keys.length
  // copy data to the proxy
  while (i--) {
    proxy[keys[i]] = JSON.parse(JSON.stringify(data[keys[i]]))
  }
  if(data.length) {     // for Array
    proxy.length = data.length
  }
  proxy.__ob__ = this
  this.data = proxy
  this.raw_data = data
  this.keys = keys
  this.walk(proxy)
}

Observer.create = function (value) {
  if (!value || typeof value !== 'object') {
    return
  }
  var ob
  if (
    value.__ob__ &&
    value.__ob__ instanceof Observer
  ) {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }
  return ob
}

Observer.prototype.walk = function (obj) {
  var keys = this.keys
  var i = keys.length
  while (i--) {
    this.convert(keys[i], obj[keys[i]])
  }
}

Observer.prototype.convert = function (key, val) {
  this.defineReactive(this.data, key, val)
}

var defineReactive = Observer.prototype.defineReactive = function (obj, key, val) {
  var dep = new Dep()
  dep.key = key
  // console.log('define: ', key, Dep.target)
  var childOb = Observer.create(val)
  val = (childOb || {}).data || val

  Object.defineProperty(obj, key, {
    configurable: true,
    get: function () {
      // console.log('get: ', key, Dep.target)
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set: function (newVal) {
      // console.log('set: ', key, Dep.target)
      if (newVal === val) {
        return
      }
      childOb = Observer.create(newVal)
      val = (childOb || {}).data || newVal
      dep.notify()
    }
  })
}

function createDomProxy() {
  var proxy = document.createElement('null')
    // copy Object.prototype's functions to proxy
    ;[
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf'
    ].forEach(function (method) {
      proxy[method] = Object.prototype[method]
    })
  return proxy
}

var uid = 0

function Dep() {
  this.id = uid++
  this.subs = []
}

Dep.prototype = {
  addSub: function (sub) {
    this.subs.push(sub)
  },

  depend: function () {
    Dep.target.addDep(this)
  },

  removeSub: function (sub) {
    var index = this.subs.indexOf(sub)
    if (index != -1) {
      this.subs.splice(index, 1)
    }
  },

  notify: function () {
    this.subs.forEach(function (sub) {
      sub.update()
    })
  }
}

Dep.target = null