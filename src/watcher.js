function Watcher(vm, expOrFn, cb) {
  this.cb = cb
  this.vm = vm
  this.expOrFn = expOrFn
  this.depIds = {}

  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
    this.setter = undefined
  } else {
    this.getter = this.parseGetter()
    this.setter = this.parseSetter()
  }

  this.value = this.get()
  vm._watchers.push(this)
}

Watcher.prototype = {
  update: function () {
    batcher.push(this)
  },
  run: function () {
    var value = this.get()
    var oldVal = this.value
    if (value !== oldVal) {
      this.value = value
      this.cb.call(this.vm, value, oldVal)
    }
  },
  addDep: function (dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this)
      this.depIds[dep.id] = dep
    }
  },
  get: function () {
    Dep.target = this
    var value = this.getter.call(this.vm, this.vm)
    Dep.target = null
    return value
  },
  parseGetter: function () {
    if (/[^\w.$]/.test(this.expOrFn)) return

    var exps = this.expOrFn.split('.')

    return function (obj) {
      for (var i = 0, len = exps.length; i < len; i++) {
        if (!obj) return
        obj = obj[exps[i]]
      }
      return obj
    }
  },
  set: function (val) {
    this.setter && this.setter.call(this.vm, this.vm, val)
  },
  parseSetter: function () {
    if (/[^\w.$]/.test(this.expOrFn)) return

    var exps = this.expOrFn.split('.')

    return function (obj, val) {
      for (var i = 0, len = exps.length; i < len; i++) {
        if (i < len - 1) {
          obj = obj[exps[i]]
        } else {
          obj[exps[i]] = val
        }
      }
    }
  }
}