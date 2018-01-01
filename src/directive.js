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

    this.el.addEventListener('propertychange', function (e) {
      self._watcher.set(self.el.value)
    })
    
    this.el.addEventListener('input', function(e) {
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
    this.el.addEventListener(this.descriptor.arg, function(e) {
      self.vm[self.descriptor.expression].call(self.vm, e)
    })
  }
}

// From here: https://msdn.microsoft.com/en-us/library/dd229916(VS.85).aspx
if(!document.addEventListener) {
  Element.prototype.addEventListener =
  Window.prototype.addEventListener = function (type, fCallback, capture) {
    var modtypeForIE = "on" + type
    if (capture) {
      throw new Error("This implementation of addEventListener does not support the capture phase")
    }
    var nodeWithListener = this
    this.attachEvent(modtypeForIE, function (e) {
      // Add some extensions directly to 'e' (the actual event instance)
      // Create the 'currentTarget' property (read-only)
      Object.defineProperty(e, 'currentTarget', {
        get: function () {
          // 'nodeWithListener' as defined at the time the listener was added.
          return nodeWithListener
        }
      })
      // Create the 'eventPhase' property (read-only)
      Object.defineProperty(e, 'eventPhase', {
        get: function () {
          return (e.srcElement == nodeWithListener) ? 2 : 3 // "AT_TARGET" = 2, "BUBBLING_PHASE" = 3
        }
      })
      // Create a 'timeStamp' (a read-only Date object)
      var time = new Date() // The current time when this anonymous function is called.
      Object.defineProperty(e, 'timeStamp', {
        get: function () {
          return time
        }
      })
      // Call the function handler callback originally provided...
      fCallback.call(nodeWithListener, e) // Re-bases 'this' to be correct for the callback.
    })
  }

  // Extend Event.prototype with a few of the W3C standard APIs on Event
  // Add 'target' object (read-only)
  Object.defineProperty(Event.prototype, 'target', {
    get: function () {
      return this.srcElement
    }
  })
  // Add 'stopPropagation' and 'preventDefault' methods
  Event.prototype.stopPropagation = function () {
    this.cancelBubble = true
  }
  Event.prototype.preventDefault = function () {
    this.returnValue = false
  }
}