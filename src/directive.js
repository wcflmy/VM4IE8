function Directive(descriptor, vm, el) {
  this.vm = vm
  this.el = el
  this.descriptor = descriptor
  this._locked = false
}

Directive.prototype._bind = function() {
  var self = this

  if(this.el.removeAttribute) {
    this.el.removeAttribute(this.descriptor.attr || 'v-' + this.descriptor.name)
  }

  this.update = (Directive[this.descriptor.name] || {}).update

  this.bind = (Directive[this.descriptor.name] || {}).bind
  if(this.bind) {
    this.bind()
  }

  if(this.update) {
    this._update = function(val, oldVal) {
      if(!self._locked) {
        self.update(val, oldVal)
      }
    }
  } else {
    this._update = function() {}
  }

  var watcher = this._watcher = new Watcher(this.vm, this.descriptor.expression, this._update)
  if(this.update) {
    this.update(watcher.value)
  }
}

// directives
Directive.text = {
  update: function(val) {
    this.el.data = typeof val == 'undefined' ? '' : val
  }
}

Directive.html = {
  update: function(val) {
    this.el.innerHTML = typeof val == 'undefined' ? '' : val
  }
}

Directive.model = {
  bind: function() {
    var self = this
    addEventListener(this.el, 'input', function(e) {
      self._watcher.set(self.el.value)
    })

    addEventListener(this.el, 'propertychange', function(e) {
      self._watcher.set(self.el.value)
    })
  },
  update: function(val) {
    this.el.value = typeof val == 'undefined' ? '' : val
  }
}

Directive.show = {
  update: function(val) {
    this.el.style.display = val ? 'block' : 'none'
  }
}

Directive['class'] = {
  update: function(val, oldVal) {
    var className = this.el.className
    className = className.replace(oldVal, '').replace(/\s$/, '')
    var space = className && String(val) ? ' ' : ''
    this.el.className = className + space + val
  }
}

Directive.style = {
  update: function(val) {
    this.el.style.cssText = val
  }
}

Directive.bind = {
  update: function (val) {
    if(val != null && val !== false)
    this.el.setAttribute(this.descriptor.arg, val)
  }
}

Directive.on = {
  bind: function() {
    var self = this
    addEventListener(this.el, this.descriptor.arg, function(e) {
      self.vm[self.descriptor.expression].call(self.vm, e)
    })
  }
}

function addEventListener(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false)
  }
  else if (element.attachEvent) {
    //这里采用比上面更简单的方法来修正this指向问题，参考《Javascript.DOM高级程序设计》
    //并且可以保证了可移除性
    //若使用简单的匿名函数的话
    //element.attachEvent("on"+type, function(e)
    // {
    // 		handler.call(element, window.event || e)
    // })
    // 则调用detachEvent("on"+type, handler)无法移除该事件
    element["e" + type + handler] = handler
    element[type + handler] = function (e) {
      element["e" + type + handler](e || window.event)
      //handler.call(element, window.event)
    }
    element.attachEvent("on" + type, element[type + handler])
  }
}

function removeEventListener(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false)
  }
  else if (element.detachEvent) {
    element.detachEvent("on" + type, element[type + handler])
    element[type + handler] = null
    element["e" + type + handler] = null
  }
}