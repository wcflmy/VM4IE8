var arrayMethods = {}

;[
  'concat',
  'copyWithin',
  'entries',
  'every',
  'fill',
  'filter',
  'find',
  'findIndex',
  'forEach',
  'includes',
  'indexOf',
  'join',
  'keys',
  'lastIndexOf',
  'map',
  'pop',
  'push',
  'reduce',
  'reduceRight',
  'reverse',
  'shift',
  'slice',
  'some',
  'sort',
  'splice',
  'toLocalString',
  'toString',
  'unshift'
]
  .forEach(function (method) {
    // cache original method
    var originalMethod = Array.prototype[method]
    arrayMethods[method] = function mutator() {
      // avoid leaking arguments:
      // http://jsperf.com/closure-with-arguments
      var i = arguments.length
      var args = new Array(i)
      while (i--) {
        args[i] = arguments[i]
      }
      var originalLen = this.length
      var ob = this.__ob__
      var result = originalMethod.apply(ob.value, args)
      ob.keys = Object.keys(ob.value)
      var key, changed
      var inserted = []
      var removed = []
      switch (method) {
        case 'push':
          for (key = originalLen, i = 0; key < originalLen + args.length; key++ , i++) {
            this[key] = (Observer.create(args[i]) || {}).data || args[i]
            inserted.push(this[key])
          }
          this.length = ob.value.length
          changed = true
          break
        case 'unshift':
          move(this, 0, args.length)
          for (key = 0; key < args.length; key++) {
            this[key] = (Observer.create(args[key]) || {}).data || args[key]
            inserted.push(this[key])
          }
          this.length = originalLen + args.length
          changed = true
          break
        case 'splice':
          var index = args[0]
          var deleteCount = args[1]
          index = index > originalLen - 1 ? originalLen - 1 : index
          index = index < 0 ? originalLen + index : index
          deleteCount = deleteCount > originalLen - index ? originalLen - index : deleteCount
          deleteCount = deleteCount < 0 ? 0 : deleteCount
          args = args.slice(2)
          var addedCount = args.length - deleteCount
          for (key = index; key < index + deleteCount; key++) {
            removed.push(this[key])
            delete this[key]
          }
          move(this, index + deleteCount, addedCount)
          // copy added item
          for (i = 0; i < args.length; i++) {
            this[index + i] = (Observer.create(args[i]) || {}).data || args[i]
            inserted.push(this[index + i])
          }
          this.length = originalLen + addedCount
          changed = true
          break
        case 'pop':
          removed.push(this[originalLen - 1])
          delete this[originalLen - 1]
          this.length = originalLen - 1
          changed = true
          break
        case 'shift':
          removed.push(this[0])
          for (key = 1; key < this.length; key++) {
            this[key - 1] = this[key]
          }
          delete this[originalLen - 1]
          this.length = originalLen - 1
          changed = true
          break
        case 'sort':
        case 'reverse':
          var copy = []
          for (key = 0; key < this.length; key++) {
            copy[key] = this[key]
          }
          originalMethod.apply(copy, args)
          for (key = 0; key < this.length; key++) {
            this[key] = copy[key]
          }
          changed = true
          break
        default:
          // result = originalMethod.apply(this, args)
          break
      }
      if (changed) {
        if (inserted) ob.observeArray(inserted)
        if (removed) ob.unobserveArray(removed)
        // notify change
        ob.notify()
      }
      return result
    }
  })

function move(array, index, offset) {
  var key
  var originalLen = array.length
  if (offset > 0) {
    // copy the items from low to high
    for (key = originalLen - 1; key >= index; key--) {
      array[key + offset] = array[key]
    }
  } else {
    // copy the items from high to low
    for (key = index; key < originalLen; key++) {
      array[key + offset] = array[key]
    }
  }
}

Array.prototype.$set = function $set(index, val) {
  if (index >= this.length) {
    this.length = index + 1
  }
  return this.splice(index, 1, val)[0]
}

Array.prototype.$remove = function $remove(item) {
  /* istanbul ignore if */
  if (!this.length) return
  var index = this.indexOf(item)
  if (index > -1) {
    return this.splice(index, 1)
  }
}

function Observer(data) {
  // store the original value
  this.value = data
  var proxy = createDomProxy()
  var keys = Object.keys(data)
  var i = keys.length
  // copy data to the proxy
  while (i--) {
    proxy[keys[i]] = data[keys[i]]
  }
  if(data.length) {     // for Array
    proxy.length = data.length
  }
  proxy.__ob__ = this
  this.dep = new Dep()
  this.data = proxy
  this.keys = keys
  if(isArray(proxy)) {
    copyAugment(proxy, arrayMethods)
    this.observeArray(proxy)
  } else {
    this.walk(proxy)
  }
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

Observer.prototype.observeArray = function (items) {
  var i = items.length
  while (i--) {
    var ob = Observer.create(items[i])
    items[i] = (ob || {}).data || items[i]
    if (ob) {
      (ob.parents || (ob.parents = [])).push(this)
    }
  }
}

Observer.prototype.unobserveArray = function (items) {
  var i = items.length
  while (i--) {
    var ob = items[i] && items[i].__ob__
    if (ob) {
      ob.parents.$remove(this)
    }
  }
}

Observer.prototype.notify = function () {
  this.dep.notify()
  var parents = this.parents
  if (parents) {
    var i = parents.length
    while (i--) {
      parents[i].notify()
    }
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
        if(childOb) {
          childOb.dep.depend()
        }
      }
      return val
    },
    set: function (newVal) {
      // console.log('set: ', key, Dep.target)
      if (newVal === val) {
        return
      }
      obj.__ob__.value[key] = newVal          // update the original value
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

function isArray (array) {
  if (!array) return false
  var length = array.length
  return length === 0 ||
    typeof length === 'number' && length > 0 && (length - 1) in array
}

function copyAugment(target, src) {
  for (var i in src) {
    target[i] = src[i]
  }
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