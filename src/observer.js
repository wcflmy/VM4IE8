function Observer(data) {
  var proxy = document.createElement('div')
  var keys = Object.keys(data)
  var i = keys.length
  while (i--) {
    proxy[keys[i]] = JSON.parse(JSON.stringify(data[keys[i]]))
  }
  this.data = proxy
  this.keys = keys
  this.walk(proxy)
}

Observer.create = function (value) {
  if (!value || typeof value !== 'object') {
    return
  }
  return new Observer(value)
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

Observer.prototype.defineReactive = function (obj, key, val) {
  var dep = new Dep()
  var childOb = Observer.create(val)
  val = (childOb || {}).data || val

  Object.defineProperty(obj, key, {
    get: function () {
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) {
        return
      }
      childOb = Observer.create(newVal)
      val = (childOb || {}).data || newVal
      dep.notify()
    }
  })
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