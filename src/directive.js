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

  var def = Directive[this.descriptor.name] || {}
  // extend bind, update functions to the instance of Directive for fixing `this`
  for(var i in def) {
    this[i] = def[i]
  }

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

  var watcher = this._watcher = new Watcher(this.vm, this.descriptor.expression, this._update, {
    process: this.process
  })
  if(this.update) {
    this.update(watcher.value)
  }
}

// directives
Directive.text = {
  update: function(val) {
    val = typeof val == 'undefined' ? '' : val
    if(this.el.nodeType == 3) {
      this.el.data = val          // for <span>{{text}}</span>
    } else {                      // for <span v-text="text"></span>
      this.el.textContent = val
      this.el.innerText = val     // for IE8
    }
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

    // for IE8
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

Directive['if'] = {
  bind: function() {
    var next = this.el.nextElementSibling
    var parent = this.el.parentNode
    if (next && next.getAttribute('v-else') !== null) {
      next.removeAttribute('v-else')
      this.elseEl = next
      parent.removeChild(next)
      new Compile(this.elseEl, this.vm)
    }
    this.anchor = document.createTextNode('')
    // give a anchor for holding the place
    parent.replaceChild(this.anchor, this.el)
    new Compile(this.el, this.vm)
  },
  update: function(value) {
    var trueEl = value ? this.el : this.elseEl
    var falseEl = value ? this.elseEl : this.el
    var parent = this.anchor.parentNode
    try {
      parent.removeChild(falseEl)
    } catch(e) {}
    parent.insertBefore(trueEl, this.anchor)
  }
}

// for IE8
if(!document.addEventListener) {
  Object.defineProperty(Element.prototype, 'nextElementSibling', {
    get: function() {
      var ele = this;
      do {
        ele = ele.nextSibling;
      } while (ele && ele.nodeType !== 1);
      return ele;
    }
  })
}

Directive['for'] = {
  bind: function() {
    var inMatch = this.descriptor.expression.match(/(.*) in (.*)/)
    if (inMatch) {
      this.alias = inMatch[1].trim()
      this.descriptor.expression = inMatch[2].trim()
    }
    var parent = this.el.parentNode
    this.anchor = document.createTextNode('')
    this.template = this.el.cloneNode(true)
    parent.replaceChild(this.anchor, this.el)
  },
  update: function(value) {
    var parent = this.anchor.parentNode
    while(this.anchor !== parent.firstChild) {
      parent.removeChild(parent.firstChild)
    }
    this.frag = document.createDocumentFragment()
    for(var i=0; i<value.length; i++) {
      this.el = this.template.cloneNode(true)
      // create a new scope
      var scope = new VM({
        data: this.vm._data
      })
      defineReactive(scope, this.alias, value[i].$value)
      defineReactive(scope, value[i].$key, value[i].$value)
      new Compile(this.el, scope)
      this.frag.appendChild(this.el)
    }
    parent.insertBefore(this.frag, this.anchor)
    this.frag = null
  },
  process: function(value) {
    if (typeof value === 'object') {
      var keys = value.__ob__.keys
      var i = keys.length
      var res = new Array(i)
      var key
      while (i--) {
        key = keys[i]
        res[i] = {
          $key: key,
          $value: value[key]
        }
      }
      return res
    } else {
      var type = typeof value
      if (type === 'number') {
        value = range(value)
      }
      return value || []
    }

    function range(n) {
      var i = -1
      var ret = new Array(n)
      while (++i < n) {
        ret[i] = i
      }
      return ret
    }
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