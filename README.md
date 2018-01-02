# VM4IE8
A simple vue-like library which supports IE8.

## What is this?

This is a very simple implementation of vue@1.0.0, which is created during I'm learning the source code of vue. It has Observer, Dep, 
Directive, Watcher, Batcher, which is the same as vue. This library is derived from this repository, [https://github.com/DMQ/mvvm](https://github.com/DMQ/mvvm).
I rewrite it, so it is more like vue.

Significantly, it works well in IE8 with es5-shim. Yes, you can use reactive two-way data binding in IE8.

You can use it like this:
```html
<div id="app">
  <div>{{text}}</div>
  <div v-text="text"></div>
  <div v-html="html"></div>
  <input type="text" v-model="model"><span>{{model}}</span>
  <div class="none" :class="class"><span>I have a className of </span><span>{{class}}</span></div>
  <div :style="cssString">I have a bule color.</div>
  <div v-show="show" @click="handleShowClick">Click me!</div>
  <div><span>{{say.hello}}</span><span>{{message}}</span></div>
  <div :data-message="message">I have a attribute of data-message</div>
  <div @click="handleComputedClick"><span>I am a computed value:</span>{{hello}}</div>
</div>
<script>
    var vm = new VM({
      el: '#app',
      data: {
        text: "I am some text!",
        html: "<span style='color:red'>red html</span>",
        model: "value",
        'class': 'abc',
        cssString: "color: blue",
        bind: "bind",
        show: true,
        say: {
          hello: "hello"
        },
        message: "everyone"
      },

      computed: {
        hello: function () {
          return this.say.hello + ' ' + this.message
        }
      },

      methods: {
        handleShowClick: function (e) {
          this.show = false
        },
        handleComputedClick: function() {
          this.say.hello = 'hi'
        }
      }
    })

    vm.$watch('say.hello', function (val, oldVal) {
      console.log('say.hello has Changed: the value is now ' + val + ', and old value is ' + oldVal)
      this.message = 'You changed'
    })
  </script>
```

This is a library for learning vue, so DONOT use it in your production environment.

## Supported Features
- reactive two-way data binding.
- computed property.
- directives: v-text, v-html, v-model, v-show, v-bind, v-on.
- IE8 supported.

## Limitations
Object.defineProperty only works on Dom object in IE8, javascript objects are replaced with Dom objects to support data binding, so you cannot use built-in Dom properties such as style, attributes in data property.
```javascript
new VM({
  el: '#app',
  data: {
    style: 'display:none',        // it will cause error in IE8, and has no effect in Chrome
    obj: {
      attributes: 'attributes'    // just don't use like this, please give another property name
    }
  }
})
```


