/*
 * Purl (A JavaScript URL parser) v2.3.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */

;(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        window.purl = factory();
    }
})(function() {

    var tag2attr = {
            a       : 'href',
            img     : 'src',
            form    : 'action',
            base    : 'href',
            script  : 'src',
            iframe  : 'src',
            link    : 'href'
        },

        key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], // keys available to query

        aliases = { 'anchor' : 'fragment' }, // aliases for backwards compatability

        parser = {
            strict : /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,  //less intuitive, more accurate to the specs
            loose : /^(?:(?![^:@?]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@?]*):?([^:@?]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
        },

        isint = /^[0-9]+$/;

    function parseUri( url, strictMode ) {
        var str = decodeURI( url ),
        res   = parser[ strictMode || false ? 'strict' : 'loose' ].exec( str ),
        uri = { attr : {}, param : {}, seg : {} },
        i   = 14;

        while ( i-- ) {
            uri.attr[ key[i] ] = res[i] || '';
        }

        // build query and fragment parameters
        uri.param['query'] = parseString(uri.attr['query']);
        uri.param['fragment'] = parseString(uri.attr['fragment']);

        // split path and fragement into segments
        uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g,'').split('/');
        uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g,'').split('/');

        // compile a 'base' domain attribute
        uri.attr['base'] = uri.attr.host ? (uri.attr.protocol ?  uri.attr.protocol+'://'+uri.attr.host : uri.attr.host) + (uri.attr.port ? ':'+uri.attr.port : '') : '';

        return uri;
    }

    function getAttrName( elm ) {
        var tn = elm.tagName;
        if ( typeof tn !== 'undefined' ) return tag2attr[tn.toLowerCase()];
        return tn;
    }

    function promote(parent, key) {
        if (parent[key].length === 0) return parent[key] = {};
        var t = {};
        for (var i in parent[key]) t[i] = parent[key][i];
        parent[key] = t;
        return t;
    }

    function parse(parts, parent, key, val) {
        var part = parts.shift();
        if (!part) {
            if (isArray(parent[key])) {
                parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
                parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
                parent[key] = val;
            } else {
                parent[key] = [parent[key], val];
            }
        } else {
            var obj = parent[key] = parent[key] || [];
            if (']' == part) {
                if (isArray(obj)) {
                    if ('' !== val) obj.push(val);
                } else if ('object' == typeof obj) {
                    obj[keys(obj).length] = val;
                } else {
                    obj = parent[key] = [parent[key], val];
                }
            } else if (~part.indexOf(']')) {
                part = part.substr(0, part.length - 1);
                if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                parse(parts, obj, part, val);
                // key
            } else {
                if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                parse(parts, obj, part, val);
            }
        }
    }

    function merge(parent, key, val) {
        if (~key.indexOf(']')) {
            var parts = key.split('[');
            parse(parts, parent, 'base', val);
        } else {
            if (!isint.test(key) && isArray(parent.base)) {
                var t = {};
                for (var k in parent.base) t[k] = parent.base[k];
                parent.base = t;
            }
            if (key !== '') {
                set(parent.base, key, val);
            }
        }
        return parent;
    }

    function parseString(str) {
        return reduce(String(str).split(/&|;/), function(ret, pair) {
            try {
                pair = decodeURIComponent(pair.replace(/\+/g, ' '));
            } catch(e) {
                // ignore
            }
            var eql = pair.indexOf('='),
                brace = lastBraceInKey(pair),
                key = pair.substr(0, brace || eql),
                val = pair.substr(brace || eql, pair.length);

            val = val.substr(val.indexOf('=') + 1, val.length);

            if (key === '') {
                key = pair;
                val = '';
            }

            return merge(ret, key, val);
        }, { base: {} }).base;
    }

    function set(obj, key, val) {
        var v = obj[key];
        if (typeof v === 'undefined') {
            obj[key] = val;
        } else if (isArray(v)) {
            v.push(val);
        } else {
            obj[key] = [v, val];
        }
    }

    function lastBraceInKey(str) {
        var len = str.length,
            brace,
            c;
        for (var i = 0; i < len; ++i) {
            c = str[i];
            if (']' == c) brace = false;
            if ('[' == c) brace = true;
            if ('=' == c && !brace) return i;
        }
    }

    function reduce(obj, accumulator){
        var i = 0,
            l = obj.length >> 0,
            curr = arguments[2];
        while (i < l) {
            if (i in obj) curr = accumulator.call(undefined, curr, obj[i], i, obj);
            ++i;
        }
        return curr;
    }

    function isArray(vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
    }

    function keys(obj) {
        var key_array = [];
        for ( var prop in obj ) {
            if ( obj.hasOwnProperty(prop) ) key_array.push(prop);
        }
        return key_array;
    }

    function purl( url, strictMode ) {
        if ( arguments.length === 1 && url === true ) {
            strictMode = true;
            url = undefined;
        }
        strictMode = strictMode || false;
        url = url || window.location.toString();

        return {

            data : parseUri(url, strictMode),

            // get various attributes from the URI
            attr : function( attr ) {
                attr = aliases[attr] || attr;
                return typeof attr !== 'undefined' ? this.data.attr[attr] : this.data.attr;
            },

            // return query string parameters
            param : function( param ) {
                return typeof param !== 'undefined' ? this.data.param.query[param] : this.data.param.query;
            },

            // return fragment parameters
            fparam : function( param ) {
                return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
            },

            // return path segments
            segment : function( seg ) {
                if ( typeof seg === 'undefined' ) {
                    return this.data.seg.path;
                } else {
                    seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.path[seg];
                }
            },

            // return fragment segments
            fsegment : function( seg ) {
                if ( typeof seg === 'undefined' ) {
                    return this.data.seg.fragment;
                } else {
                    seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.fragment[seg];
                }
            }

        };

    }
    
    purl.jQuery = function($){
        if ($ != null) {
            $.fn.url = function( strictMode ) {
                var url = '';
                if ( this.length ) {
                    url = $(this).attr( getAttrName(this[0]) ) || '';
                }
                return purl( url, strictMode );
            };

            $.url = purl;
        }
    };

    purl.jQuery(window.jQuery);

    return purl;

});

// Generated by CoffeeScript 1.3.3
(function() {
  var $, normaliseLang;

  $ = jQuery;

  normaliseLang = function(lang) {
    lang = lang.replace(/_/, '-').toLowerCase();
    if (lang.length > 3) {
      lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
    }
    return lang;
  };

  $.defaultLanguage = normaliseLang(navigator.language || navigator.userLanguage);

  $.localize = function(pkg, options) {
    var defaultCallback, fileExtension, intermediateLangData, jsonCall, lang, loadLanguage, localizeElement, localizeForSpecialKeys, localizeImageElement, localizeInputElement, localizeOptgroupElement, notifyDelegateLanguageLoaded, regexify, setAttrFromValueForKey, setTextFromValueForKey, valueForKey, wrappedSet;
    if (options == null) {
      options = {};
    }
    wrappedSet = this;
    intermediateLangData = {};
    fileExtension = options.fileExtension || "json";
    // fileExtension += NO_CACHE;
    loadLanguage = function(pkg, lang, level) {
      var file;
      if (level == null) {
        level = 1;
      }
      switch (level) {
        case 1:
          intermediateLangData = {};
          if (options.loadBase) {
            file = pkg + ("." + fileExtension);
            return jsonCall(file, pkg, lang, level);
          } else {
            return loadLanguage(pkg, lang, 2);
          }
          break;
        case 2:
          if (lang.length >= 2) {
            file = "" + pkg + "-" + (lang.substring(0, 2)) + "." + fileExtension;
            return jsonCall(file, pkg, lang, level);
          }
          break;
        case 3:
          if (lang.length >= 5) {
            file = "" + pkg + "-" + (lang.substring(0, 5)) + "." + fileExtension;
            return jsonCall(file, pkg, lang, level);
          }
      }
    };
    jsonCall = function(file, pkg, lang, level) {
      var ajaxOptions, successFunc;
      if (options.pathPrefix != null) {
        file = "" + options.pathPrefix + "/" + file;
      }
      successFunc = function(d) {
        $.extend(intermediateLangData, d);
        notifyDelegateLanguageLoaded(intermediateLangData);
        return loadLanguage(pkg, lang, level + 1);
      };
      ajaxOptions = {
        url: file,
        dataType: "json",
        async: false,
        timeout: options.timeout != null ? options.timeout : 500,
        success: successFunc
      };
      if (window.location.protocol === "file:") {
        ajaxOptions.error = function(xhr) {
          return successFunc($.parseJSON(xhr.responseText));
        };
      }
      return $.ajax(ajaxOptions);
    };
    notifyDelegateLanguageLoaded = function(data) {
      if (options.callback != null) {
        return options.callback(data, defaultCallback);
      } else {
        return defaultCallback(data);
      }
    };
    defaultCallback = function(data) {
      $.localize.data[pkg] = data;
      return wrappedSet.each(function() {
        var elem, key, value;
        elem = $(this);
        key = elem.data("localize");
        key || (key = elem.attr("rel").match(/localize\[(.*?)\]/)[1]);
        value = valueForKey(key, data);
        return localizeElement(elem, key, value);
      });
    };
    localizeElement = function(elem, key, value) {
      if (elem.is('input')) {
        localizeInputElement(elem, key, value);
      } else if (elem.is('img')) {
        localizeImageElement(elem, key, value);
      } else if (elem.is('optgroup')) {
        localizeOptgroupElement(elem, key, value);
      } else if (!$.isPlainObject(value)) {
        elem.html(value);
      }
      if ($.isPlainObject(value)) {
        return localizeForSpecialKeys(elem, value);
      }
    };
    localizeInputElement = function(elem, key, value) {
      var val;
      val = $.isPlainObject(value) ? value.value : value;
      if (elem.is("[placeholder]")) {
        return elem.attr("placeholder", val);
      } else {
        return elem.val(val);
      }
    };
    localizeForSpecialKeys = function(elem, value) {
      setAttrFromValueForKey(elem, "title", value);
      return setTextFromValueForKey(elem, "text", value);
    };
    localizeOptgroupElement = function(elem, key, value) {
      return elem.attr("label", value);
    };
    localizeImageElement = function(elem, key, value) {
      setAttrFromValueForKey(elem, "alt", value);
      return setAttrFromValueForKey(elem, "src", value);
    };
    valueForKey = function(key, data) {
      var keys, value, _i, _len;
      keys = key.split(/\./);
      value = data;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        value = value != null ? value[key] : null;
      }
      return value;
    };
    setAttrFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value);
      if (value != null) {
        return elem.attr(key, value);
      }
    };
    setTextFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value);
      if (value != null) {
        return elem.text(value);
      }
    };
    regexify = function(string_or_regex_or_array) {
      var thing;
      if (typeof string_or_regex_or_array === "string") {
        return "^" + string_or_regex_or_array + "$";
      } else if (string_or_regex_or_array.length != null) {
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = string_or_regex_or_array.length; _i < _len; _i++) {
            thing = string_or_regex_or_array[_i];
            _results.push(regexify(thing));
          }
          return _results;
        })()).join("|");
      } else {
        return string_or_regex_or_array;
      }
    };
    lang = normaliseLang(options.language ? options.language : $.defaultLanguage);
    if (!(options.skipLanguage && lang.match(regexify(options.skipLanguage)))) {
      loadLanguage(pkg, lang, 1);
    }
    return wrappedSet;
  };

  $.fn.localize = $.localize;

  $.localize.data = {};

}).call(this);

/*! gridster.js - v0.2.1 - 2013-10-28
* http://gridster.net/
* Copyright (c) 2013 ducksboard; Licensed MIT */

;(function($, window, document, undefined){
    /**
    * Creates objects with coordinates (x1, y1, x2, y2, cx, cy, width, height)
    * to simulate DOM elements on the screen.
    * Coords is used by Gridster to create a faux grid with any DOM element can
    * collide.
    *
    * @class Coords
    * @param {HTMLElement|Object} obj The jQuery HTMLElement or a object with: left,
    * top, width and height properties.
    * @return {Object} Coords instance.
    * @constructor
    */
    function Coords(obj) {
        if (obj[0] && $.isPlainObject(obj[0])) {
            this.data = obj[0];
        }else {
            this.el = obj;
        }

        this.isCoords = true;
        this.coords = {};
        this.init();
        return this;
    }


    var fn = Coords.prototype;


    fn.init = function(){
        this.set();
        this.original_coords = this.get();
    };


    fn.set = function(update, not_update_offsets) {
        var el = this.el;

        if (el && !update) {
            this.data = el.offset();
            this.data.width = el.width();
            this.data.height = el.height();
        }

        if (el && update && !not_update_offsets) {
            var offset = el.offset();
            this.data.top = offset.top;
            this.data.left = offset.left;
        }

        var d = this.data;

        this.coords.x1 = d.left;
        this.coords.y1 = d.top;
        this.coords.x2 = d.left + d.width;
        this.coords.y2 = d.top + d.height;
        this.coords.cx = d.left + (d.width / 2);
        this.coords.cy = d.top + (d.height / 2);
        this.coords.width  = d.width;
        this.coords.height = d.height;
        this.coords.el  = el || false ;

        return this;
    };


    fn.update = function(data){
        if (!data && !this.el) {
            return this;
        }

        if (data) {
            var new_data = $.extend({}, this.data, data);
            this.data = new_data;
            return this.set(true, true);
        }

        this.set(true);
        return this;
    };


    fn.get = function(){
        return this.coords;
    };


    //jQuery adapter
    $.fn.coords = function() {
        if (this.data('coords') ) {
            return this.data('coords');
        }

        var ins = new Coords(this, arguments[0]);
        this.data('coords', ins);
        return ins;
    };

}(jQuery, window, document));

;(function($, window, document, undefined){

    var defaults = {
        colliders_context: document.body
        // ,on_overlap: function(collider_data){},
        // on_overlap_start : function(collider_data){},
        // on_overlap_stop : function(collider_data){}
    };


    /**
    * Detects collisions between a DOM element against other DOM elements or
    * Coords objects.
    *
    * @class Collision
    * @uses Coords
    * @param {HTMLElement} el The jQuery wrapped HTMLElement.
    * @param {HTMLElement|Array} colliders Can be a jQuery collection
    *  of HTMLElements or an Array of Coords instances.
    * @param {Object} [options] An Object with all options you want to
    *        overwrite:
    *   @param {Function} [options.on_overlap_start] Executes a function the first
    *    time each `collider ` is overlapped.
    *   @param {Function} [options.on_overlap_stop] Executes a function when a
    *    `collider` is no longer collided.
    *   @param {Function} [options.on_overlap] Executes a function when the
    * mouse is moved during the collision.
    * @return {Object} Collision instance.
    * @constructor
    */
    function Collision(el, colliders, options) {
        this.options = $.extend(defaults, options);
        this.$element = el;
        this.last_colliders = [];
        this.last_colliders_coords = [];
        if (typeof colliders === 'string' || colliders instanceof jQuery) {
            this.$colliders = $(colliders,
                 this.options.colliders_context).not(this.$element);
        }else{
            this.colliders = $(colliders);
        }

        this.init();
    }


    var fn = Collision.prototype;


    fn.init = function() {
        this.find_collisions();
    };


    fn.overlaps = function(a, b) {
        var x = false;
        var y = false;

        if ((b.x1 >= a.x1 && b.x1 <= a.x2) ||
            (b.x2 >= a.x1 && b.x2 <= a.x2) ||
            (a.x1 >= b.x1 && a.x2 <= b.x2)
        ) { x = true; }

        if ((b.y1 >= a.y1 && b.y1 <= a.y2) ||
            (b.y2 >= a.y1 && b.y2 <= a.y2) ||
            (a.y1 >= b.y1 && a.y2 <= b.y2)
        ) { y = true; }

        return (x && y);
    };


    fn.detect_overlapping_region = function(a, b){
        var regionX = '';
        var regionY = '';

        if (a.y1 > b.cy && a.y1 < b.y2) { regionX = 'N'; }
        if (a.y2 > b.y1 && a.y2 < b.cy) { regionX = 'S'; }
        if (a.x1 > b.cx && a.x1 < b.x2) { regionY = 'W'; }
        if (a.x2 > b.x1 && a.x2 < b.cx) { regionY = 'E'; }

        return (regionX + regionY) || 'C';
    };


    fn.calculate_overlapped_area_coords = function(a, b){
        var x1 = Math.max(a.x1, b.x1);
        var y1 = Math.max(a.y1, b.y1);
        var x2 = Math.min(a.x2, b.x2);
        var y2 = Math.min(a.y2, b.y2);

        return $({
            left: x1,
            top: y1,
             width : (x2 - x1),
            height: (y2 - y1)
          }).coords().get();
    };


    fn.calculate_overlapped_area = function(coords){
        return (coords.width * coords.height);
    };


    fn.manage_colliders_start_stop = function(new_colliders_coords, start_callback, stop_callback){
        var last = this.last_colliders_coords;

        for (var i = 0, il = last.length; i < il; i++) {
            if ($.inArray(last[i], new_colliders_coords) === -1) {
                start_callback.call(this, last[i]);
            }
        }

        for (var j = 0, jl = new_colliders_coords.length; j < jl; j++) {
            if ($.inArray(new_colliders_coords[j], last) === -1) {
                stop_callback.call(this, new_colliders_coords[j]);
            }

        }
    };


    fn.find_collisions = function(player_data_coords){
        var self = this;
        var colliders_coords = [];
        var colliders_data = [];
        var $colliders = (this.colliders || this.$colliders);
        var count = $colliders.length;
        var player_coords = self.$element.coords()
                             .update(player_data_coords || false).get();

        while(count--){
          var $collider = self.$colliders ?
                           $($colliders[count]) : $colliders[count];
          var $collider_coords_ins = ($collider.isCoords) ?
                  $collider : $collider.coords();
          var collider_coords = $collider_coords_ins.get();
          var overlaps = self.overlaps(player_coords, collider_coords);

          if (!overlaps) {
            continue;
          }

          var region = self.detect_overlapping_region(
              player_coords, collider_coords);

            //todo: make this an option
            if (region === 'C'){
                var area_coords = self.calculate_overlapped_area_coords(
                    player_coords, collider_coords);
                var area = self.calculate_overlapped_area(area_coords);
                var collider_data = {
                    area: area,
                    area_coords : area_coords,
                    region: region,
                    coords: collider_coords,
                    player_coords: player_coords,
                    el: $collider
                };

                if (self.options.on_overlap) {
                    self.options.on_overlap.call(this, collider_data);
                }
                colliders_coords.push($collider_coords_ins);
                colliders_data.push(collider_data);
            }
        }

        if (self.options.on_overlap_stop || self.options.on_overlap_start) {
            this.manage_colliders_start_stop(colliders_coords,
                self.options.on_overlap_start, self.options.on_overlap_stop);
        }

        this.last_colliders_coords = colliders_coords;

        return colliders_data;
    };


    fn.get_closest_colliders = function(player_data_coords){
        var colliders = this.find_collisions(player_data_coords);

        colliders.sort(function(a, b) {
            /* if colliders are being overlapped by the "C" (center) region,
             * we have to set a lower index in the array to which they are placed
             * above in the grid. */
            if (a.region === 'C' && b.region === 'C') {
                if (a.coords.y1 < b.coords.y1 || a.coords.x1 < b.coords.x1) {
                    return - 1;
                }else{
                    return 1;
                }
            }

            if (a.area < b.area) {
                return 1;
            }

            return 1;
        });
        return colliders;
    };


    //jQuery adapter
    $.fn.collision = function(collider, options) {
          return new Collision( this, collider, options );
    };


}(jQuery, window, document));

;(function(window, undefined) {


    window.delay = function(func, wait) {
        var args = Array.prototype.slice.call(arguments, 2);
        return setTimeout(function(){ return func.apply(null, args); }, wait);
    };


    /* Debounce and throttle functions taken from underscore.js */
    window.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
          var context = this, args = arguments;
          var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
          };
          if (immediate && !timeout) func.apply(context, args);
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
    };


    window.throttle = function(func, wait) {
        var context, args, timeout, throttling, more, result;
        var whenDone = debounce(
            function(){ more = throttling = false; }, wait);
        return function() {
          context = this; args = arguments;
          var later = function() {
            timeout = null;
            if (more) func.apply(context, args);
            whenDone();
          };
          if (!timeout) timeout = setTimeout(later, wait);
          if (throttling) {
            more = true;
          } else {
            result = func.apply(context, args);
          }
          whenDone();
          throttling = true;
          return result;
        };
    };

})(window);

;(function($, window, document, undefined) {

    var defaults = {
        items: 'li',
        distance: 1,
        limit: true,
        offset_left: 0,
        // HACK: don't use autoscroll on drag
        autoscroll: false,
        ignore_dragging: ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'],
        handle: null,
        container_width: 0,  // 0 == auto
        move_element: true,
        helper: false  // or 'clone'
        // drag: function(e) {},
        // start : function(e, ui) {},
        // stop : function(e) {}
    };

    var $window = $(window);
    var isTouch = !!('ontouchstart' in window);
    var pointer_events = {
        start: 'touchstart.gridster-draggable mousedown.gridster-draggable',
        move: 'touchmove.gridster-draggable mousemove.gridster-draggable',
        end: 'touchend.gridster-draggable mouseup.gridster-draggable'
    };

    /**
    * Basic drag implementation for DOM elements inside a container.
    * Provide start/stop/drag callbacks.
    *
    * @class Draggable
    * @param {HTMLElement} el The HTMLelement that contains all the widgets
    *  to be dragged.
    * @param {Object} [options] An Object with all options you want to
    *        overwrite:
    *    @param {HTMLElement|String} [options.items] Define who will
    *     be the draggable items. Can be a CSS Selector String or a
    *     collection of HTMLElements.
    *    @param {Number} [options.distance] Distance in pixels after mousedown
    *     the mouse must move before dragging should start.
    *    @param {Boolean} [options.limit] Constrains dragging to the width of
    *     the container
    *    @param {offset_left} [options.offset_left] Offset added to the item
    *     that is being dragged.
    *    @param {Number} [options.drag] Executes a callback when the mouse is
    *     moved during the dragging.
    *    @param {Number} [options.start] Executes a callback when the drag
    *     starts.
    *    @param {Number} [options.stop] Executes a callback when the drag stops.
    * @return {Object} Returns `el`.
    * @constructor
    */
    function Draggable(el, options) {
      this.options = $.extend({}, defaults, options);
      this.$body = $(document.body);
      this.$container = $(el);
      this.$dragitems = $(this.options.items, this.$container);
      this.is_dragging = false;
      this.player_min_left = 0 + this.options.offset_left;
      this.init();
    }

    var fn = Draggable.prototype;

    fn.init = function() {
        this.calculate_positions();
        this.$container.css('position', 'relative');
        this.disabled = false;
        this.events();

        $(window).bind('resize.gridster-draggable',
            throttle($.proxy(this.calculate_positions, this), 200));
    };

    fn.events = function() {
        this.$container.on('selectstart.gridster-draggable',
            $.proxy(this.on_select_start, this));

        this.$container.on(pointer_events.start, this.options.items,
            $.proxy(this.drag_handler, this));

        this.$body.on(pointer_events.end, $.proxy(function(e) {
            this.is_dragging = false;
            if (this.disabled) { return; }
            this.$body.off(pointer_events.move);
            if (this.drag_start) {
                this.on_dragstop(e);
            }
        }, this));
    };

    fn.get_actual_pos = function($el) {
        var pos = $el.position();
        return pos;
    };


    fn.get_mouse_pos = function(e) {
        if (e.originalEvent && e.originalEvent.touches) {
            var oe = e.originalEvent;
            e = oe.touches.length ? oe.touches[0] : oe.changedTouches[0];
        }

        return {
            left: e.clientX,
            top: e.clientY
        };
    };


    fn.get_offset = function(e) {
        e.preventDefault();
        var mouse_actual_pos = this.get_mouse_pos(e);
        var diff_x = Math.round(
            mouse_actual_pos.left - this.mouse_init_pos.left);
        var diff_y = Math.round(mouse_actual_pos.top - this.mouse_init_pos.top);

        var left = Math.round(this.el_init_offset.left + diff_x - this.baseX);
        var top = Math.round(
            this.el_init_offset.top + diff_y - this.baseY + this.scrollOffset);

        if (this.options.limit) {
            if (left > this.player_max_left) {
                left = this.player_max_left;
            } else if(left < this.player_min_left) {
                left = this.player_min_left;
            }
        }

        return {
            position: {
                left: left,
                top: top
            },
            pointer: {
                left: mouse_actual_pos.left,
                top: mouse_actual_pos.top,
                diff_left: diff_x,
                diff_top: diff_y + this.scrollOffset
            }
        };
    };


    fn.get_drag_data = function(e) {
        var offset = this.get_offset(e);
        offset.$player = this.$player;
        offset.$helper = this.helper ? this.$helper : this.$player;

        return offset;
    };


    fn.manage_scroll = function(data) {
        /* scroll document */
        var nextScrollTop;
        var scrollTop = $window.scrollTop();
        var min_window_y = scrollTop;
        var max_window_y = min_window_y + this.window_height;

        var mouse_down_zone = max_window_y - 50;
        var mouse_up_zone = min_window_y + 50;

        var abs_mouse_left = data.pointer.left;
        var abs_mouse_top = min_window_y + data.pointer.top;

        var max_player_y = (this.doc_height - this.window_height +
            this.player_height);

        if (abs_mouse_top >= mouse_down_zone) {
            nextScrollTop = scrollTop + 30;
            if (nextScrollTop < max_player_y) {
                $window.scrollTop(nextScrollTop);
                this.scrollOffset = this.scrollOffset + 30;
            }
        }

        if (abs_mouse_top <= mouse_up_zone) {
            nextScrollTop = scrollTop - 30;
            if (nextScrollTop > 0) {
                $window.scrollTop(nextScrollTop);
                this.scrollOffset = this.scrollOffset - 30;
            }
        }
    };


    fn.calculate_positions = function(e) {
        this.window_height = $window.height();
    };


    fn.drag_handler = function(e) {
        var node = e.target.nodeName;
        if (this.disabled || e.which !== 1 && !isTouch) {
            return;
        }

        if (this.ignore_drag(e)) {
            return;
        }

        var self = this;
        var first = true;
        this.$player = $(e.currentTarget);

        this.el_init_pos = this.get_actual_pos(this.$player);
        this.mouse_init_pos = this.get_mouse_pos(e);
        this.offsetY = this.mouse_init_pos.top - this.el_init_pos.top;

        this.$body.on(pointer_events.move, function(mme) {
            var mouse_actual_pos = self.get_mouse_pos(mme);
            var diff_x = Math.abs(
                mouse_actual_pos.left - self.mouse_init_pos.left);
            var diff_y = Math.abs(
                mouse_actual_pos.top - self.mouse_init_pos.top);
            if (!(diff_x > self.options.distance ||
                diff_y > self.options.distance)
                ) {
                return false;
            }

            if (first) {
                first = false;
                self.on_dragstart.call(self, mme);
                return false;
            }

            if (self.is_dragging === true) {
                self.on_dragmove.call(self, mme);
            }

            return false;
        });

        if (!isTouch) { return false; }
    };


    fn.on_dragstart = function(e) {
        e.preventDefault();

        if (this.is_dragging) { return this; }

        this.drag_start = this.is_dragging = true;
        var offset = this.$container.offset();
        this.baseX = Math.round(offset.left);
        this.baseY = Math.round(offset.top);
        this.doc_height = $(document).height();

        if (this.options.helper === 'clone') {
            this.$helper = this.$player.clone()
                .appendTo(this.$container).addClass('helper');
            this.helper = true;
        } else {
            this.helper = false;
        }

        this.scrollOffset = 0;
        this.el_init_offset = this.$player.offset();
        this.player_width = this.$player.width();
        this.player_height = this.$player.height();

        var container_width = this.options.container_width || this.$container.width();
        this.player_max_left = (container_width - this.player_width +
            this.options.offset_left);

        if (this.options.start) {
            this.options.start.call(this.$player, e, this.get_drag_data(e));
        }
        return false;
    };


    fn.on_dragmove = function(e) {
        var data = this.get_drag_data(e);

        this.options.autoscroll && this.manage_scroll(data);

        if (this.options.move_element) {
            (this.helper ? this.$helper : this.$player).css({
                'position': 'absolute',
                'left' : data.position.left,
                'top' : data.position.top
            });
        }

        var last_position = this.last_position || data.position;
        data.prev_position = last_position;

        if (this.options.drag) {
            this.options.drag.call(this.$player, e, data);
        }

        this.last_position = data.position;
        return false;
    };


    fn.on_dragstop = function(e) {
        var data = this.get_drag_data(e);
        this.drag_start = false;

        // HACK
        if (data.position.top > this.window_height - this.player_height - 1) {
          data.position.top = this.window_height - this.player_height - 1;
        }

        if (this.options.stop) {
            this.options.stop.call(this.$player, e, data);
        }

        if (this.helper) {
            this.$helper.remove();
        }

        return false;
    };

    fn.on_select_start = function(e) {
        if (this.disabled) { return; }

        if (this.ignore_drag(e)) {
            return;
        }

        return false;
    };

    fn.enable = function() {
        this.disabled = false;
    };

    fn.disable = function() {
        this.disabled = true;
    };

    fn.destroy = function() {
        this.disable();

        this.$container.off('.gridster-draggable');
        this.$body.off('.gridster-draggable');
        $(window).off('.gridster-draggable');

        $.removeData(this.$container, 'drag');
    };

    fn.ignore_drag = function(event) {
        if (this.options.handle) {
            return !$(event.target).is(this.options.handle);
        }

        return $(event.target).is(this.options.ignore_dragging.join(', '));
    };

    //jQuery adapter
    $.fn.drag = function ( options ) {
        return new Draggable(this, options);
    };


}(jQuery, window, document));

;(function($, window, document, undefined) {

    var defaults = {
        namespace: '',
        widget_selector: 'li',
        widget_margins: [10, 10],
        widget_base_dimensions: [400, 225],
        extra_rows: 0,
        extra_cols: 0,
        min_cols: 1,
        max_cols: null,
        min_rows: 15,
        max_size_x: false,
        autogenerate_stylesheet: true,
        // HACK
        fade_speed: 0,
        avoid_overlapped_widgets: true,
        serialize_params: function($w, wgd) {
            return {
                col: wgd.col,
                row: wgd.row,
                size_x: wgd.size_x,
                size_y: wgd.size_y
            };
        },
        collision: {},
        draggable: {
            items: '.gs-w',
            distance: 4
        },
        resize: {
            enabled: false,
            axes: ['x', 'y', 'both'],
            handle_append_to: '',
            handle_class: 'gs-resize-handle',
            max_size: [Infinity, Infinity]
        }
    };

    /**
    * @class Gridster
    * @uses Draggable
    * @uses Collision
    * @param {HTMLElement} el The HTMLelement that contains all the widgets.
    * @param {Object} [options] An Object with all options you want to
    *        overwrite:
    *    @param {HTMLElement|String} [options.widget_selector] Define who will
    *     be the draggable widgets. Can be a CSS Selector String or a
    *     collection of HTMLElements
    *    @param {Array} [options.widget_margins] Margin between widgets.
    *     The first index for the horizontal margin (left, right) and
    *     the second for the vertical margin (top, bottom).
    *    @param {Array} [options.widget_base_dimensions] Base widget dimensions
    *     in pixels. The first index for the width and the second for the
    *     height.
    *    @param {Number} [options.extra_cols] Add more columns in addition to
    *     those that have been calculated.
    *    @param {Number} [options.extra_rows] Add more rows in addition to
    *     those that have been calculated.
    *    @param {Number} [options.min_cols] The minimum required columns.
    *    @param {Number} [options.max_cols] The maximum columns possible (set to null
    *     for no maximum).
    *    @param {Number} [options.min_rows] The minimum required rows.
    *    @param {Number} [options.max_size_x] The maximum number of columns
    *     that a widget can span.
    *    @param {Boolean} [options.autogenerate_stylesheet] If true, all the
    *     CSS required to position all widgets in their respective columns
    *     and rows will be generated automatically and injected to the
    *     `<head>` of the document. You can set this to false, and write
    *     your own CSS targeting rows and cols via data-attributes like so:
    *     `[data-col="1"] { left: 10px; }`
    *    @param {Boolean} [options.avoid_overlapped_widgets] Avoid that widgets loaded
    *     from the DOM can be overlapped. It is helpful if the positions were
    *     bad stored in the database or if there was any conflict.
    *    @param {Function} [options.serialize_params] Return the data you want
    *     for each widget in the serialization. Two arguments are passed:
    *     `$w`: the jQuery wrapped HTMLElement, and `wgd`: the grid
    *     coords object (`col`, `row`, `size_x`, `size_y`).
    *    @param {Object} [options.collision] An Object with all options for
    *     Collision class you want to overwrite. See Collision docs for
    *     more info.
    *    @param {Object} [options.draggable] An Object with all options for
    *     Draggable class you want to overwrite. See Draggable docs for more
    *     info.
    *       @param {Object} [options.resize] An Object with resize config
    *        options.
    *       @param {Boolean} [options.resize.enabled] Set to true to enable
    *        resizing.
    *       @param {Array} [options.resize.axes] Axes in which widgets can be
    *        resized. Possible values: ['x', 'y', 'both'].
    *       @param {String} [options.resize.handle_append_to] Set a valid CSS
    *        selector to append resize handles to.
    *       @param {String} [options.resize.handle_class] CSS class name used
    *        by resize handles.
    *       @param {Array} [options.resize.max_size] Limit widget dimensions
    *        when resizing. Array values should be integers:
    *        `[max_cols_occupied, max_rows_occupied]`
    *       @param {Function} [options.resize.start] Function executed
    *        when resizing starts.
    *       @param {Function} [otions.resize.resize] Function executed
    *        during the resizing.
    *       @param {Function} [options.resize.stop] Function executed
    *        when resizing stops.
    *
    * @constructor
    */
    function Gridster(el, options) {
        this.options = $.extend(true, defaults, options);
        this.$el = $(el);
        this.$wrapper = this.$el.parent();
        this.$widgets = this.$el.children(
            this.options.widget_selector).addClass('gs-w');
        this.widgets = [];
        this.$changed = $([]);
        this.wrapper_width = this.$wrapper.width();
        this.min_widget_width = (this.options.widget_margins[0] * 2) +
          this.options.widget_base_dimensions[0];
        this.min_widget_height = (this.options.widget_margins[1] * 2) +
          this.options.widget_base_dimensions[1];

        this.$style_tags = $([]);

        this.init();
    }

    Gridster.generated_stylesheets = [];

    var fn = Gridster.prototype;

    fn.init = function() {
        this.options.resize.enabled && this.setup_resize();
        this.generate_grid_and_stylesheet();
        this.get_widgets_from_DOM();
        this.set_dom_grid_height();
        this.$wrapper.addClass('ready');
        this.draggable();
        this.options.resize.enabled && this.resizable();

        $(window).bind('resize.gridster', throttle(
            $.proxy(this.recalculate_faux_grid, this), 200));
    };


    /**
    * Disables dragging.
    *
    * @method disable
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.disable = function() {
        this.$wrapper.find('.player-revert').removeClass('player-revert');
        this.drag_api.disable();
        return this;
    };


    /**
    * Enables dragging.
    *
    * @method enable
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.enable = function() {
        this.drag_api.enable();
        return this;
    };



    /**
    * Disables drag-and-drop widget resizing.
    *
    * @method disable
    * @return {Class} Returns instance of gridster Class.
    */
    fn.disable_resize = function() {
        this.$el.addClass('gs-resize-disabled');
        this.resize_api.disable();
        return this;
    };


    /**
    * Enables drag-and-drop widget resizing.
    *
    * @method enable
    * @return {Class} Returns instance of gridster Class.
    */
    fn.enable_resize = function() {
        this.$el.removeClass('gs-resize-disabled');
        this.resize_api.enable();
        return this;
    };


    /**
    * Add a new widget to the grid.
    *
    * @method add_widget
    * @param {String|HTMLElement} html The string representing the HTML of the widget
    *  or the HTMLElement.
    * @param {Number} [size_x] The nº of rows the widget occupies horizontally.
    * @param {Number} [size_y] The nº of columns the widget occupies vertically.
    * @param {Number} [col] The column the widget should start in.
    * @param {Number} [row] The row the widget should start in.
    * @param {Array} [max_size] max_size Maximun size (in units) for width and height.
    * @return {HTMLElement} Returns the jQuery wrapped HTMLElement representing.
    *  the widget that was just created.
    */
    fn.add_widget = function(html, size_x, size_y, col, row, max_size, controls, fade_speed) {
        var pos;
        size_x || (size_x = 1);
        size_y || (size_y = 1);

        if (!col & !row) {
            pos = this.next_position(size_x, size_y);
        }else{
            pos = {
                col: col,
                row: row
            };
            // HACK
            // this.empty_cells(col, row, size_x, size_y);
        }

        var $w = $(html).attr({
                'data-col': pos.col,
                'data-row': pos.row,
                'data-sizex' : size_x,
                'data-sizey' : size_y
            }).addClass('gs-w').appendTo(this.$el).hide();

        this.$widgets = this.$widgets.add($w);

        this.register_widget($w, controls);

        this.add_faux_rows(pos.size_y);
        //this.add_faux_cols(pos.size_x);

        if (max_size) {
            this.set_widget_max_size($w, max_size);
        }

        this.set_dom_grid_height();

        // HACK
        return $w.fadeIn( fade_speed || this.options.fade_speed );
    };


    /**
    * Change widget size limits.
    *
    * @method set_widget_max_size
    * @param {HTMLElement|Number} $widget The jQuery wrapped HTMLElement
    *  representing the widget or an index representing the desired widget.
    * @param {Array} max_size Maximun size (in units) for width and height.
    * @return {HTMLElement} Returns instance of gridster Class.
    */
    fn.set_widget_max_size = function($widget, max_size) {
        $widget = typeof $widget === 'number' ?
            this.$widgets.eq($widget) : $widget;

        if (!$widget.length) { return this; }

        var wgd = $widget.data('coords').grid;
        wgd.max_size_x = max_size[0];
        wgd.max_size_y = max_size[1];

        return this;
    };


    /**
    * Append the resize handle into a widget.
    *
    * @method add_resize_handle
    * @param {HTMLElement} $widget The jQuery wrapped HTMLElement
    *  representing the widget.
    * @return {HTMLElement} Returns instance of gridster Class.
    */
    fn.add_resize_handle = function($w) {
        var append_to = this.options.resize.handle_append_to;
        $(this.resize_handle_tpl).appendTo( append_to ? $(append_to, $w) : $w);

        return this;
    };

    /**
     * Add custom controls to the widget
     * @param {HTMLElement} $w $widget The jQuery wrapped HTMLElement
     * @param {array} controls array of string names of needed controls
     * @return {HTMLElement} Returns instance of gridster Class.
     */
    fn.add_controls = function($w, controls) {
    		if (typeof controls === 'object' && !$.isArray(controls)) {
    			// Convert object to array
    			controls = $.map(controls, function(value, index) {
						return [value];
					});
    		}

        var
            i,
            controlsLength = $.isArray(controls) && controls.length;

        for (i = 0; i < controlsLength; i++) {
            $('<span class="gs-' + controls[i] + '"></span>').appendTo($w);
        }

        return this;
    }

    /**
    * Change the size of a widget. Width is limited to the current grid width.
    *
    * @method resize_widget
    * @param {HTMLElement} $widget The jQuery wrapped HTMLElement
    *  representing the widget.
    * @param {Number} size_x The number of columns that will occupy the widget.
    * @param {Number} size_y The number of rows that will occupy the widget.
    * @param {Boolean} [reposition] Set to false to not move the widget to
    *  the left if there is insufficient space on the right.
    *  By default <code>size_x</code> is limited to the space available from
    *  the column where the widget begins, until the last column to the right.
    * @param {Function} [callback] Function executed when the widget is removed.
    * @return {HTMLElement} Returns $widget.
    */
    fn.resize_widget = function($widget, size_x, size_y, reposition, callback) {
        var wgd = $widget.coords().grid;
        reposition !== false && (reposition = true);
        size_x || (size_x = wgd.size_x);
        size_y || (size_y = wgd.size_y);

        if (size_x > this.cols) {
            size_x = this.cols;
        }

        var old_size_y = wgd.size_y;
        var old_col = wgd.col;
        var new_col = old_col;

        if (reposition && old_col + size_x - 1 > this.cols) {
            var diff = old_col + (size_x - 1) - this.cols;
            var c = old_col - diff;
            new_col = Math.max(1, c);
        }

        if (size_y > old_size_y) {
            this.add_faux_rows(Math.max(size_y - old_size_y, 0));
        }

        var new_grid_data = {
            col: new_col,
            row: wgd.row,
            size_x: size_x,
            size_y: size_y
        };

        this.mutate_widget_in_gridmap($widget, wgd, new_grid_data);

        this.set_dom_grid_height();

        if (callback) {
            callback.call(this, new_grid_data.size_x, new_grid_data.size_y);
        }

        return $widget;
    };


    /**
    * Mutate widget dimensions and position in the grid map.
    *
    * @method mutate_widget_in_gridmap
    * @param {HTMLElement} $widget The jQuery wrapped HTMLElement
    *  representing the widget to mutate.
    * @param {Object} wgd Current widget grid data (col, row, size_x, size_y).
    * @param {Object} new_wgd New widget grid data.
    * @return {HTMLElement} Returns instance of gridster Class.
    */
    fn.mutate_widget_in_gridmap = function($widget, wgd, new_wgd) {
        var old_size_x = wgd.size_x;
        var old_size_y = wgd.size_y;

        var old_cells_occupied = this.get_cells_occupied(wgd);
        var new_cells_occupied = this.get_cells_occupied(new_wgd);

        var empty_cols = [];
        $.each(old_cells_occupied.cols, function(i, col) {
            if ($.inArray(col, new_cells_occupied.cols) === -1) {
                empty_cols.push(col);
            }
        });

        var occupied_cols = [];
        $.each(new_cells_occupied.cols, function(i, col) {
            if ($.inArray(col, old_cells_occupied.cols) === -1) {
                occupied_cols.push(col);
            }
        });

        var empty_rows = [];
        $.each(old_cells_occupied.rows, function(i, row) {
            if ($.inArray(row, new_cells_occupied.rows) === -1) {
                empty_rows.push(row);
            }
        });

        var occupied_rows = [];
        $.each(new_cells_occupied.rows, function(i, row) {
            if ($.inArray(row, old_cells_occupied.rows) === -1) {
                occupied_rows.push(row);
            }
        });

        this.remove_from_gridmap(wgd);

        if (occupied_cols.length) {
            var cols_to_empty = [
                new_wgd.col, new_wgd.row, new_wgd.size_x, Math.min(old_size_y, new_wgd.size_y), $widget
            ];
            this.empty_cells.apply(this, cols_to_empty);
        }

        if (occupied_rows.length) {
            var rows_to_empty = [new_wgd.col, new_wgd.row, new_wgd.size_x, new_wgd.size_y, $widget];
            this.empty_cells.apply(this, rows_to_empty);
        }

        // not the same that wgd = new_wgd;
        wgd.col = new_wgd.col;
        wgd.row = new_wgd.row;
        wgd.size_x = new_wgd.size_x;
        wgd.size_y = new_wgd.size_y;

        this.add_to_gridmap(new_wgd, $widget);

        $widget.removeClass('player-revert');

        //update coords instance attributes
        $widget.data('coords').update({
            width: (new_wgd.size_x * this.options.widget_base_dimensions[0] +
                ((new_wgd.size_x - 1) * this.options.widget_margins[0]) * 2),
            height: (new_wgd.size_y * this.options.widget_base_dimensions[1] +
                ((new_wgd.size_y - 1) * this.options.widget_margins[1]) * 2)
        });

        $widget.attr({
            'data-col': new_wgd.col,
            'data-row': new_wgd.row,
            'data-sizex': new_wgd.size_x,
            'data-sizey': new_wgd.size_y
        });

        if (empty_cols.length) {
            var cols_to_remove_holes = [
                empty_cols[0], new_wgd.row,
                empty_cols.length,
                Math.min(old_size_y, new_wgd.size_y),
                $widget
            ];

            this.remove_empty_cells.apply(this, cols_to_remove_holes);
        }


        // if (empty_rows.length) {
        //     var rows_to_remove_holes = [
        //         new_wgd.col, new_wgd.row, new_wgd.size_x, new_wgd.size_y, $widget
        //     ];
        //     this.remove_empty_cells.apply(this, rows_to_remove_holes);
        // }

        // //this.move_widget_up($widget);

        return this;
    };


    /**
    * Move down widgets in cells represented by the arguments col, row, size_x,
    * size_y
    *
    * @method empty_cells
    * @param {Number} col The column where the group of cells begin.
    * @param {Number} row The row where the group of cells begin.
    * @param {Number} size_x The number of columns that the group of cells
    * occupy.
    * @param {Number} size_y The number of rows that the group of cells
    * occupy.
    * @param {HTMLElement} $exclude Exclude widgets from being moved.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.empty_cells = function(col, row, size_x, size_y, $exclude) {
        var $nexts = this.widgets_below({
                col: col,
                row: row - size_y,
                size_x: size_x,
                size_y: size_y
            });

        $nexts.not($exclude).each($.proxy(function(i, w) {
            var wgd = $(w).coords().grid;
            if (!(wgd.row <= (row + size_y - 1))) { return; }
            var diff =  (row + size_y) - wgd.row;
            this.move_widget_down($(w), diff);
        }, this));

        this.set_dom_grid_height();

        return this;
    };


    /**
    * Move up widgets below cells represented by the arguments col, row, size_x,
    * size_y.
    *
    * @method remove_empty_cells
    * @param {Number} col The column where the group of cells begin.
    * @param {Number} row The row where the group of cells begin.
    * @param {Number} size_x The number of columns that the group of cells
    * occupy.
    * @param {Number} size_y The number of rows that the group of cells
    * occupy.
    * @param {HTMLElement} exclude Exclude widgets from being moved.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.remove_empty_cells = function(col, row, size_x, size_y, exclude) {
        var $nexts = this.widgets_below({
            col: col,
            row: row,
            size_x: size_x,
            size_y: size_y
        });

        $nexts.not(exclude).each($.proxy(function(i, widget) {
            this.move_widget_up( $(widget), size_y );
        }, this));

        this.set_dom_grid_height();

        return this;
    };


    /**
    * Get the most left column below to add a new widget.
    *
    * @method next_position
    * @param {Number} size_x The nº of rows the widget occupies horizontally.
    * @param {Number} size_y The nº of columns the widget occupies vertically.
    * @return {Object} Returns a grid coords object representing the future
    *  widget coords.
    */
    fn.next_position = function(size_x, size_y) {
        size_x || (size_x = 1);
        size_y || (size_y = 1);
        var ga = this.gridmap;
        var cols_l = ga.length;
        var valid_pos = [];
        var rows_l;

        for (var c = 1; c < cols_l; c++) {
            rows_l = ga[c].length;
            for (var r = 1; r <= rows_l; r++) {
                var can_move_to = this.can_move_to({
                    size_x: size_x,
                    size_y: size_y
                }, c, r);

                if (can_move_to) {
                    valid_pos.push({
                        col: c,
                        row: r,
                        size_y: size_y,
                        size_x: size_x
                    });
                }
            }
        }

        if (valid_pos.length) {
            return this.sort_by_row_and_col_asc(valid_pos)[0];
        }
        return false;
    };


    /**
    * Remove a widget from the grid.
    *
    * @method remove_widget
    * @param {HTMLElement} el The jQuery wrapped HTMLElement you want to remove.
    * @param {Boolean|Function} silent If true, widgets below the removed one
    * will not move up. If a Function is passed it will be used as callback.
    * @param {Function} callback Function executed when the widget is removed.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.remove_widget = function(el, silent, callback) {
        var $el = el instanceof jQuery ? el : $(el);
        var wgd = $el.coords().grid;

        // if silent is a function assume it's a callback
        if ($.isFunction(silent)) {
            callback = silent;
            silent = false;
        }

        this.cells_occupied_by_placeholder = {};
        this.$widgets = this.$widgets.not($el);

        var $nexts = this.widgets_below($el);

        this.remove_from_gridmap(wgd);

        // HACK
        $el.fadeOut(this.options.fade_speed, $.proxy(function() {
            // debugger;
            $el.remove();

            if (!silent) {
                $nexts.each($.proxy(function(i, widget) {
                    this.move_widget_up( $(widget), wgd.size_y );
                }, this));
            }

            this.set_dom_grid_height();

            if (callback) {
                callback.call(this, el);
            }
        }, this));

        return this;
    };


    /**
    * Remove all widgets from the grid.
    *
    * @method remove_all_widgets
    * @param {Function} callback Function executed for each widget removed.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.remove_all_widgets = function(callback) {
        this.$widgets.each($.proxy(function(i, el){
              this.remove_widget(el, true, callback);
        }, this));

        return this;
    };


    /**
    * Returns a serialized array of the widgets in the grid.
    *
    * @method serialize
    * @param {HTMLElement} [$widgets] The collection of jQuery wrapped
    *  HTMLElements you want to serialize. If no argument is passed all widgets
    *  will be serialized.
    * @return {Array} Returns an Array of Objects with the data specified in
    *  the serialize_params option.
    */
    fn.serialize = function($widgets) {
        $widgets || ($widgets = this.$widgets);
        var result = [];
        $widgets.each($.proxy(function(i, widget) {
            result.push(this.options.serialize_params(
                $(widget), $(widget).coords().grid ) );
        }, this));

        return result;
    };


    /**
    * Returns a serialized array of the widgets that have changed their
    *  position.
    *
    * @method serialize_changed
    * @return {Array} Returns an Array of Objects with the data specified in
    *  the serialize_params option.
    */
    fn.serialize_changed = function() {
        return this.serialize(this.$changed);
    };


    /**
    * Creates the grid coords object representing the widget a add it to the
    * mapped array of positions.
    *
    * @method register_widget
    * @return {Array} Returns the instance of the Gridster class.
    */
    fn.register_widget = function($el, controls) {
        var
            wgd = {
                'col': parseInt($el.attr('data-col'), 10),
                'row': parseInt($el.attr('data-row'), 10),
                'size_x': parseInt($el.attr('data-sizex'), 10),
                'size_y': parseInt($el.attr('data-sizey'), 10),
                'max_size_x': parseInt($el.attr('data-max-sizex'), 10) || false,
                'max_size_y': parseInt($el.attr('data-max-sizey'), 10) || false,
                'el': $el
            };

        if (this.options.avoid_overlapped_widgets &&
            !this.can_move_to(
             {size_x: wgd.size_x, size_y: wgd.size_y}, wgd.col, wgd.row)
        ) {
            $.extend(wgd, this.next_position(wgd.size_x, wgd.size_y));
            $el.attr({
                'data-col': wgd.col,
                'data-row': wgd.row,
                'data-sizex': wgd.size_x,
                'data-sizey': wgd.size_y
            });
        }

        // attach Coord object to player data-coord attribute
        $el.data('coords', $el.coords());
        // Extend Coord object with grid position info
        $el.data('coords').grid = wgd;

        this.add_to_gridmap(wgd, $el);

        this.options.resize.enabled && this.add_resize_handle($el);

        this.add_controls($el, controls);

        return this;
    };


    /**
    * Update in the mapped array of positions the value of cells represented by
    * the grid coords object passed in the `grid_data` param.
    *
    * @param {Object} grid_data The grid coords object representing the cells
    *  to update in the mapped array.
    * @param {HTMLElement|Boolean} value Pass `false` or the jQuery wrapped
    *  HTMLElement, depends if you want to delete an existing position or add
    *  a new one.
    * @method update_widget_position
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.update_widget_position = function(grid_data, value) {
        this.for_each_cell_occupied(grid_data, function(col, row) {
            if (!this.gridmap[col]) { return this; }
            this.gridmap[col][row] = value;
        });
        return this;
    };


    /**
    * Remove a widget from the mapped array of positions.
    *
    * @method remove_from_gridmap
    * @param {Object} grid_data The grid coords object representing the cells
    *  to update in the mapped array.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.remove_from_gridmap = function(grid_data) {
        return this.update_widget_position(grid_data, false);
    };


    /**
    * Add a widget to the mapped array of positions.
    *
    * @method add_to_gridmap
    * @param {Object} grid_data The grid coords object representing the cells
    *  to update in the mapped array.
    * @param {HTMLElement|Boolean} value The value to set in the specified
    *  position .
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.add_to_gridmap = function(grid_data, value) {
        this.update_widget_position(grid_data, value || grid_data.el);

        if (grid_data.el) {
            var $widgets = this.widgets_below(grid_data.el);
            $widgets.each($.proxy(function(i, widget) {
                this.move_widget_up( $(widget));
            }, this));
        }
    };


    /**
    * Make widgets draggable.
    *
    * @uses Draggable
    * @method draggable
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.draggable = function() {
        var self = this;
        var draggable_options = $.extend(true, {}, this.options.draggable, {
            offset_left: this.options.widget_margins[0],
            container_width: this.container_width,
            ignore_dragging: ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON',
                '.' + this.options.resize.handle_class],
            start: function(event, ui) {
                self.$widgets.filter('.player-revert')
                    .removeClass('player-revert');

                self.$player = $(this);
                self.$helper = $(ui.$helper);

                self.helper = !self.$helper.is(self.$player);

                self.on_start_drag.call(self, event, ui);
                self.$el.trigger('gridster:dragstart');
            },
            stop: function(event, ui) {
                self.on_stop_drag.call(self, event, ui);
                self.$el.trigger('gridster:dragstop');
            },
            drag: throttle(function(event, ui) {
                self.on_drag.call(self, event, ui);
                self.$el.trigger('gridster:drag');
            }, 150)
          });

        this.drag_api = this.$el.drag(draggable_options);
        return this;
    };


    /**
    * Bind resize events to get resize working.
    *
    * @method resizable
    * @return {Class} Returns instance of gridster Class.
    */
    fn.resizable = function() {
        this.resize_api = this.$el.drag({
            items: '.' + this.options.resize.handle_class,
            offset_left: this.options.widget_margins[0],
            container_width: this.container_width,
            move_element: false,
            start: $.proxy(this.on_start_resize, this),
            stop: $.proxy(function(event, ui) {
                delay($.proxy(function() {
                    this.on_stop_resize(event, ui);
                }, this), 120);
            }, this),
            drag: throttle($.proxy(this.on_resize, this), 60)
        });

        return this;
    };


    /**
    * Setup things required for resizing. Like build templates for drag handles.
    *
    * @method setup_resize
    * @return {Class} Returns instance of gridster Class.
    */
    fn.setup_resize = function() {
        this.resize_handle_class = this.options.resize.handle_class;
        var axes = this.options.resize.axes;
        var handle_tpl = '<span class="' + this.resize_handle_class + ' ' +
            this.resize_handle_class + '-{type}" />';

        this.resize_handle_tpl = $.map(axes, function(type) {
            return handle_tpl.replace('{type}', type);
        }).join('');
        return this;
    };


    /**
    * This function is executed when the player begins to be dragged.
    *
    * @method on_start_drag
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_start_drag = function(event, ui) {
        this.$helper.add(this.$player).add(this.$wrapper).addClass('dragging');

        this.$player.addClass('player');
        this.player_grid_data = this.$player.coords().grid;
        this.placeholder_grid_data = $.extend({}, this.player_grid_data);

        //set new grid height along the dragging period
        this.$el.css('height', this.$el.height() +
          (this.player_grid_data.size_y * this.min_widget_height));

        var colliders = this.faux_grid;
        var coords = this.$player.data('coords').coords;

        this.cells_occupied_by_player = this.get_cells_occupied(
            this.player_grid_data);
        this.cells_occupied_by_placeholder = this.get_cells_occupied(
            this.placeholder_grid_data);

        this.last_cols = [];
        this.last_rows = [];

        // see jquery.collision.js
        this.collision_api = this.$helper.collision(
            colliders, this.options.collision);

        this.$preview_holder = $('<' + this.$player.get(0).tagName + ' />', {
              'class': 'preview-holder',
              'data-row': this.$player.attr('data-row'),
              'data-col': this.$player.attr('data-col'),
              css: {
                  width: coords.width,
                  height: coords.height
              }
        }).appendTo(this.$el);

        if (this.options.draggable.start) {
          this.options.draggable.start.call(this, event, ui);
        }
    };


    /**
    * This function is executed when the player is being dragged.
    *
    * @method on_drag
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_drag = function(event, ui) {
        //break if dragstop has been fired
        if (this.$player === null) {
            return false;
        }

        var abs_offset = {
            left: ui.position.left + this.baseX,
            top: ui.position.top + this.baseY
        };

/*
        abs_offset.left = abs_offset.left > $(document).width() ? $(document).width() : abs_offset.left;
        abs_offset.left = abs_offset.left < 0 ? 0 : abs_offset.left;

        abs_offset.top = abs_offset.top > $(document).height() ? $(document).height() : abs_offset.top;
        abs_offset.top = abs_offset.top < 0 ? 0 : abs_offset.top;

        console.log(abs_offset.left, abs_offset.top);
*/

        this.colliders_data = this.collision_api.get_closest_colliders(
            abs_offset);

        this.on_overlapped_column_change(
            this.on_start_overlapping_column,
            this.on_stop_overlapping_column
        );

        this.on_overlapped_row_change(
            this.on_start_overlapping_row,
            this.on_stop_overlapping_row
        );

        if (this.helper && this.$player) {
            this.$player.css({
                'left': ui.position.left,
                'top': ui.position.top
            });
        }

        if (this.options.draggable.drag) {
            this.options.draggable.drag.call(this, event, ui);
        }
    };

    /**
    * This function is executed when the player stops being dragged.
    *
    * @method on_stop_drag
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_stop_drag = function(event, ui) {
        this.$helper.add(this.$player).add(this.$wrapper)
            .removeClass('dragging');

        ui.position.left = ui.position.left + this.baseX;
        ui.position.top = ui.position.top + this.baseY;
        this.colliders_data = this.collision_api.get_closest_colliders(
            ui.position);

        this.on_overlapped_column_change(
            this.on_start_overlapping_column,
            this.on_stop_overlapping_column
        );

        this.on_overlapped_row_change(
            this.on_start_overlapping_row,
            this.on_stop_overlapping_row
        );

        this.$player.addClass('player-revert').removeClass('player')
            .attr({
                'data-col': this.placeholder_grid_data.col,
                'data-row': this.placeholder_grid_data.row
            }).css({
                'left': '',
                'top': ''
            });

        this.$changed = this.$changed.add(this.$player);

        this.cells_occupied_by_player = this.get_cells_occupied(
            this.placeholder_grid_data);
        this.set_cells_player_occupies(
            this.placeholder_grid_data.col, this.placeholder_grid_data.row);

        this.$player.coords().grid.row = this.placeholder_grid_data.row;
        this.$player.coords().grid.col = this.placeholder_grid_data.col;

        if (this.options.draggable.stop) {
          this.options.draggable.stop.call(this, event, ui);
        }

        this.$preview_holder.remove();

        this.$player = null;
        this.$helper = null;
        this.placeholder_grid_data = {};
        this.player_grid_data = {};
        this.cells_occupied_by_placeholder = {};
        this.cells_occupied_by_player = {};

        this.set_dom_grid_height();
    };



    /**
    * This function is executed every time a widget starts to be resized.
    *
    * @method on_start_resize
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_start_resize = function(event, ui) {
        this.$resized_widget = ui.$player.closest('.gs-w');
        this.resize_coords = this.$resized_widget.coords();
        this.resize_wgd = this.resize_coords.grid;
        this.resize_initial_width = this.resize_coords.coords.width;
        this.resize_initial_height = this.resize_coords.coords.height;
        this.resize_initial_sizex = this.resize_coords.grid.size_x;
        this.resize_initial_sizey = this.resize_coords.grid.size_y;
        this.resize_last_sizex = this.resize_initial_sizex;
        this.resize_last_sizey = this.resize_initial_sizey;
        this.resize_max_size_x = Math.min(this.resize_wgd.max_size_x ||
            this.options.resize.max_size[0], this.cols - this.resize_wgd.col + 1);
        this.resize_max_size_y = this.resize_wgd.max_size_y ||
            this.options.resize.max_size[1];

        this.resize_dir = {
            right: ui.$player.is('.' + this.resize_handle_class + '-x'),
            bottom: ui.$player.is('.' + this.resize_handle_class + '-y')
        };

        this.$resized_widget.css({
            'min-width': this.options.widget_base_dimensions[0],
            'min-height': this.options.widget_base_dimensions[1]
        });

        var nodeName = this.$resized_widget.get(0).tagName;
        this.$resize_preview_holder = $('<' + nodeName + ' />', {
              'class': 'preview-holder resize-preview-holder',
              'data-row': this.$resized_widget.attr('data-row'),
              'data-col': this.$resized_widget.attr('data-col'),
              'css': {
                  'width': this.resize_initial_width,
                  'height': this.resize_initial_height
              }
        }).appendTo(this.$el);

        this.$resized_widget.addClass('resizing');

		if (this.options.resize.start) {
            this.options.resize.start.call(this, event, ui, this.$resized_widget);
        }
    };


    /**
    * This function is executed every time a widget stops being resized.
    *
    * @method on_stop_resize
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_stop_resize = function(event, ui) {
        this.$resized_widget
            .removeClass('resizing')
            .css({
                'width': '',
                'height': ''
            });

        delay($.proxy(function() {
            this.$resize_preview_holder
                .remove()
                .css({
                    'min-width': '',
                    'min-height': ''
                });
        }, this), 300);

        this.$resized_widget.trigger('gridster.onResizeStop');

        if (this.options.resize.stop) {
            this.options.resize.stop.call(this, event, ui, this.$resized_widget);
        }
    };

    /**
    * This function is executed when a widget is being resized.
    *
    * @method on_resize
    * @param {Event} event The original browser event
    * @param {Object} ui A prepared ui object with useful drag-related data
    */
    fn.on_resize = function(event, ui) {
        var rel_x = (ui.pointer.diff_left);
        var rel_y = (ui.pointer.diff_top);
        var wbd_x = this.options.widget_base_dimensions[0];
        var wbd_y = this.options.widget_base_dimensions[1];
        var max_width = Infinity;
        var max_height = Infinity;

        var inc_units_x = Math.ceil((rel_x /
                (this.options.widget_base_dimensions[0] +
                    this.options.widget_margins[0] * 2)) - 0.2);

        var inc_units_y = Math.ceil((rel_y /
                (this.options.widget_base_dimensions[1] +
                 this.options.widget_margins[1] * 2)) - 0.2);

        var size_x = Math.max(1, this.resize_initial_sizex + inc_units_x);
        var size_y = Math.max(1, this.resize_initial_sizey + inc_units_y);

        size_x = Math.min(size_x, this.resize_max_size_x);
        max_width = (this.resize_max_size_x * wbd_x) +
            ((size_x - 1) * this.options.widget_margins[0] * 2);

        size_y = Math.min(size_y, this.resize_max_size_y);
        max_height = (this.resize_max_size_y * wbd_y) +
            ((size_y - 1) * this.options.widget_margins[1] * 2);


        if (this.resize_dir.right) {
            size_y = this.resize_initial_sizey;
        } else if (this.resize_dir.bottom) {
            size_x = this.resize_initial_sizex;
        }

        var css_props = {};
        !this.resize_dir.bottom && (css_props.width = Math.min(
            this.resize_initial_width + rel_x, max_width));
        !this.resize_dir.right && (css_props.height = Math.min(
            this.resize_initial_height + rel_y, max_height));

        this.$resized_widget.css(css_props);

        if (size_x !== this.resize_last_sizex ||
            size_y !== this.resize_last_sizey) {

            this.resize_widget(this.$resized_widget, size_x, size_y, false);

            this.$resize_preview_holder.css({
                'width': '',
                'height': ''
            }).attr({
                'data-row': this.$resized_widget.attr('data-row'),
                'data-sizex': size_x,
                'data-sizey': size_y
            });
        }

        if (this.options.resize.resize) {
            this.options.resize.resize.call(this, event, ui, this.$resized_widget);
        }

        this.resize_last_sizex = size_x;
        this.resize_last_sizey = size_y;
    };


    /**
    * Executes the callbacks passed as arguments when a column begins to be
    * overlapped or stops being overlapped.
    *
    * @param {Function} start_callback Function executed when a new column
    *  begins to be overlapped. The column is passed as first argument.
    * @param {Function} stop_callback Function executed when a column stops
    *  being overlapped. The column is passed as first argument.
    * @method on_overlapped_column_change
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.on_overlapped_column_change = function(start_callback, stop_callback) {
        if (!this.colliders_data.length) {
            return this;
        }
        var cols = this.get_targeted_columns(
            this.colliders_data[0].el.data.col);

        var last_n_cols = this.last_cols.length;
        var n_cols = cols.length;
        var i;

        for (i = 0; i < n_cols; i++) {
            if ($.inArray(cols[i], this.last_cols) === -1) {
                (start_callback || $.noop).call(this, cols[i]);
            }
        }

        for (i = 0; i< last_n_cols; i++) {
            if ($.inArray(this.last_cols[i], cols) === -1) {
                (stop_callback || $.noop).call(this, this.last_cols[i]);
            }
        }

        this.last_cols = cols;

        return this;
    };


    /**
    * Executes the callbacks passed as arguments when a row starts to be
    * overlapped or stops being overlapped.
    *
    * @param {Function} start_callback Function executed when a new row begins
    *  to be overlapped. The row is passed as first argument.
    * @param {Function} end_callback Function executed when a row stops being
    *  overlapped. The row is passed as first argument.
    * @method on_overlapped_row_change
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.on_overlapped_row_change = function(start_callback, end_callback) {
        if (!this.colliders_data.length) {
            return this;
        }
        var rows = this.get_targeted_rows(this.colliders_data[0].el.data.row);
        var last_n_rows = this.last_rows.length;
        var n_rows = rows.length;
        var i;

        for (i = 0; i < n_rows; i++) {
            if ($.inArray(rows[i], this.last_rows) === -1) {
                (start_callback || $.noop).call(this, rows[i]);
            }
        }

        for (i = 0; i < last_n_rows; i++) {
            if ($.inArray(this.last_rows[i], rows) === -1) {
                (end_callback || $.noop).call(this, this.last_rows[i]);
            }
        }

        this.last_rows = rows;
    };


    /**
    * Sets the current position of the player
    *
    * @param {Number} col
    * @param {Number} row
    * @param {Boolean} no_player
    * @method set_player
    * @return {object}
    */
    fn.set_player = function(col, row, no_player) {
        var self = this;
        if (!no_player) {
            this.empty_cells_player_occupies();
        }
        var cell = !no_player ? self.colliders_data[0].el.data : {col: col};
        var to_col = cell.col;

        // HACK
        // var to_row = row || cell.row;
        var to_row = cell.row;
        // var max_row = Math.floor( $(window).height() / (this.options.widget_base_dimensions[1] + self.min_widget_height) - this.player_grid_data.size_y + 1 );
        // var to_row = cell.row > max_row ? max_row : cell.row;

        this.player_grid_data = {
            col: to_col,
            row: to_row,
            size_y : this.player_grid_data.size_y,
            size_x : this.player_grid_data.size_x
        };

        this.cells_occupied_by_player = this.get_cells_occupied(
            this.player_grid_data);

        var $overlapped_widgets = this.get_widgets_overlapped(
            this.player_grid_data);

        var constraints = this.widgets_constraints($overlapped_widgets);

        this.manage_movements(constraints.can_go_up, to_col, to_row);
        this.manage_movements(constraints.can_not_go_up, to_col, to_row);

        /* if there is not widgets overlapping in the new player position,
         * update the new placeholder position. */
        if (!$overlapped_widgets.length) {
            var pp = this.can_go_player_up(this.player_grid_data);
            if (pp !== false) {
                // HACK
                // to_row = pp;
            }
            this.set_placeholder(to_col, to_row);
        }

        return {
            col: to_col,
            row: to_row
        };
    };


    /**
    * See which of the widgets in the $widgets param collection can go to
    * a upper row and which not.
    *
    * @method widgets_contraints
    * @param {jQuery} $widgets A jQuery wrapped collection of
    * HTMLElements.
    * @return {object} Returns a literal Object with two keys: `can_go_up` &
    * `can_not_go_up`. Each contains a set of HTMLElements.
    */
    fn.widgets_constraints = function($widgets) {
        // HACK: disable movements when drag
        return {
            can_go_up: [],
            can_not_go_up: []
        }

        var $widgets_can_go_up = $([]);
        var $widgets_can_not_go_up;
        var wgd_can_go_up = [];
        var wgd_can_not_go_up = [];

        $widgets.each($.proxy(function(i, w) {
            var $w = $(w);
            var wgd = $w.coords().grid;
            if (this.can_go_widget_up(wgd)) {
                $widgets_can_go_up = $widgets_can_go_up.add($w);
                wgd_can_go_up.push(wgd);
            }else{
                wgd_can_not_go_up.push(wgd);
            }
        }, this));

        $widgets_can_not_go_up = $widgets.not($widgets_can_go_up);

        return {
            can_go_up: this.sort_by_row_asc(wgd_can_go_up),
            can_not_go_up: this.sort_by_row_desc(wgd_can_not_go_up)
        };
    };


    /**
    * Sorts an Array of grid coords objects (representing the grid coords of
    * each widget) in ascending way.
    *
    * @method sort_by_row_asc
    * @param {Array} widgets Array of grid coords objects
    * @return {Array} Returns the array sorted.
    */
    fn.sort_by_row_asc = function(widgets) {
        widgets = widgets.sort(function(a, b) {
            if (!a.row) {
                a = $(a).coords().grid;
                b = $(b).coords().grid;
            }

           if (a.row > b.row) {
               return 1;
           }
           return -1;
        });

        return widgets;
    };


    /**
    * Sorts an Array of grid coords objects (representing the grid coords of
    * each widget) placing first the empty cells upper left.
    *
    * @method sort_by_row_and_col_asc
    * @param {Array} widgets Array of grid coords objects
    * @return {Array} Returns the array sorted.
    */
    fn.sort_by_row_and_col_asc = function(widgets) {
        widgets = widgets.sort(function(a, b) {
           if (a.row > b.row || a.row === b.row && a.col > b.col) {
               return 1;
           }
           return -1;
        });

        return widgets;
    };


    /**
    * Sorts an Array of grid coords objects by column (representing the grid
    * coords of each widget) in ascending way.
    *
    * @method sort_by_col_asc
    * @param {Array} widgets Array of grid coords objects
    * @return {Array} Returns the array sorted.
    */
    fn.sort_by_col_asc = function(widgets) {
        widgets = widgets.sort(function(a, b) {
           if (a.col > b.col) {
               return 1;
           }
           return -1;
        });

        return widgets;
    };


    /**
    * Sorts an Array of grid coords objects (representing the grid coords of
    * each widget) in descending way.
    *
    * @method sort_by_row_desc
    * @param {Array} widgets Array of grid coords objects
    * @return {Array} Returns the array sorted.
    */
    fn.sort_by_row_desc = function(widgets) {
        widgets = widgets.sort(function(a, b) {
            if (a.row + a.size_y < b.row + b.size_y) {
                return 1;
            }
           return -1;
        });
        return widgets;
    };


    /**
    * Sorts an Array of grid coords objects (representing the grid coords of
    * each widget) in descending way.
    *
    * @method manage_movements
    * @param {jQuery} $widgets A jQuery collection of HTMLElements
    *  representing the widgets you want to move.
    * @param {Number} to_col The column to which we want to move the widgets.
    * @param {Number} to_row The row to which we want to move the widgets.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.manage_movements = function($widgets, to_col, to_row) {
        $.each($widgets, $.proxy(function(i, w) {
            var wgd = w;
            var $w = wgd.el;

            var can_go_widget_up = this.can_go_widget_up(wgd);

            if (can_go_widget_up) {
                //target CAN go up
                //so move widget up
                this.move_widget_to($w, can_go_widget_up);
                this.set_placeholder(to_col, can_go_widget_up + wgd.size_y);

            } else {
                //target can't go up
                var can_go_player_up = this.can_go_player_up(
                    this.player_grid_data);

                if (!can_go_player_up) {
                    // target can't go up
                    // player cant't go up
                    // so we need to move widget down to a position that dont
                    // overlaps player
                    var y = (to_row + this.player_grid_data.size_y) - wgd.row;

                    this.move_widget_down($w, y);
                    this.set_placeholder(to_col, to_row);
                }
            }
        }, this));

        return this;
    };

    /**
    * Determines if there is a widget in the row and col given. Or if the
    * HTMLElement passed as first argument is the player.
    *
    * @method is_player
    * @param {Number|HTMLElement} col_or_el A jQuery wrapped collection of
    * HTMLElements.
    * @param {Number} [row] The column to which we want to move the widgets.
    * @return {Boolean} Returns true or false.
    */
    fn.is_player = function(col_or_el, row) {
        if (row && !this.gridmap[col_or_el]) { return false; }
        var $w = row ? this.gridmap[col_or_el][row] : col_or_el;
        return $w && ($w.is(this.$player) || $w.is(this.$helper));
    };


    /**
    * Determines if the widget that is being dragged is currently over the row
    * and col given.
    *
    * @method is_player_in
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_player_in = function(col, row) {
        var c = this.cells_occupied_by_player || {};
        return $.inArray(col, c.cols) >= 0 && $.inArray(row, c.rows) >= 0;
    };


    /**
    * Determines if the placeholder is currently over the row and col given.
    *
    * @method is_placeholder_in
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_placeholder_in = function(col, row) {
        var c = this.cells_occupied_by_placeholder || {};
        return this.is_placeholder_in_col(col) && $.inArray(row, c.rows) >= 0;
    };


    /**
    * Determines if the placeholder is currently over the column given.
    *
    * @method is_placeholder_in_col
    * @param {Number} col The column to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_placeholder_in_col = function(col) {
        var c = this.cells_occupied_by_placeholder || [];
        return $.inArray(col, c.cols) >= 0;
    };


    /**
    * Determines if the cell represented by col and row params is empty.
    *
    * @method is_empty
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_empty = function(col, row) {
        if (typeof this.gridmap[col] !== 'undefined') {
			if(typeof this.gridmap[col][row] !== 'undefined' &&
				 this.gridmap[col][row] === false
			) {
				return true;
			}
			return false;
		}
		return true;
    };


    /**
    * Determines if the cell represented by col and row params is occupied.
    *
    * @method is_occupied
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_occupied = function(col, row) {
        if (!this.gridmap[col]) {
            return false;
        }

        if (this.gridmap[col][row]) {
            return true;
        }
        return false;
    };


    /**
    * Determines if there is a widget in the cell represented by col/row params.
    *
    * @method is_widget
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean|HTMLElement} Returns false if there is no widget,
    * else returns the jQuery HTMLElement
    */
    fn.is_widget = function(col, row) {
        var cell = this.gridmap[col];
        if (!cell) {
            return false;
        }

        cell = cell[row];

        if (cell) {
            return cell;
        }

        return false;
    };


    /**
    * Determines if there is a widget in the cell represented by col/row
    * params and if this is under the widget that is being dragged.
    *
    * @method is_widget_under_player
    * @param {Number} col The column to check.
    * @param {Number} row The row to check.
    * @return {Boolean} Returns true or false.
    */
    fn.is_widget_under_player = function(col, row) {
        if (this.is_widget(col, row)) {
            return this.is_player_in(col, row);
        }
        return false;
    };


    /**
    * Get widgets overlapping with the player or with the object passed
    * representing the grid cells.
    *
    * @method get_widgets_under_player
    * @return {HTMLElement} Returns a jQuery collection of HTMLElements
    */
    fn.get_widgets_under_player = function(cells) {
        cells || (cells = this.cells_occupied_by_player || {cols: [], rows: []});
        var $widgets = $([]);

        $.each(cells.cols, $.proxy(function(i, col) {
            $.each(cells.rows, $.proxy(function(i, row) {
                if(this.is_widget(col, row)) {
                    $widgets = $widgets.add(this.gridmap[col][row]);
                }
            }, this));
        }, this));

        return $widgets;
    };


    /**
    * Put placeholder at the row and column specified.
    *
    * @method set_placeholder
    * @param {Number} col The column to which we want to move the
    *  placeholder.
    * @param {Number} row The row to which we want to move the
    *  placeholder.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.set_placeholder = function(col, row) {
        var phgd = $.extend({}, this.placeholder_grid_data);
        var $nexts = this.widgets_below({
                col: phgd.col,
                row: phgd.row,
                size_y: phgd.size_y,
                size_x: phgd.size_x
            });

        // Prevents widgets go out of the grid
        var right_col = (col + phgd.size_x - 1);
        if (right_col > this.cols) {
            col = col - (right_col - col);
        }

        var moved_down = this.placeholder_grid_data.row < row;
        var changed_column = this.placeholder_grid_data.col !== col;

        this.placeholder_grid_data.col = col;
        this.placeholder_grid_data.row = row;

        this.cells_occupied_by_placeholder = this.get_cells_occupied(
            this.placeholder_grid_data);

        this.$preview_holder.attr({
            'data-row' : row,
            'data-col' : col
        });

        if (moved_down || changed_column) {
            $nexts.each($.proxy(function(i, widget) {
                this.move_widget_up(
                 $(widget), this.placeholder_grid_data.col - col + phgd.size_y);
            }, this));
        }

        var $widgets_under_ph = this.get_widgets_under_player(
            this.cells_occupied_by_placeholder);

        if ($widgets_under_ph.length) {
            $widgets_under_ph.each($.proxy(function(i, widget) {
                var $w = $(widget);
                this.move_widget_down(
                 $w, row + phgd.size_y - $w.data('coords').grid.row);
            }, this));
        }

    };


    /**
    * Determines whether the player can move to a position above.
    *
    * @method can_go_player_up
    * @param {Object} widget_grid_data The actual grid coords object of the
    *  player.
    * @return {Number|Boolean} If the player can be moved to an upper row
    *  returns the row number, else returns false.
    */
    fn.can_go_player_up = function(widget_grid_data) {
        var p_bottom_row = widget_grid_data.row + widget_grid_data.size_y - 1;
        var result = true;
        var upper_rows = [];
        var min_row = 10000;
        var $widgets_under_player = this.get_widgets_under_player();

        /* generate an array with columns as index and array with upper rows
         * empty as value */
        this.for_each_column_occupied(widget_grid_data, function(tcol) {
            var grid_col = this.gridmap[tcol];
            var r = p_bottom_row + 1;
            upper_rows[tcol] = [];

            while (--r > 0) {
                if (this.is_empty(tcol, r) || this.is_player(tcol, r) ||
                    this.is_widget(tcol, r) &&
                    grid_col[r].is($widgets_under_player)
                ) {
                    upper_rows[tcol].push(r);
                    min_row = r < min_row ? r : min_row;
                }else{
                    break;
                }
            }

            if (upper_rows[tcol].length === 0) {
                result = false;
                return true; //break
            }

            upper_rows[tcol].sort(function(a, b) {
                return a - b;
            });
        });

        if (!result) { return false; }

        return this.get_valid_rows(widget_grid_data, upper_rows, min_row);
    };


    /**
    * Determines whether a widget can move to a position above.
    *
    * @method can_go_widget_up
    * @param {Object} widget_grid_data The actual grid coords object of the
    *  widget we want to check.
    * @return {Number|Boolean} If the widget can be moved to an upper row
    *  returns the row number, else returns false.
    */
    fn.can_go_widget_up = function(widget_grid_data) {
        // HACK
        // return false;

        var p_bottom_row = widget_grid_data.row + widget_grid_data.size_y - 1;
        var result = true;
        var upper_rows = [];
        var min_row = 10000;

        /* generate an array with columns as index and array with topmost rows
         * empty as value */
        this.for_each_column_occupied(widget_grid_data, function(tcol) {
            var grid_col = this.gridmap[tcol];
            upper_rows[tcol] = [];

            var r = p_bottom_row + 1;
            // iterate over each row
            while (--r > 0) {
                if (this.is_widget(tcol, r) && !this.is_player_in(tcol, r)) {
                    if (!grid_col[r].is(widget_grid_data.el)) {
                        break;
                    }
                }

                if (!this.is_player(tcol, r) &&
                    !this.is_placeholder_in(tcol, r) &&
                    !this.is_player_in(tcol, r)) {
                    upper_rows[tcol].push(r);
                }

                if (r < min_row) {
                    min_row = r;
                }
            }

            if (upper_rows[tcol].length === 0) {
                result = false;
                return true; //break
            }

            upper_rows[tcol].sort(function(a, b) {
                return a - b;
            });
        });

        if (!result) { return false; }

        return this.get_valid_rows(widget_grid_data, upper_rows, min_row);
    };


    /**
    * Search a valid row for the widget represented by `widget_grid_data' in
    * the `upper_rows` array. Iteration starts from row specified in `min_row`.
    *
    * @method get_valid_rows
    * @param {Object} widget_grid_data The actual grid coords object of the
    *  player.
    * @param {Array} upper_rows An array with columns as index and arrays
    *  of valid rows as values.
    * @param {Number} min_row The upper row from which the iteration will start.
    * @return {Number|Boolean} Returns the upper row valid from the `upper_rows`
    *  for the widget in question.
    */
    fn.get_valid_rows = function(widget_grid_data, upper_rows, min_row) {
        var p_top_row = widget_grid_data.row;
        var p_bottom_row = widget_grid_data.row + widget_grid_data.size_y - 1;
        var size_y = widget_grid_data.size_y;
        var r = min_row - 1;
        var valid_rows = [];

        while (++r <= p_bottom_row ) {
            var common = true;
            $.each(upper_rows, function(col, rows) {
                if ($.isArray(rows) && $.inArray(r, rows) === -1) {
                    common = false;
                }
            });

            if (common === true) {
                valid_rows.push(r);
                if (valid_rows.length === size_y) {
                    break;
                }
            }
        }

        var new_row = false;
        if (size_y === 1) {
            if (valid_rows[0] !== p_top_row) {
                new_row = valid_rows[0] || false;
            }
        }else{
            if (valid_rows[0] !== p_top_row) {
                new_row = this.get_consecutive_numbers_index(
                    valid_rows, size_y);
            }
        }

        return new_row;
    };


    fn.get_consecutive_numbers_index = function(arr, size_y) {
        var max = arr.length;
        var result = [];
        var first = true;
        var prev = -1; // or null?

        for (var i=0; i < max; i++) {
            if (first || arr[i] === prev + 1) {
                result.push(i);
                if (result.length === size_y) {
                    break;
                }
                first = false;
            }else{
                result = [];
                first = true;
            }

            prev = arr[i];
        }

        return result.length >= size_y ? arr[result[0]] : false;
    };


    /**
    * Get widgets overlapping with the player.
    *
    * @method get_widgets_overlapped
    * @return {jQuery} Returns a jQuery collection of HTMLElements.
    */
    fn.get_widgets_overlapped = function() {
        var $w;
        var $widgets = $([]);
        var used = [];
        var rows_from_bottom = this.cells_occupied_by_player.rows.slice(0);
        rows_from_bottom.reverse();

        $.each(this.cells_occupied_by_player.cols, $.proxy(function(i, col) {
            $.each(rows_from_bottom, $.proxy(function(i, row) {
                // if there is a widget in the player position
                if (!this.gridmap[col]) { return true; } //next iteration
                var $w = this.gridmap[col][row];
                if (this.is_occupied(col, row) && !this.is_player($w) &&
                    $.inArray($w, used) === -1
                ) {
                    $widgets = $widgets.add($w);
                    used.push($w);
                }

            }, this));
        }, this));

        return $widgets;
    };


    /**
    * This callback is executed when the player begins to collide with a column.
    *
    * @method on_start_overlapping_column
    * @param {Number} col The collided column.
    * @return {jQuery} Returns a jQuery collection of HTMLElements.
    */
    fn.on_start_overlapping_column = function(col) {
        // this.set_player(col, false);
    };


    /**
    * A callback executed when the player begins to collide with a row.
    *
    * @method on_start_overlapping_row
    * @param {Number} row The collided row.
    * @return {jQuery} Returns a jQuery collection of HTMLElements.
    */
    fn.on_start_overlapping_row = function(row) {
        // this.set_player(false, row);
    };


    /**
    * A callback executed when the the player ends to collide with a column.
    *
    * @method on_stop_overlapping_column
    * @param {Number} col The collided row.
    * @return {jQuery} Returns a jQuery collection of HTMLElements.
    */
    fn.on_stop_overlapping_column = function(col) {
        this.set_player(col, false);

        var self = this;
        this.for_each_widget_below(col, this.cells_occupied_by_player.rows[0],
            function(tcol, trow) {
                self.move_widget_up(this, self.player_grid_data.size_y);
        });
    };


    /**
    * This callback is executed when the player ends to collide with a row.
    *
    * @method on_stop_overlapping_row
    * @param {Number} row The collided row.
    * @return {jQuery} Returns a jQuery collection of HTMLElements.
    */
    fn.on_stop_overlapping_row = function(row) {
        this.set_player(false, row);

        var self = this;
        var cols = this.cells_occupied_by_player.cols;
        for (var c = 0, cl = cols.length; c < cl; c++) {
            this.for_each_widget_below(cols[c], row, function(tcol, trow) {
                self.move_widget_up(this, self.player_grid_data.size_y);
            });
        }
    };


    /**
    * Move a widget to a specific row. The cell or cells must be empty.
    * If the widget has widgets below, all of these widgets will be moved also
    * if they can.
    *
    * @method move_widget_to
    * @param {HTMLElement} $widget The jQuery wrapped HTMLElement of the
    * widget is going to be moved.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.move_widget_to = function($widget, row) {
        var self = this;
        var widget_grid_data = $widget.coords().grid;
        var diff = row - widget_grid_data.row;
        var $next_widgets = this.widgets_below($widget);

        var can_move_to_new_cell = this.can_move_to(
            widget_grid_data, widget_grid_data.col, row, $widget);

        if (can_move_to_new_cell === false) {
            return false;
        }

        this.remove_from_gridmap(widget_grid_data);
        widget_grid_data.row = row;
        this.add_to_gridmap(widget_grid_data);
        $widget.attr('data-row', row);
        this.$changed = this.$changed.add($widget);


        $next_widgets.each(function(i, widget) {
            var $w = $(widget);
            var wgd = $w.coords().grid;
            var can_go_up = self.can_go_widget_up(wgd);
            if (can_go_up && can_go_up !== wgd.row) {
                self.move_widget_to($w, can_go_up);
            }
        });

        return this;
    };


    /**
    * Move up the specified widget and all below it.
    *
    * @method move_widget_up
    * @param {HTMLElement} $widget The widget you want to move.
    * @param {Number} [y_units] The number of cells that the widget has to move.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.move_widget_up = function($widget, y_units) {
        return false;

        var el_grid_data = $widget.coords().grid;
        var actual_row = el_grid_data.row;
        var moved = [];
        var can_go_up = true;
        y_units || (y_units = 1);

        if (!this.can_go_up($widget)) { return false; } //break;

        this.for_each_column_occupied(el_grid_data, function(col) {
            // can_go_up
            if ($.inArray($widget, moved) === -1) {
                var widget_grid_data = $widget.coords().grid;
                var next_row = actual_row - y_units;
                next_row = this.can_go_up_to_row(
                    widget_grid_data, col, next_row);

                if (!next_row) {
                    return true;
                }

                var $next_widgets = this.widgets_below($widget);

                this.remove_from_gridmap(widget_grid_data);
                widget_grid_data.row = next_row;
                this.add_to_gridmap(widget_grid_data);
                $widget.attr('data-row', widget_grid_data.row);
                this.$changed = this.$changed.add($widget);

                moved.push($widget);

                $next_widgets.each($.proxy(function(i, widget) {
                    this.move_widget_up($(widget), y_units);
                }, this));
            }
        });

    };


    /**
    * Move down the specified widget and all below it.
    *
    * @method move_widget_down
    * @param {jQuery} $widget The jQuery object representing the widget
    *  you want to move.
    * @param {Number} y_units The number of cells that the widget has to move.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.move_widget_down = function($widget, y_units) {
        var el_grid_data, actual_row, moved, y_diff;

        if (y_units <= 0) { return false; }

        el_grid_data = $widget.coords().grid;
        actual_row = el_grid_data.row;
        moved = [];
        y_diff = y_units;

        if (!$widget) { return false; }

        if ($.inArray($widget, moved) === -1) {

            var widget_grid_data = $widget.coords().grid;
            var next_row = actual_row + y_units;
            var $next_widgets = this.widgets_below($widget);

            this.remove_from_gridmap(widget_grid_data);

            $next_widgets.each($.proxy(function(i, widget) {
                var $w = $(widget);
                var wd = $w.coords().grid;
                var tmp_y = this.displacement_diff(
                             wd, widget_grid_data, y_diff);

                if (tmp_y > 0) {
                    this.move_widget_down($w, tmp_y);
                }
            }, this));

            widget_grid_data.row = next_row;
            this.update_widget_position(widget_grid_data, $widget);
            $widget.attr('data-row', widget_grid_data.row);
            this.$changed = this.$changed.add($widget);

            moved.push($widget);
        }
    };


    /**
    * Check if the widget can move to the specified row, else returns the
    * upper row possible.
    *
    * @method can_go_up_to_row
    * @param {Number} widget_grid_data The current grid coords object of the
    *  widget.
    * @param {Number} col The target column.
    * @param {Number} row The target row.
    * @return {Boolean|Number} Returns the row number if the widget can move
    *  to the target position, else returns false.
    */
    fn.can_go_up_to_row = function(widget_grid_data, col, row) {
        var ga = this.gridmap;
        var result = true;
        var urc = []; // upper_rows_in_columns
        var actual_row = widget_grid_data.row;
        var r;

        /* generate an array with columns as index and array with
         * upper rows empty in the column */
        this.for_each_column_occupied(widget_grid_data, function(tcol) {
            var grid_col = ga[tcol];
            urc[tcol] = [];

            r = actual_row;
            while (r--) {
                if (this.is_empty(tcol, r) &&
                    !this.is_placeholder_in(tcol, r)
                ) {
                    urc[tcol].push(r);
                }else{
                    break;
                }
            }

            if (!urc[tcol].length) {
                result = false;
                return true;
            }

        });

        if (!result) { return false; }

        /* get common rows starting from upper position in all the columns
         * that widget occupies */
        r = row;
        for (r = 1; r < actual_row; r++) {
            var common = true;

            for (var uc = 0, ucl = urc.length; uc < ucl; uc++) {
                if (urc[uc] && $.inArray(r, urc[uc]) === -1) {
                    common = false;
                }
            }

            if (common === true) {
                result = r;
                break;
            }
        }

        return result;
    };


    fn.displacement_diff = function(widget_grid_data, parent_bgd, y_units) {
        var actual_row = widget_grid_data.row;
        var diffs = [];
        var parent_max_y = parent_bgd.row + parent_bgd.size_y;

        this.for_each_column_occupied(widget_grid_data, function(col) {
            var temp_y_units = 0;

            for (var r = parent_max_y; r < actual_row; r++) {
                if (this.is_empty(col, r)) {
                    temp_y_units = temp_y_units + 1;
                }
            }

            diffs.push(temp_y_units);
        });

        var max_diff = Math.max.apply(Math, diffs);
        y_units = (y_units - max_diff);

        return y_units > 0 ? y_units : 0;
    };


    /**
    * Get widgets below a widget.
    *
    * @method widgets_below
    * @param {HTMLElement} $el The jQuery wrapped HTMLElement.
    * @return {jQuery} A jQuery collection of HTMLElements.
    */
    fn.widgets_below = function($el) {
        var el_grid_data = $.isPlainObject($el) ? $el : $el.coords().grid;
        var self = this;
        var ga = this.gridmap;
        var next_row = el_grid_data.row + el_grid_data.size_y - 1;
        var $nexts = $([]);

        this.for_each_column_occupied(el_grid_data, function(col) {
            self.for_each_widget_below(col, next_row, function(tcol, trow) {
                if (!self.is_player(this) && $.inArray(this, $nexts) === -1) {
                    $nexts = $nexts.add(this);
                    return true; // break
                }
            });
        });

        return this.sort_by_row_asc($nexts);
    };


    /**
    * Update the array of mapped positions with the new player position.
    *
    * @method set_cells_player_occupies
    * @param {Number} col The new player col.
    * @param {Number} col The new player row.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.set_cells_player_occupies = function(col, row) {
        this.remove_from_gridmap(this.placeholder_grid_data);
        this.placeholder_grid_data.col = col;
        this.placeholder_grid_data.row = row;
        this.add_to_gridmap(this.placeholder_grid_data, this.$player);
        return this;
    };


    /**
    * Remove from the array of mapped positions the reference to the player.
    *
    * @method empty_cells_player_occupies
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.empty_cells_player_occupies = function() {
        this.remove_from_gridmap(this.placeholder_grid_data);
        return this;
    };


    fn.can_go_up = function($el) {
        var el_grid_data = $el.coords().grid;
        var initial_row = el_grid_data.row;
        var prev_row = initial_row - 1;
        var ga = this.gridmap;
        var upper_rows_by_column = [];

        var result = true;
        if (initial_row === 1) { return false; }

        this.for_each_column_occupied(el_grid_data, function(col) {
            var $w = this.is_widget(col, prev_row);

            if (this.is_occupied(col, prev_row) ||
                this.is_player(col, prev_row) ||
                this.is_placeholder_in(col, prev_row) ||
                this.is_player_in(col, prev_row)
            ) {
                result = false;
                return true; //break
            }
        });

        return result;
    };



    /**
    * Check if it's possible to move a widget to a specific col/row. It takes
    * into account the dimensions (`size_y` and `size_x` attrs. of the grid
    *  coords object) the widget occupies.
    *
    * @method can_move_to
    * @param {Object} widget_grid_data The grid coords object that represents
    *  the widget.
    * @param {Object} col The col to check.
    * @param {Object} row The row to check.
    * @param {Number} [max_row] The max row allowed.
    * @return {Boolean} Returns true if all cells are empty, else return false.
    */
    fn.can_move_to = function(widget_grid_data, col, row, max_row) {
        var ga = this.gridmap;
        var $w = widget_grid_data.el;
        var future_wd = {
            size_y: widget_grid_data.size_y,
            size_x: widget_grid_data.size_x,
            col: col,
            row: row
        };
        var result = true;

        //Prevents widgets go out of the grid
        var right_col = col + widget_grid_data.size_x - 1;
        if (right_col > this.cols) {
            return false;
        }

        if (max_row && max_row < row + widget_grid_data.size_y - 1) {
            return false;
        }

        this.for_each_cell_occupied(future_wd, function(tcol, trow) {
            var $tw = this.is_widget(tcol, trow);
            if ($tw && (!widget_grid_data.el || $tw.is($w))) {
                result = false;
            }
        });

        return result;
    };


    /**
    * Given the leftmost column returns all columns that are overlapping
    *  with the player.
    *
    * @method get_targeted_columns
    * @param {Number} [from_col] The leftmost column.
    * @return {Array} Returns an array with column numbers.
    */
    fn.get_targeted_columns = function(from_col) {
        var max = (from_col || this.player_grid_data.col) +
            (this.player_grid_data.size_x - 1);
        var cols = [];
        for (var col = from_col; col <= max; col++) {
            cols.push(col);
        }
        return cols;
    };


    /**
    * Given the upper row returns all rows that are overlapping with the player.
    *
    * @method get_targeted_rows
    * @param {Number} [from_row] The upper row.
    * @return {Array} Returns an array with row numbers.
    */
    fn.get_targeted_rows = function(from_row) {
        var max = (from_row || this.player_grid_data.row) +
            (this.player_grid_data.size_y - 1);
        var rows = [];
        for (var row = from_row; row <= max; row++) {
            rows.push(row);
        }
        return rows;
    };

    /**
    * Get all columns and rows that a widget occupies.
    *
    * @method get_cells_occupied
    * @param {Object} el_grid_data The grid coords object of the widget.
    * @return {Object} Returns an object like `{ cols: [], rows: []}`.
    */
    fn.get_cells_occupied = function(el_grid_data) {
        var cells = { cols: [], rows: []};
        var i;
        if (arguments[1] instanceof jQuery) {
            el_grid_data = arguments[1].coords().grid;
        }

        for (i = 0; i < el_grid_data.size_x; i++) {
            var col = el_grid_data.col + i;
            cells.cols.push(col);
        }

        for (i = 0; i < el_grid_data.size_y; i++) {
            var row = el_grid_data.row + i;
            cells.rows.push(row);
        }

        return cells;
    };


    /**
    * Iterate over the cells occupied by a widget executing a function for
    * each one.
    *
    * @method for_each_cell_occupied
    * @param {Object} el_grid_data The grid coords object that represents the
    *  widget.
    * @param {Function} callback The function to execute on each column
    *  iteration. Column and row are passed as arguments.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.for_each_cell_occupied = function(grid_data, callback) {
        this.for_each_column_occupied(grid_data, function(col) {
            this.for_each_row_occupied(grid_data, function(row) {
                callback.call(this, col, row);
            });
        });
        return this;
    };


    /**
    * Iterate over the columns occupied by a widget executing a function for
    * each one.
    *
    * @method for_each_column_occupied
    * @param {Object} el_grid_data The grid coords object that represents
    *  the widget.
    * @param {Function} callback The function to execute on each column
    *  iteration. The column number is passed as first argument.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.for_each_column_occupied = function(el_grid_data, callback) {
        for (var i = 0; i < el_grid_data.size_x; i++) {
            var col = el_grid_data.col + i;
            callback.call(this, col, el_grid_data);
        }
    };


    /**
    * Iterate over the rows occupied by a widget executing a function for
    * each one.
    *
    * @method for_each_row_occupied
    * @param {Object} el_grid_data The grid coords object that represents
    *  the widget.
    * @param {Function} callback The function to execute on each column
    *  iteration. The row number is passed as first argument.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.for_each_row_occupied = function(el_grid_data, callback) {
        for (var i = 0; i < el_grid_data.size_y; i++) {
            var row = el_grid_data.row + i;
            callback.call(this, row, el_grid_data);
        }
    };



    fn._traversing_widgets = function(type, direction, col, row, callback) {
        var ga = this.gridmap;
        if (!ga[col]) { return; }

        var cr, max;
        var action = type + '/' + direction;
        if (arguments[2] instanceof jQuery) {
            var el_grid_data = arguments[2].coords().grid;
            col = el_grid_data.col;
            row = el_grid_data.row;
            callback = arguments[3];
        }
        var matched = [];
        var trow = row;


        var methods = {
            'for_each/above': function() {
                while (trow--) {
                    if (trow > 0 && this.is_widget(col, trow) &&
                        $.inArray(ga[col][trow], matched) === -1
                    ) {
                        cr = callback.call(ga[col][trow], col, trow);
                        matched.push(ga[col][trow]);
                        if (cr) { break; }
                    }
                }
            },
            'for_each/below': function() {
                for (trow = row + 1, max = ga[col].length; trow < max; trow++) {
                    if (this.is_widget(col, trow) &&
                        $.inArray(ga[col][trow], matched) === -1
                    ) {
                        cr = callback.call(ga[col][trow], col, trow);
                        matched.push(ga[col][trow]);
                        if (cr) { break; }
                    }
                }
            }
        };

        if (methods[action]) {
            methods[action].call(this);
        }
    };


    /**
    * Iterate over each widget above the column and row specified.
    *
    * @method for_each_widget_above
    * @param {Number} col The column to start iterating.
    * @param {Number} row The row to start iterating.
    * @param {Function} callback The function to execute on each widget
    *  iteration. The value of `this` inside the function is the jQuery
    *  wrapped HTMLElement.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.for_each_widget_above = function(col, row, callback) {
        this._traversing_widgets('for_each', 'above', col, row, callback);
        return this;
    };


    /**
    * Iterate over each widget below the column and row specified.
    *
    * @method for_each_widget_below
    * @param {Number} col The column to start iterating.
    * @param {Number} row The row to start iterating.
    * @param {Function} callback The function to execute on each widget
    *  iteration. The value of `this` inside the function is the jQuery wrapped
    *  HTMLElement.
    * @return {Class} Returns the instance of the Gridster Class.
    */
    fn.for_each_widget_below = function(col, row, callback) {
        this._traversing_widgets('for_each', 'below', col, row, callback);
        return this;
    };


    /**
    * Returns the highest occupied cell in the grid.
    *
    * @method get_highest_occupied_cell
    * @return {Object} Returns an object with `col` and `row` numbers.
    */
    fn.get_highest_occupied_cell = function() {
        var r;
        var gm = this.gridmap;
        var rows = [];
        var row_in_col = [];
        for (var c = gm.length - 1; c >= 1; c--) {
            for (r = gm[c].length - 1; r >= 1; r--) {
                if (this.is_widget(c, r)) {
                    rows.push(r);
                    row_in_col[r] = c;
                    break;
                }
            }
        }

        var highest_row = Math.max.apply(Math, rows);

        this.highest_occupied_cell = {
            col: row_in_col[highest_row],
            row: highest_row
        };

        return this.highest_occupied_cell;
    };


    fn.get_widgets_from = function(col, row) {
        var ga = this.gridmap;
        var $widgets = $();

        if (col) {
            $widgets = $widgets.add(
                this.$widgets.filter(function() {
                    var tcol = $(this).attr('data-col');
                    return (tcol === col || tcol > col);
                })
            );
        }

        if (row) {
            $widgets = $widgets.add(
                this.$widgets.filter(function() {
                    var trow = $(this).attr('data-row');
                    return (trow === row || trow > row);
                })
            );
        }

        return $widgets;
    };


    /**
    * Set the current height of the parent grid.
    *
    * @method set_dom_grid_height
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.set_dom_grid_height = function() {
        var r = this.get_highest_occupied_cell().row;
        r = isFinite(r) ? r : 0;
        this.$el.css('height', r * this.min_widget_height);
        return this;
    };


    /**
    * It generates the neccessary styles to position the widgets.
    *
    * @method generate_stylesheet
    * @param {Number} rows Number of columns.
    * @param {Number} cols Number of rows.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.generate_stylesheet = function(opts) {
        var styles = '';
        var max_size_x = this.options.max_size_x || this.cols;
        var max_rows = 0;
        var max_cols = 0;
        var i;
        var rules;

        opts || (opts = {});
        opts.cols || (opts.cols = this.cols);
        opts.rows || (opts.rows = this.rows);
        opts.namespace || (opts.namespace = this.options.namespace);
        opts.widget_base_dimensions ||
            (opts.widget_base_dimensions = this.options.widget_base_dimensions);
        opts.widget_margins ||
            (opts.widget_margins = this.options.widget_margins);
        opts.min_widget_width = (opts.widget_margins[0] * 2) +
            opts.widget_base_dimensions[0];
        opts.min_widget_height = (opts.widget_margins[1] * 2) +
            opts.widget_base_dimensions[1];

        // don't duplicate stylesheets for the same configuration
        var serialized_opts = $.param(opts);
        if ($.inArray(serialized_opts, Gridster.generated_stylesheets) >= 0) {
            return false;
        }

        Gridster.generated_stylesheets.push(serialized_opts);

        /* generate CSS styles for cols */
        for (i = opts.cols; i >= 0; i--) {
            styles += (opts.namespace + ' [data-col="'+ (i + 1) + '"] { left:' +
                ((i * opts.widget_base_dimensions[0]) +
                (i * opts.widget_margins[0]) +
                ((i + 1) * opts.widget_margins[0])) + 'px; }\n');
        }

        /* generate CSS styles for rows */
        for (i = opts.rows; i >= 0; i--) {
            styles += (opts.namespace + ' [data-row="' + (i + 1) + '"] { top:' +
                ((i * opts.widget_base_dimensions[1]) +
                (i * opts.widget_margins[1]) +
                ((i + 1) * opts.widget_margins[1]) ) + 'px; }\n');
        }

        for (var y = 1; y <= opts.rows; y++) {
            styles += (opts.namespace + ' [data-sizey="' + y + '"] { height:' +
                (y * opts.widget_base_dimensions[1] +
                (y - 1) * (opts.widget_margins[1] * 2)) + 'px; }\n');
        }

        for (var x = 1; x <= max_size_x; x++) {
            styles += (opts.namespace + ' [data-sizex="' + x + '"] { width:' +
                (x * opts.widget_base_dimensions[0] +
                (x - 1) * (opts.widget_margins[0] * 2)) + 'px; }\n');
        }

        return this.add_style_tag(styles);
    };


    /**
    * Injects the given CSS as string to the head of the document.
    *
    * @method add_style_tag
    * @param {String} css The styles to apply.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.add_style_tag = function(css) {
      var d = document;
      var tag = d.createElement('style');

      d.getElementsByTagName('head')[0].appendChild(tag);
      tag.setAttribute('type', 'text/css');

      if (tag.styleSheet) {
        tag.styleSheet.cssText = css;
      }else{
        tag.appendChild(document.createTextNode(css));
      }

      this.$style_tags = this.$style_tags.add(tag);

      return this;
    };


    /**
    * Remove the style tag with the associated id from the head of the document
    *
    * @method  remove_style_tag
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.remove_style_tags = function() {
        this.$style_tags.remove();
    };


    /**
    * Generates a faux grid to collide with it when a widget is dragged and
    * detect row or column that we want to go.
    *
    * @method generate_faux_grid
    * @param {Number} rows Number of columns.
    * @param {Number} cols Number of rows.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.generate_faux_grid = function(rows, cols) {
        this.faux_grid = [];
        this.gridmap = [];
        var col;
        var row;
        for (col = cols; col > 0; col--) {
            this.gridmap[col] = [];
            for (row = rows; row > 0; row--) {
                this.add_faux_cell(row, col);
            }
        }
        return this;
    };


    /**
    * Add cell to the faux grid.
    *
    * @method add_faux_cell
    * @param {Number} row The row for the new faux cell.
    * @param {Number} col The col for the new faux cell.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.add_faux_cell = function(row, col) {
        var coords = $({
                        left: this.baseX + ((col - 1) * this.min_widget_width),
                        top: this.baseY + (row -1) * this.min_widget_height,
                        width: this.min_widget_width,
                        height: this.min_widget_height,
                        col: col,
                        row: row,
                        original_col: col,
                        original_row: row
                    }).coords();

        if (!$.isArray(this.gridmap[col])) {
            this.gridmap[col] = [];
        }

        this.gridmap[col][row] = false;
        this.faux_grid.push(coords);

        return this;
    };


    /**
    * Add rows to the faux grid.
    *
    * @method add_faux_rows
    * @param {Number} rows The number of rows you want to add to the faux grid.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.add_faux_rows = function(rows) {
        var actual_rows = this.rows;
        var max_rows = actual_rows + (rows || 1);

        for (var r = max_rows; r > actual_rows; r--) {
            for (var c = this.cols; c >= 1; c--) {
                this.add_faux_cell(r, c);
            }
        }

        this.rows = max_rows;

        if (this.options.autogenerate_stylesheet) {
            this.generate_stylesheet();
        }

        return this;
    };

     /**
    * Add cols to the faux grid.
    *
    * @method add_faux_cols
    * @param {Number} cols The number of cols you want to add to the faux grid.
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.add_faux_cols = function(cols) {
        var actual_cols = this.cols;
        var max_cols = actual_cols + (cols || 1);

        for (var c = actual_cols; c < max_cols; c++) {
            for (var r = this.rows; r >= 1; r--) {
                this.add_faux_cell(r, c);
            }
        }

        this.cols = max_cols;

        if (this.options.autogenerate_stylesheet) {
            this.generate_stylesheet();
        }

        return this;
    };


    /**
    * Recalculates the offsets for the faux grid. You need to use it when
    * the browser is resized.
    *
    * @method recalculate_faux_grid
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.recalculate_faux_grid = function() {
        var aw = this.$wrapper.width();
        this.baseX = ($(window).width() - aw) / 2;
        this.baseY = this.$wrapper.offset().top;

        $.each(this.faux_grid, $.proxy(function(i, coords) {
            this.faux_grid[i] = coords.update({
                left: this.baseX + (coords.data.col -1) * this.min_widget_width,
                top: this.baseY + (coords.data.row -1) * this.min_widget_height
            });

        }, this));

        return this;
    };


    /**
    * Get all widgets in the DOM and register them.
    *
    * @method get_widgets_from_DOM
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.get_widgets_from_DOM = function() {
        this.$widgets.each($.proxy(function(i, widget) {
            this.register_widget($(widget));
        }, this));
        return this;
    };


    /**
    * Calculate columns and rows to be set based on the configuration
    *  parameters, grid dimensions, etc ...
    *
    * @method generate_grid_and_stylesheet
    * @return {Object} Returns the instance of the Gridster class.
    */
    fn.generate_grid_and_stylesheet = function() {
        var aw = this.$wrapper.width();
        var ah = this.$wrapper.height();
        var max_cols = this.options.max_cols;

        var cols = Math.floor(aw / this.min_widget_width) +
                   this.options.extra_cols;

        var actual_cols = this.$widgets.map(function() {
            return $(this).attr('data-col');
        }).get();

        //needed to pass tests with phantomjs
        actual_cols.length || (actual_cols = [0]);

        var min_cols = Math.max.apply(Math, actual_cols);

        // get all rows that could be occupied by the current widgets
        var max_rows = this.options.extra_rows;
        this.$widgets.each(function(i, w) {
            max_rows += (+$(w).attr('data-sizey'));
        });

        this.cols = Math.max(min_cols, cols, this.options.min_cols);

        if (max_cols && max_cols >= min_cols && max_cols < this.cols) {
            this.cols = max_cols;
        }

        this.rows = Math.max(max_rows, this.options.min_rows);

        this.baseX = ($(window).width() - aw) / 2;
        this.baseY = this.$wrapper.offset().top;

        // left and right gutters not included
        this.container_width = (this.cols *
            this.options.widget_base_dimensions[0]) + ((this.cols - 1) * 2 *
            this.options.widget_margins[0]);

        if (this.options.autogenerate_stylesheet) {
            this.generate_stylesheet();
        }

        return this.generate_faux_grid(this.rows, this.cols);
    };

    /**
     * Destroy this gridster by removing any sign of its presence, making it easy to avoid memory leaks
     *
     * @method destroy
     * @return {undefined}
     */
    fn.destroy = function(){
        // remove bound callback on window resize
        $(window).unbind('.gridster');

        if (this.drag_api) {
            this.drag_api.destroy();
        }

        this.remove_style_tags();

        // lastly, remove gridster element
        // this will additionally cause any data associated to this element to be removed, including this
        // very gridster instance
        this.$el.remove();

        return this;
    };


    //jQuery adapter
    $.fn.gridster = function(options) {
     return this.each(function() {
       if (!$(this).data('gridster')) {
         $(this).data('gridster', new Gridster( this, options ));
       }
     });
    };

    $.Gridster = fn;

}(jQuery, window, document));

'use strict';
/**
 * JQuery Indicator plugin, (C) Gurtam.com, 2014
 * @author Vitaly Makarevich
 * Required: underscore, d3, rickshaw, wialon
 *
 * Init/Update:
 * $('#container').indicator(Object: options)
 *
 * Preload needed indicator skins (can run immidiately after
 * this file loaded, no need wait document.ready):
 * $.indicator.init(Object: init_options)
 * init_options.skins = ['needed_skin1', 'needed_skin2', ...]
 *
 * IMPORTANT: For showing unit names you have to load Wialon before rendering indicators
*/

(function( document, $, _ ) {
	var
		SVG_INDICATOR_BODY = 'svg.indicator-body:first',
		SVG_ANIMATE_DURATION = 1000, // ms
		SVG_ANIMATE_DURATION_S = SVG_ANIMATE_DURATION / 1000 + 's', // seconds
		UNIT_NAME_TMPL = '<div class="indicator-uname"><span class="unitIcon"></span><span class="unitName"></span></div>',
		EXAMPLE_MIN = 0,
		EXAMPLE_MAX = 100,
		EXAMPLE_NAME = 'Example name',
		EXAMPLE_VAL = 50,
		EXAMPLE_COLOR_1 = '#fb0004',
		EXAMPLE_COLOR_2 = '#f0a116',
		EXAMPLE_COLOR_3 = '#96c22b',
		EXAMPLE_GRAPH_DATA = [{x:1392897636,y:0},{x:1392897696,y:0},{x:1392897756,y:30},{x:1392897816,y:30},{x:1392897876,y:50},{x:1392897936,y:50},{x:1392897996,y:30},{x:1392898056,y:30},{x:1392898116,y:60},{x:1392898176,y:25},{x:1392898896,y:50},{x:1392898956,y:50},{x:1392899016,y:30},{x:1392899076,y:30},{x:1392899136,y:60},{x:1392899196,y:25},{x:1392899256,y:45},{x:1392899316,y:45},{x:1392899376,y:45}],
		TEXT_GRADIENT_STOPS = [
			{
				point: 0,
				color: 0x00CCFF
			},
			{
				point: 0.286275,
				color: 0x0000FE
			},
			{
				point: 0.647059,
				color: 0xFC00FC
			},
			{
				point: 1,
				color: 0xFB0004
			}
		],
		GRAPH = 'graph',
		GRAPH_X = 'graph_x',
		GRAPH_CLASS_NO_X = 'no-x',
		GRAPH_CLASS_NO_Y = 'no-y',
		GRAPH_Y = 'graph_y',
		GROUPS = [
			{
				name: 'text',
				skins: [
					'text_simple',
					'text_simple_color',
					'text_simple_custom',
					'text_circle_gradient',
					'horizontal_simple'
				]
			},
			{
				name: 'circle',
				skins: [
					'gauge_circle2',
					'gauge_semicircle',
					'gauge_quartercircle'
				]
			},
			{
				name: 'graph',
				skins: [
					'graph_simple',
					'graph_simple2',
					'graph_simple3',
					'graph_simple4',
					'graph_simple5',
					'graph_simple6'
				]
			},
			{
				name: 'other',
				skins: [
					'color_dots',
					'horizontal_bar',
					'horizontal_bar_gradient1',
					'horizontal_bar_gradient2',
					'horizontal_bar_mark',
					'vertical_bar_mark'
				]
			},
			{
				name: 'switchers',
				skins: [
					'switch1',
					'switch2',
					'switch3',
					'switch4',
					'switch5',
					'switch6'
				]
			}
		];

	/**
	 * Print indicator name for skin only when needed with fit text to maxWidth
	 * @param  {jQueryObject} $element DOM container for skin
	 * @param  {jQueryObject} $item    DOM body of skin (svg body in most cases)
	 * @param  {?string} selector selector to find in $item and print text, default 'text.sensor-name:first'
	 */
	var printIndicatorName_ = function($element, $item, maxWidth, selector) {
		var
			$text,
			data = $element.data(indicator),
			oldData = $element.data(indicator_old) || {};

		if (data.skin === 'text_simple_custom' && !data.show_sensor_name) {
			$text = $item.find(selector || 'text.sensor-name:first');
			$text.hide();
		}
		else if (oldData.skin !== data.skin || oldData.name !== data.name || (data.skin === 'text_simple_custom' && data.show_sensor_name)) {
			$text = $item.find(selector || 'text.sensor-name:first');
			$text.show().text(data.name);
			_.defer(function(){ fitSVGText( $text, 0, maxWidth ) });
		}
	};

	/**
	 * Print indicator val for skin only when needed with fit text to maxWidth
	 * @param  {jQueryObject} $element DOM container for skin
	 * @param  {jQueryObject} $item    DOM body of skin (svg body in most cases)
	 * @param  {?string} selector selector to find in $item and print text, default 'text.sensor-val:first'
	 */
	var printIndicatorVal_ = function($element, $item, maxWidth, textCenter, force, selector) {
		var
			$text = $item.find(selector || 'text.sensor-val:first'),
			data = $element.data(indicator),
			oldData = $element.data(indicator_old) || {};

		if (oldData.skin !== data.skin ||
			oldData.val !== data.val ||
			oldData.metrics !== data.metrics ||
			(data.skin === 'text_simple_custom' && (
				(data.color_1 !== oldData.color_1) ||
				(data.fit !== oldData.fit) ||
				(data.show_sensor_name !== oldData.show_sensor_name)
			)) ||
			force) {

			if ($text.contents().last().length) {
				$text.contents().last()[0].textContent = sensorValueFormat_(data);
			}
			else {
				$text.text( sensorValueFormat_(data) );
			}

			// if current skin is equal to "text_simple_custom"
			if (data.skin === 'text_simple_custom') {
                // availabiility to change color for value
                if (data.color_1) {
                    $text.css('fill', data.color_1);
                }

                // place in a center
                if (!data.show_sensor_name) {
                    $text
                        .attr('y', textCenter)
                        .css('dominant-baseline', 'central');

                    // availabiility to fit all widget
                    if (data.fit) {
                        return _.defer(function(){ fitSVGText( $text, 1 ) });
                    }
                } else {
                    $text
                        .attr('y', 2300)
                        .css('dominant-baseline', '');
                }

                // update font-size if changed widget property(-ies)
                if ((data.fit !== oldData.fit) || (data.show_sensor_name !== oldData.show_sensor_name) || force) {
                    $text.css('font-size', '');
                }

                // Remove maxWidth
                maxWidth = null;
			}
			_.defer(function(){ fitSVGText( $text, 0, maxWidth ) });
		}
	};

	var updateBGImage_ = function updateBGImage_($item, imageURL) {
		var
			bg_img,
			url = $.trim(sensolator.utils.stripHTTP(imageURL));

        if ($item[0].tagName === 'DIV') {
            $item = $item.find('svg');
        }

		if (url) {
			url = sensolator.utils.prependHTTP(url);
			bg_img = 'url(' + url + ')';
			$item.css('background-image') !== bg_img && $item.css('background-image', bg_img) && svgForceRepaint($item);
		}
		else {
			$item.css('background-image') !== 'none' && $item.css('background-image', 'none') && svgForceRepaint($item);
		}
	};

	var updateColors_ = function updateColors_($item, color_1, color_2, color_3) {
		for (var i = 3; i >= 1; i--) {
			if (!arguments[i]) continue;
			$item.find('path.fil'+ i).css('fill', arguments[i]);
		};
		svgForceRepaint($item);
	};

	// Used to determine whether we need to redraw dash titles of skin
	var needRedrawDashTitles_ = function($element) {
		var
			data = $element.data(indicator),
			oldData = $element.data(indicator_old) || {};

		if (oldData.skin !== data.skin || oldData.round !== data.round || oldData.min !== data.min || oldData.max !== data.max) {
			return true;
		}

		return false;
	};

	// Used to determine percent value on min to max interval
	var getValIntervalPercents_ = function(data) {
		var
			percents = (data.val - data.min) / (data.max - data.min);

		if (!isFinite(percents) || percents < 0 || !data.valid) {
			percents = 0;
		}
		else if (percents > 1) {
			percents = 1;
		}

		return percents;
	};

	// Used as IndicatorSkin_ renderer for simple switching
	var simpleSwitcherRenderer_ = (function() {
		var
			SWITCH_WIDTH = {
				switch1: 3731,
				switch2: 7461,
				switch3: 7461,
				switch4: 7461
			};

		return function($elements) {
			var
				self = this,
				$element,
				data,
				$item,
				$existedElement,
                $colorable;

			$elements.each(function (index, element) {
				$element = $(element);
				data = $element.data(indicator);

				$existedElement = $element.find(SVG_INDICATOR_BODY);
				$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

				printIndicatorUnitName_(data, $element);
				printIndicatorName_($element, $item, SWITCH_WIDTH[data.skin]);
				updateBGImage_($item, data.bg_image);

				if (data.valid && data.val != 0) {
					var
                        $currG = $item.find('g.switch-on:first').show();
					$item.find('g.switch-off:first', $item).hide();

                    switch ( data.skin ) {
                        case 'switch1':
                            $colorable = $currG.find('path.fil1');
                            break;
                        case 'switch2':
                            $colorable = $currG.find('path.fil3_a, path.fil54_a');
                            break;
                        default:
                            $colorable = $currG.find('path.fil2_a');
                    }
                    $colorable.css( 'fill', data.color_3 );
				}
				else {
                    var
                        $currG = $item.find('g.switch-off:first').show();
					$item.find('g.switch-on:first').hide();

                    switch ( data.skin ) {
                        case 'switch1':
                            $colorable = $currG.find('path.fil1_a');
                            break;
                        case 'switch2':
                            $colorable = $currG.find('path.fil3, path.fil54');
                            break;
                        default:
                            $colorable = $currG.find('path.fil2');
                    }
                    $colorable.css( 'fill', data.color_1 );
				}

				if ( !$existedElement.length ) {
					$element.append($item);
				}
			});
		};
	}());

	// Used as IndicatorSkin_ renderer for horizontal bar gradients skins
	var horizontalBarGradientRenderer_ = function ($elements) {
		var
			// <path class="sensor-state" d="
			// 	M18058 2114
			// 		l0 43
			// 			c0,223 -182,405 -405,405
			// 	l-16648 0
			// 		c-223,0 -405,-182 -405,-405
			// 	l0 -43
			// 		c0,-223 182,-405 405,-405
			// 	l16648 0
			// 		c223,0 405,182 405,405z"/>
			SENSOR_NAME_MAX_WIDTH = 510,
			SENSOR_VAL_MAX_WIDTH = 1300,
			MAX_WIDTH = 1665,

			i,
			v,
			self = this,
			$element,
			elInitialized,
			data,
			$item,
			$existedElement,
			$dashes,
			dashOldText,
			dashNewText,

			$state,
			percents,
			currentWidth,
			$animation,
			animateFrom,
			animateTo,

			dash_values = [],
			dashes_length,
			dash_interval;

		$elements.each(function (index, element) {
			$element = $(element);
			data = $element.data(indicator);

			$existedElement = $element.find(SVG_INDICATOR_BODY);
			elInitialized = $existedElement.length ? true : false;
			$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

			printIndicatorUnitName_(data, $element);
			printIndicatorName_($element, $item, SENSOR_NAME_MAX_WIDTH);
			printIndicatorVal_($element, $item, SENSOR_VAL_MAX_WIDTH);
			updateBGImage_($item, data.bg_image);

			// Mark dashes
			if ( needRedrawDashTitles_($element) ) {
				$dashes = $item.find('g.horizontal_bar_gradient_1SVG-dash-titles:first').find('text');
				dashes_length = $dashes.length;
				dash_interval = (data.max - data.min) / (dashes_length - 1);
				$dashes.each(function(i, dash){
					v = data.min + dash_interval * i;
					data.round === true && ( v = Math.round(v) );
					dash_values.push(v);
					$(dash).text( formatNumber(dash_values[i]) );
				});
			}

			$state = $item.find('path.sensor-state:first');
			percents = getValIntervalPercents_(data);
			currentWidth = Math.round(percents * MAX_WIDTH);

			$animation = $state.find('animate:first');
			animateFrom = $animation.attr('to') ? $animation.attr('to') : 'M58.7 215.7l0 -4.3c0,-22.3 18.2,-40.5 40.5,-40.5l0 0c22.3,0 40.5,18.2 40.5,40.5l0 4.3c0,22.3 -18.2,40.5 -40.5,40.5l0 0c-22.3,0 -40.5,-18.2 -40.5,-40.5z';
			animateTo = 'M58.7 215.7l0 -4.3c0,-22.3 18.2,-40.5 40.5,-40.5l' + currentWidth + ' 0c22.3,0 40.5,18.2 40.5,40.5l0 4.3c0,22.3 -18.2,40.5 -40.5,40.5l-' + currentWidth + ' 0c-22.3,0 -40.5,-18.2 -40.5,-40.5z';

			$animation
				.attr('from', animateFrom)
				.attr('to', animateTo);

			if (data.valid) {
				if (elInitialized && $animation[0].beginElement) {
					$state.attr('d', animateFrom);
					$animation[0].beginElement();
				}
				else {
					!elInitialized && $animation.attr('dur', SVG_ANIMATE_DURATION_S);
					$state
						.attr('style', 'fill: url(#horizontal_bar_gradient_1SVG-gradient' + (data.skin === 'horizontal_bar_gradient2' ? '2' : '1') + ');')
						.attr('class', 'sensor-state gradient' + (data.skin === 'horizontal_bar_gradient2' ? '2' : '1') )
						.attr('d', animateTo);
				}
			}

			if ( !$existedElement.length ) {
				$element.append($item);
			}
		});
	};

	// Used as IndicatorSkin_ renderer for rickshaw graphs
	var graphRenderer_ = (function(){
		var
			GRAPH_MAX_POINTS = 1000,
			GRAPH_SKIN = {
				graph_simple: {
					renderer: 'area', // area, stack, bar, line, scatterplot
					interpolation: 'linear' // linear, step-after, cardinal, basis
				},
				graph_simple2: {
					renderer: 'bar',
					interpolation: 'linear'
				},
				graph_simple3: {
					renderer: 'line',
					interpolation: 'cardinal'
				},
				graph_simple4: {
					renderer: 'line',
					interpolation: 'step-after'
				},
				graph_simple5: {
					renderer: 'scatterplot',
					interpolation: 'linear'
				},
				graph_simple6: {
					renderer: 'line',
					interpolation: 'linear'
				}
			};

		return function($elements){
			var
				sensor,
				$sensor_metrics,
				$sensor_unit_name,
				self = this,
				$element,
				elInitialized,
				$graph_container,
				data,
				xy,
				graph,
				$item,
				$existedElement;

			$elements.each(function (index, element) {
				var
					$graph_name;

				$element = $(element);
				data = $element.data(indicator);

				printIndicatorUnitName_(data, $element);

				$existedElement = $element.find('.graph_simple:first');
				elInitialized = $existedElement.length ? true : false;

				$item = elInitialized ? $existedElement : $(self.tmpl.data);

				if ( !$existedElement.length ) {
					$element.append($item);
				}

				$graph_container = $item.find('.graph-container:first');

				// Print name
				$graph_name = $graph_container.children('div.graph-name:first').first();
				$graph_name.text(data.name);

				if ( $.isArray(data.val) ) {
					xy = data.val;
				}
				else {
					xy = Number(data.sId)
								? sensolator.units.watchSensors[data.uId][data.sId].history.getDataXY(GRAPH_MAX_POINTS).data
								: sensolator.units.watchCounters[data.uId][data.sId].history.getDataXY(GRAPH_MAX_POINTS).data;
				}

				if ( !elInitialized ) {
					graph = new Rickshaw.Graph({
						element: $graph_container.children('.graph:first')[0],
						width: $item.width() - parseInt( $item.css('margin-left'), 10 ),
						height: $item.height(),
						min: data.min,
						max: data.max,
						padding: {
							top: 0.1,
							bottom:0
						},
						interpolation: GRAPH_SKIN[data.skin].interpolation, // [linear || step-after || cardinal || basis]
						offset: 'zero', // [silhouette || wiggle || expand || zero] see https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-offset
						preserve: true,
						// A string containing the name of the renderer to be used. Options include area, stack, bar, line, and scatterplot. Also see the multi meta renderer in order to support different renderers per series.
						// https://github.com/shutterstock/rickshaw#renderer
						renderer: GRAPH_SKIN[data.skin].renderer,
						stroke: true,
						series: [
							{
								color: data.color_2,
								stroke: 'rgba(0,0,0.15,0)',
								name: data.name,
								// the value is the history object
								data: xy
								// maxDataPoints: 3 - only used when fixedDuration serie
							}
						]
					});

					// Store graph object
					$item.data(GRAPH, graph);

					_.defer(sensolator.utils.resizeRickshawGraph, graph);
				}
				else {
					graph = $item.data(GRAPH);

                    // Update color
                    graph.series[0].color = data.color_2;

					if (graph.series[0].data.length >= GRAPH_MAX_POINTS) {
						graph.series[0].data.shift();
					};

					if (xy) {
						graph.series[0].data = xy;
					}
					else {
						xy = Number(data.sId)
									? sensolator.units.watchSensors[data.uId][data.sId].history.getLast()
									: sensolator.units.watchCounters[data.uId][data.sId].history.getLast();
						graph.series[0].data.push({
							x: xy.time,
							y: xy.val
						});
					}

				}

				graph.min = data.min;
				graph.max = data.max;
				graphTogleAxes($item, data.show_axes);

				graph.render();
			});
		};
	}());

    // Used as IndicatorSkin_ renderer for simple switching
	var generateSVGRenderer_ = (function() {
        var
            SENSOR_NAME_MAX_WIDTH = 5600,
            SENSOR_VAL_MAX_WIDTH = 6600,
            START_ANGLE = -105.5,
            MAX_ANGLE = 229,
            ROTATION_CENTER_X = 5614.5,
            ROTATION_CENTER_Y = 5614.5;

		return function($elements) {
            var
                svg,
                self = this,
                $element,
                elInitialized,
                data,
                oldData,
                scheme,
                typeScheme,
                units = '',
                $item,
                $existedElement;

            $elements.each(function (index, element) {

                $element = $(element);
                data = $element.data(indicator);
                oldData = $element.data(indicator_old) || {};

                // Check min / max
                if (data.min === data.max) {
                    return;
                }

                $existedElement = $element.find(SVG_INDICATOR_BODY);
                elInitialized = $existedElement.length ? true : false;

                typeScheme = getTypeScheme(data.skin);

                units = sensorValueFormat_(data);
                if (units.length > 1) {
                    var _units = units.split( ' ' )[1] || '';
                    units = !_units ? units.slice(-1) : _units;
                } else {
                    units = '';
                }
                scheme = _.map(data.scheme, _.clone);
                if (!scheme.length) {
                    scheme = convertSchemeValues(typeScheme[1], [0, 100], [data.min, data.max]);
                }
                // Convert values from percents to values
                if (elInitialized) {
                    $item = $existedElement;
                    // Try to get value from store
                    svg = sensolator.generatedSVGs && sensolator.generatedSVGs[$element.data('uuid')];
                    if (svg && oldData) {
                        if (oldData.name !== data.name ||
                            oldData.min !== data.min ||
                            oldData.max !== data.max ||
                            !_.isEqual(oldData.scheme, data.scheme)) {
                            // TODO: Check scheme
                            // Update value & settings
                            svg.options.name = data.name;
                            svg.options.min = data.min;
                            svg.options.max = data.max;
                            svg.options.sectors = scheme;
                            svg.options.units = units;
                            svg.options.invalidateText = !data.valid ? sensolator.lang.sensor.invalid_value : null;
                            svg.options.value = data.val;
                            // Redraw svg
                            svg.redraw();
                        } else if (oldData.val !== data.val) {
                            svg.options.invalidateText = !data.valid ? sensolator.lang.sensor.invalid_value : null;
                            // Update only value
                            svg.setValue(data.val);
                        }
                    }
                } else {
                    var uuid = generateUUID();
                    svg = GenerateSVG({
                        name: data.name,
                        type: typeScheme[0],
                        min: data.min,
                        max: data.max,
                        invalidateText: !data.valid ? sensolator.lang.sensor.invalid_value : null,
                        value: data.val,
                        sectors: scheme,
                        units: units,
                        formatter: function(val) {
                            return formatNumber(val);
                        }
                    });

                    $item = $(svg.wrapper);
                    $element.data('uuid', uuid);
                    if (!sensolator.generatedSVGs) {
                        sensolator.generatedSVGs = {};
                    }
                    sensolator.generatedSVGs[uuid] = svg;
                }

                printIndicatorUnitName_(data, $element);
                updateBGImage_($item, data.bg_image);

                if ( !$existedElement.length ) {
                    $element.append($item);
                }
            });
		};
	}());

	// Base Class for rendering specific skin of indicator
	var IndicatorSkin_ = function(url, renderer, defaults) {
		this.tmpl = {
			url: url,
			data: false
		};
		this.render = renderer;
		this.defaults = $.extend(true, {}, this.defaults, defaults || {});
	};
	$.extend(true, IndicatorSkin_.prototype, {
		defaults: {
			val: 0,
			valid: true
		},
		init_executed: false,
		initialized: false,
		init: function() {
			var self = this;

			if (!self.tmpl.url) {
				log('Error: url is not provided');
				return false;
			}

			self.init_executed = true;

            // Check if we'll need generate svg
            if (~self.tmpl.url.indexOf('GenerateSVG')) {
                self.tmpl.data = null;
                self.initialized = true;
                return;
            }
			$.ajax({
				async: true,
				url: self.tmpl.url,
				dataType: 'text',
				type: 'GET',
				//error: function (jqXHR, textStatus, errorThrown) {},
				success: function (data, textStatus, jqXHR) {
					self.tmpl.data = data;
					self.initialized = true;
				},
				//complete: function (jqXHR, textStatus) {}
			});
		},
		render: function(){
			log('Renderer is not assigned');
			return false;
		}
	});

	var
		// Abstracting the HTML and event identifiers for easy rebranding
		indicator = 'indicator',
		indicator_old = indicator + '_old',
		indicatorItem = 'indicatorItem',

		NO_UNIT_NAME_CLASS = 'no-unit-name',

		// Helper function for IndicatorSkin_.render
		printIndicatorUnitName_ = function(data, $container) {
			var
				unit,

				$uName,
				oldName,
				newName,

				$uIcon,
				oldIcon,
				newIcon,

				$rgraph = $container.children('div.rgraph:first'),

				$tmpl = $container.find('div.indicator-uname:first'),
				isTMPLExists = $tmpl.length;

			if (!data.uId || !$container.length || !data.show_unit_name) {
				if (isTMPLExists) {
					$tmpl.remove();

					if ($rgraph.length) {
						// If we have graph and remove the unit name, then resize the graph
						_.defer(sensolator.utils.resizeRickshawGraph, $rgraph.data('graph'));
					}
				}

				if ( !$container.hasClass(NO_UNIT_NAME_CLASS) ) {
					$container.addClass(NO_UNIT_NAME_CLASS);
				}

				return;
			}

			if (!isTMPLExists) {
				$tmpl = $(UNIT_NAME_TMPL);
			}

			unit = wialon.core.Session.getInstance().getItem(data.uId);
			var forceUpdateName = 1;

			// Unit name
            if (!unit || forceUpdateName) {
                $uName = $tmpl.find('.unitName:first');
    			oldName = $uName.text();
    			newName = _.unescape(unit.getName());
    			if (oldName !== newName) {
    				$uName.text(newName);
    			}
            }

			// Unit icon
            if (!unit || forceUpdateName) {
    			$uIcon = $tmpl.find('.unitIcon:first');
    			oldIcon = $uIcon.css('background-image');
    			newIcon = 'url("' + unit.getIconUrl(18) + '")';
    			if (oldIcon !== newIcon) {
    				$uIcon.css('background-image', newIcon);
    			}
            }

			if (!isTMPLExists) {
				$container.prepend($tmpl);
				if ($rgraph.length) {
					// If we have graph and prepend unit name, then resize the graph
					_.defer(sensolator.utils.resizeRickshawGraph, $rgraph.data('graph'));
				}
			}

			if ( $container.hasClass(NO_UNIT_NAME_CLASS) ) {
				$container.removeClass(NO_UNIT_NAME_CLASS);
			}
		},

		/**
		 * Format sensor value with metrics, if metric is On/Off then only print text On or Off
		 * @param  {object} data object data of indicator
		 * @param  {?string} delimiter delimiter between sensor value and metrics, default is space ' '
		 */
		sensorValueFormat_ = function(data, delimiter) {
			var
				translatedMetrics,
				res;

			if (!data.valid) {
				return sensolator.lang.sensor.invalid_value;
			}

			res = data.val;

			// TODO: refactor it
			res = sensolator.units.getSensorCounterValueWithMetricsToPrint(
				res,
				data.metrics,
				data.uId && (parseInt(data.sId) && sensolator.units.watchSensors[data.uId][data.sId].type) || data.sId
			);

			return res;
		},

		/**
		 * Toogle X and Y axes for rickshaw graph
		 * @param  {object} $item jQuery graph container DOM object
		 * @param  {?boolean} state state to swith to
		 */
		graphTogleAxes = function($item, state) {
			var
				graph = $item.data(GRAPH),
				graphX = $item.data(GRAPH_X),
				graphY = $item.data(GRAPH_Y),
				prevStateX = Boolean(graphX),
				prevStateY = Boolean(graphY),
				stateChanged = false,
				newStateX = typeof state !== 'undefined' ? Boolean(state) : !prevStateX,
				newStateY = typeof state !== 'undefined' ? Boolean(state) : !prevStateY;

			// Show/Hide X axe
			if (newStateX !== prevStateX) {
				stateChanged = true;
				if (newStateX) {
					graphX = new Rickshaw.Graph.Axis.X({
						graph: graph,
						element: $item.children('div.graph-container:first').children('div.graph-x:first')[0],
						orientation: 'bottom',
						pixelsPerTick: 80,
						ticks: 2,
						tickFormat: function(timestamp) {
							return sensolator.wialon.util.DateTime.formatTime(timestamp, 2, sensolator.user.currentUserTimeFormat); // , 'HH:mm'
						}
					});
					$item.hasClass(GRAPH_CLASS_NO_X) && $item.removeClass(GRAPH_CLASS_NO_X);
				}
				else {
					// Remove Axis
					graphX.destroy();
					graphX = false;
				}
				$item.data(GRAPH_X, graphX);
			}
			!newStateX && !$item.hasClass(GRAPH_CLASS_NO_X) && $item.addClass(GRAPH_CLASS_NO_X);

			// Show/Hide Y axe
			if (newStateY !== prevStateY) {
				stateChanged = true;
				if (newStateY) {
					graphY = new Rickshaw.Graph.Axis.Y({
						graph: graph,
						element: $item.children('div.graph-container:first').children('div.graph-y:first')[0],
						orientation: 'left',
						tickFormat: function(val) {
							return formatNumber(val);
						},
					});
					$item.hasClass(GRAPH_CLASS_NO_Y) && $item.removeClass(GRAPH_CLASS_NO_Y);
				}
				else {
					// Remove Axis
					graphY.destroy();
					graphY = false;
				}
				$item.data(GRAPH_Y, graphY);
			}
			!newStateY && !$item.hasClass(GRAPH_CLASS_NO_Y) && $item.addClass(GRAPH_CLASS_NO_Y);

			stateChanged && _.defer(sensolator.utils.resizeRickshawGraph, graph);
		},

		/**
		 *
		 * Indicator skin definitions
		 *
		 */
		skins = {
			text_simple: new IndicatorSkin_(
				// url
				'tmpl/text_simple.svg',

				//renderer
				function ($elements) {
					var
						TEMPLATE_WIDTH = 7462,
                        self = this,
						$element,
						data,
						$item,
						$existedElement,
						$bg_image_holder;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},

				// defaults for current skin, overwrites IndicatorSkin_ defaults
				{
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			text_simple_color: new IndicatorSkin_(
				'tmpl/text_simple_color.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 7462,
                        self = this,
						$element,
						elInitialized,
						data,
						$item,
						$existedElement,
						percents,
						$state,
						$stateAnimate,
						stateColorFrom,
						stateColorTo;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						elInitialized = $existedElement.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						percents = getValIntervalPercents_(data);

						// change color for state
						$state = $item.find('text.sensor-state:first');
						$stateAnimate = $state.find('animate:first');

						stateColorFrom = $stateAnimate.attr('to');
						stateColorTo = rgbToHex( gradient_find_color(TEXT_GRADIENT_STOPS, percents) );

						$stateAnimate
							.attr('from', stateColorFrom)
							.attr('to', stateColorTo);

						if (data.valid) {
							if (elInitialized && $stateAnimate[0].beginElement) {
								$state.attr('fill', stateColorFrom);
								$stateAnimate[0].beginElement();
							}
							else {
								!elInitialized && $stateAnimate.attr('dur', SVG_ANIMATE_DURATION_S);
								$state.attr('fill', stateColorTo);
							}
						}
						else {
							$state.attr('fill', '#000000');
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			text_simple_custom: new IndicatorSkin_(
				// url
				'tmpl/text_simple.svg',

				//renderer
				function ($elements) {
					var
						TEMPLATE_WIDTH = 7462,
                        TEMPLATE_HEIGHT = 2731,
						SVG_TEXT_CENTER = TEMPLATE_HEIGHT / 2,
						self = this,
						$element,
						data,
						$item,
						$existedElement,
						$bg_image_holder;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
                        printIndicatorVal_($element, $item, TEMPLATE_WIDTH, SVG_TEXT_CENTER);
						updateBGImage_($item, data.bg_image);
						if ( !$existedElement.length ) {
							$element.append($item);

							// listen widget resize event
							$element.on('gridster.onResizeStop', function() {
                                printIndicatorVal_($element, $item, TEMPLATE_WIDTH, SVG_TEXT_CENTER, true);
							});
                        }
					});
				},

				// defaults for current skin, overwrites IndicatorSkin_ defaults
				{
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null,
					show_sensor_name: false,
					color_1: EXAMPLE_COLOR_1,
					fit: true
				}
			),
			text_circle_gradient: new IndicatorSkin_(
				'tmpl/text_circle_gradient.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 100,
						self = this,
						$element,
						elInitialized,
						data,
						$item,
						percents,
						$state,
						stateColorTo,
						$existedElement;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						elInitialized = $existedElement.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						if (data.valid) {
							percents = getValIntervalPercents_(data);
							stateColorTo = rgbToHex(gradient_find_color(TEXT_GRADIENT_STOPS, percents));

							$state = $item.find('circle.sensor-state:first');
							$state.attr('fill', stateColorTo);
						} else if ( $state ) {
							$state.attr('fill', '#000000');
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			horizontal_simple: new IndicatorSkin_(
				'tmpl/horizontal_simple.svg',
				function ($elements) {
					var
						SENSOR_NAME_MAX_WIDTH = 4853,
						SENSOR_VAL_MAX_WIDTH = 14560,
						self = this,
						$element,
						data,
						$item,
						$existedElement;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, SENSOR_NAME_MAX_WIDTH);
						printIndicatorVal_($element, $item, SENSOR_VAL_MAX_WIDTH);
						updateBGImage_($item, data.bg_image);

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			gauge_quartercircle: new IndicatorSkin_(
				'tmpl/gauge_quartercircle.svg',
				generateSVGRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
					color_2: EXAMPLE_COLOR_2,
                    scheme: []
				}
			),
			gauge_semicircle: new IndicatorSkin_(
				'tmpl/gauge_semicircle.svg',
				generateSVGRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
					color_2: EXAMPLE_COLOR_2,
					color_3: EXAMPLE_COLOR_3,
                    scheme: []
				}
			),
			gauge_circle2: new IndicatorSkin_(
				'GenerateSVG',
				generateSVGRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
					color_2: EXAMPLE_COLOR_2,
					color_3: EXAMPLE_COLOR_3,
                    scheme: []
				}
			),
			color_dots: new IndicatorSkin_(
				'tmpl/color_dots.svg',
				function ($elements) {
					var
                        TEMPLATE_WIDTH = 19750,
						DASH_INACTIVE_COLOR = '#3D3F46',
						DASH_INACTIVE_CLASS = 'fil_inactive',
						i,
						v,
						self = this,
						$element,
						data,
						percents,
						$item,
						$existedElement,
						$dashes,
						$dash_dots,
						dash_values = [],
						dashes_length,
						dash_interval,
						dash_current;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						// Mark dashes
						$dashes = $item.find('g.color_dotsSVG-dash-titles:first').find('text');
						dashes_length = $dashes.length;
						dash_interval = (data.max - data.min) / (dashes_length - 1);
						$dashes.each(function(i, dash){
							v = data.min + dash_interval * i;
							data.round === true && ( v = Math.round(v) );
							dash_values.push(v);

						});
						if ( needRedrawDashTitles_($element) ) {
							$dashes.each(function(i, dash){
								$(dash).text( formatNumber(dash_values[i]) );
							});
						}

						$dash_dots = $item.find('g.color_dotsSVG-dashes:first').find('path');
						if (data.valid) {
							// Mark inactive dots
							$dash_dots.each(function(i, dot){
								if (data.val < dash_values[i]) {
									$(dot).attr('class', DASH_INACTIVE_CLASS);
								}
								else {
									$(dot).removeAttr('class');
								}
							});
						}
						else {
							$dash_dots.attr('class', function(index, classes){
								return classes + ' ' + DASH_INACTIVE_CLASS;
							});
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			horizontal_bar: new IndicatorSkin_(
				'tmpl/horizontal_bar.svg',
				function ($elements) {
					var
						// DASH_INACTIVE_COLOR = '#3D3F46',
						// DASH_INACTIVE_CLASS = 'fil_inactive',
						SENSOR_NAME_MAX_WIDTH = 5000,
						SENSOR_VAL_MAX_WIDTH = 13000,
						LINE_Y = 2291,
						LINE_START = 923,
						LINE_LENGTH = 16783,
						DOT_MAX_OFFSET = 16850,
						CURVE_START = 'c-163 0-295-132-295-295s132-295 295-295',
						CURVE_END = 'c163 0 295 132 295 295s-132 295-295 295',
						i,
						v,
						self = this,
						$element,
						elInitialized,
						data,
						percents,
						$item,
						$existedElement,

						$path_inactive,
						path_inactive_from,
						$dot,
						$dotAnimateTransform,
						dotMoveFrom,
						dotMoveTo,

						$dashes,
						dash_values = [],
						dashes_length,
						dash_interval,

						$path_inactive,
						$pathAnimation,
						pathAnimateFrom,
						pathAnimateTo;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						elInitialized = $existedElement.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, SENSOR_NAME_MAX_WIDTH);
						printIndicatorVal_($element, $item, SENSOR_VAL_MAX_WIDTH);
						updateBGImage_($item, data.bg_image);

						// Mark dashes
						if ( needRedrawDashTitles_($element) ) {
							$dashes = $item.find('g.horizontal_barSVG-dash-titles:first').find('text');
							dashes_length = $dashes.length;
							dash_interval = (data.max - data.min) / (dashes_length - 1);
							$dashes.each(function(i, dash){
								v = data.min + dash_interval * i;
								data.round === true && ( v = Math.round(v) );
								dash_values.push(v);
								$(dash).text( formatNumber(dash_values[i]) );
							});
						}

						percents = getValIntervalPercents_(data);

						// Draw inactive color line & move dot
						path_inactive_from = (data.valid ? percents : 0) * LINE_LENGTH + LINE_START;
						dotMoveTo = percents * DOT_MAX_OFFSET;
						dotMoveTo += ',0';

						$path_inactive = $item.find('path.path_inactive:first');
						$pathAnimation = $path_inactive.find('animate:first');
						pathAnimateFrom = $pathAnimation.attr('to') ? $pathAnimation.attr('to') : 'M' + LINE_START + ' ' + LINE_Y + CURVE_START + 'H' + (LINE_START + LINE_LENGTH) + CURVE_END + 'H' + LINE_START;
						pathAnimateTo = 'M' + path_inactive_from + ' ' + LINE_Y + CURVE_START + 'H' + (LINE_START + LINE_LENGTH) + CURVE_END + 'H' + path_inactive_from;

						$pathAnimation
							.attr('from', pathAnimateFrom)
							.attr('to', pathAnimateTo);

						$dot = $item.find('g.horizontal_barSVG-dot:first');
						$dotAnimateTransform = $dot.find('animateTransform:first');
						dotMoveFrom = $dotAnimateTransform.attr('to') ? $dotAnimateTransform.attr('to') : '0,0';
						$dotAnimateTransform
							.attr('from', dotMoveFrom)
							.attr('to', dotMoveTo);

						if (data.valid) {
							if (elInitialized && $pathAnimation[0].beginElement) {
								$path_inactive.attr('d', pathAnimateFrom);
								$dot.attr('transform', 'translate(' + dotMoveFrom + ')');

								$pathAnimation[0].beginElement();
								$dotAnimateTransform[0].beginElement();
							}
							else {
								!elInitialized && ($pathAnimation.attr('dur', SVG_ANIMATE_DURATION_S), $dotAnimateTransform.attr('dur', SVG_ANIMATE_DURATION_S));
								$path_inactive.attr('d', pathAnimateTo);
								$dot.attr('transform', 'translate(' + dotMoveTo + ')');
							}
						}
						else {
							$path_inactive.attr('d', pathAnimateTo);
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			horizontal_bar_gradient1: new IndicatorSkin_(
				'tmpl/horizontal_bar_gradient1.svg',
				horizontalBarGradientRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			horizontal_bar_gradient2: new IndicatorSkin_(
				'tmpl/horizontal_bar_gradient1.svg',
				horizontalBarGradientRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			horizontal_bar_mark: new IndicatorSkin_(
				'tmpl/horizontal_bar_mark.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 1865,
                        MARK_INTERVAL = 1742,
						STATE_START_WIDTH = 39,
						STATE_MAX_WIDTH = 1781,
						y_x_coeff = 210 / STATE_MAX_WIDTH,
						self = this,
						$element,
						data,
						$item,
						$existedElement,
						elInitialized,
						percents,

						v,
						$dashes,
						dash_values = [],
						dashes_length,
						dash_interval,

						$state,
						$stateAnimate,
						statePathFrom,
						statePathTo,
						currentWidth,
						yTo,
						$mark,
						$markAnimateTransform,
						markAnimateTransformFrom,
						markAnimateTransformTo;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						elInitialized = $existedElement.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						// Mark dashes
						if ( needRedrawDashTitles_($element) ) {
							$dashes = $item.find('g.horizontal_bar_markSVG-dash-titles:first').find('text');
							dashes_length = $dashes.length;
							dash_interval = (data.max - data.min) / (dashes_length - 1);
							$dashes.each(function(i, dash){
								v = data.min + dash_interval * i;
								data.round === true && ( v = Math.round(v) );
								dash_values.push(v);
								$(dash).text( formatNumber(dash_values[i]) );
							});
						}

						percents = getValIntervalPercents_(data);

						// State with animation
						$state = $item.find('path.sensor-state:first');
						$stateAnimate = $state.find('animate:first');
						currentWidth = STATE_START_WIDTH + Math.round(percents * (STATE_MAX_WIDTH - STATE_START_WIDTH));
						yTo = Math.round(currentWidth * y_x_coeff);
						statePathFrom = $stateAnimate.attr('to') ? $stateAnimate.attr('to') : 'M42 363l' + STATE_START_WIDTH + ' -5 0 5 0 78 -' + STATE_START_WIDTH + ' 0z';
						statePathTo = 'M42 363l' + currentWidth + ' -' + yTo + ' 0 ' + yTo + ' 0 78 -' + currentWidth + ' 0z';
						$stateAnimate
							.attr('from', statePathFrom)
							.attr('to', statePathTo);

						// Mark with animation
						$mark = $item.find('path.sensor-state-mark:first');
						$markAnimateTransform = $mark.find('animateTransform:first');
						markAnimateTransformFrom = $markAnimateTransform.attr('to');
						markAnimateTransformTo = Math.round(percents * MARK_INTERVAL);
						$markAnimateTransform
							.attr('from', markAnimateTransformFrom)
							.attr('to', markAnimateTransformTo);

						if (data.valid && elInitialized && $stateAnimate[0].beginElement) {
							$state.attr('d', statePathFrom);
							$mark.attr('transform', 'translate(' + markAnimateTransformFrom + ')');

							$stateAnimate[0].beginElement();
							$markAnimateTransform[0].beginElement();
						}
						else {
							!elInitialized && ($stateAnimate.attr('dur', SVG_ANIMATE_DURATION_S), $markAnimateTransform.attr('dur', SVG_ANIMATE_DURATION_S));
							$state
								.attr('style', 'fill:' + (data.valid ? 'url(#horizontal_bar_markSVG-gradient)' : '#3D3F46'))
								.attr('d', statePathTo);
							$mark.attr('transform', 'translate(' + markAnimateTransformTo + ')');
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			vertical_bar_mark: new IndicatorSkin_(
				'tmpl/vertical_bar_mark.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 373,
                        MARK_INTERVAL = 1161,
						STATE_START_HEIGHT = 39,
						STATE_MAX_HEIGHT = 1200,
						self = this,
						$element,
						data,
						$item,
						$existedElement,
						elInitialized,
						percents,

						v,
						$dashes,
						dash_values = [],
						dashes_length,
						dash_interval,

						$state,
						$stateAnimate,
						statePathFrom,
						statePathTo,
						currentHeight,
						$mark,
						$markAnimateTransform,
						markAnimateTransformFrom,
						markAnimateTransformTo;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						elInitialized = $existedElement.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						printIndicatorVal_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						// Mark dashes
						if ( needRedrawDashTitles_($element) ) {
							$dashes = $item.find('g.vertical_bar_markSVG-dash-titles:first').find('text');
							dashes_length = $dashes.length;
							dash_interval = (data.max - data.min) / (dashes_length - 1);
							$dashes.each(function(i, dash){
								v = data.min + dash_interval * i;
								data.round === true && ( v = Math.round(v) );
								dash_values.push(v);
								$(dash).text( formatNumber(dash_values[i]) );
							});
						}

						percents = getValIntervalPercents_(data);

						// State with animation
						$state = $item.find('path.sensor-state:first');
						$stateAnimate = $state.find('animate:first');
						currentHeight = STATE_START_HEIGHT + Math.round(percents * (STATE_MAX_HEIGHT - STATE_START_HEIGHT));
						statePathFrom = $stateAnimate.attr('to') ? $stateAnimate.attr('to') : 'M166 1440l0 -' + STATE_START_HEIGHT + ' 124 0 0 ' + STATE_START_HEIGHT + 'z';
						statePathTo = 'M166 1440l0 -' + currentHeight + ' 124 0 0 ' + currentHeight + 'z';
						$stateAnimate
							.attr('from', statePathFrom)
							.attr('to', statePathTo);

						// Mark with animation
						$mark = $item.find('path.sensor-state-mark:first');
						$markAnimateTransform = $mark.find('animateTransform:first');
						markAnimateTransformFrom = $markAnimateTransform.attr('to');
						markAnimateTransformTo = '0 -' + Math.round(percents * MARK_INTERVAL);
						$markAnimateTransform
							.attr('from', markAnimateTransformFrom)
							.attr('to', markAnimateTransformTo);

						if (data.valid && elInitialized && $stateAnimate[0].beginElement) {
							$state.attr('d', statePathFrom);
							$mark.attr('transform', 'translate(' + markAnimateTransformFrom + ')');

							$stateAnimate[0].beginElement();
							$markAnimateTransform[0].beginElement();
						}
						else {
							!elInitialized && ($stateAnimate.attr('dur', SVG_ANIMATE_DURATION_S), $markAnimateTransform.attr('dur', SVG_ANIMATE_DURATION_S));
							$state
								.attr('style', 'fill:' + (data.valid ? 'url(#vertical_bar_markSVG-gradient)' : '#3D3F46'))
								.attr('d', statePathTo);
							$mark.attr('transform', 'translate(' + markAnimateTransformTo + ')');
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					val: EXAMPLE_VAL,
					round: true,
					bg_image: null
				}
			),
			switch1: new IndicatorSkin_(
				'tmpl/switch1.svg',
				simpleSwitcherRenderer_,
				{
					name: EXAMPLE_NAME,
					val: '1',
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			switch2: new IndicatorSkin_(
				'tmpl/switch2.svg',
				simpleSwitcherRenderer_,
				{
					name: EXAMPLE_NAME,
					val: '1',
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			switch3: new IndicatorSkin_(
				'tmpl/switch3.svg',
				simpleSwitcherRenderer_,
				{
					name: EXAMPLE_NAME,
					val: '1',
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			switch4: new IndicatorSkin_(
				'tmpl/switch4.svg',
				simpleSwitcherRenderer_,
				{
					name: EXAMPLE_NAME,
					val: '1',
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			switch5: new IndicatorSkin_(
				'tmpl/switch5.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 5000,
                        ACTIVE_CLASS_LIST = 'indicator-body switch5SVGHolder active',
						INACTIVE_CLASS_LIST = 'indicator-body switch5SVGHolder',

						self = this,
						$element,
						data,
						$item,
						$existedElement;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);

						if (data.valid && data.val != 0) {
							$item
                                .attr('class', ACTIVE_CLASS_LIST)
                                .find('path').css( 'fill', data.color_3 );
						}
						else {
                            $item
                                .attr('class', INACTIVE_CLASS_LIST)
                                .find('path').css( 'fill', data.color_1 );
						}

						svgForceRepaint($item);

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					name: EXAMPLE_NAME,
					val: 1,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			switch6: new IndicatorSkin_(
				'tmpl/switch6.svg',
				function ($elements) {
					var
						TEMPLATE_WIDTH = 40913,
                        ACTIVE_CLASS_LIST = 'sensor-state',
						INACTIVE_CLASS_LIST = 'sensor-state inactive',

						self = this,
						$element,
						data,
						$item,
						$circle,
						prevActive,
						$existedElement;

					$elements.each(function (index, element) {
						$element = $(element);
						data = $element.data(indicator);

						$existedElement = $element.find(SVG_INDICATOR_BODY);
						// elInitialized = $inner_svg.length ? true : false;
						$item = $existedElement.length ? $existedElement : $(self.tmpl.data);

						printIndicatorUnitName_(data, $element);
						printIndicatorName_($element, $item, TEMPLATE_WIDTH);
						updateBGImage_($item, data.bg_image);

						$circle = $item.find('path.sensor-state:first');
						prevActive = $circle.attr('class') === ACTIVE_CLASS_LIST;

						if (data.valid && data.val != 0) {
							$circle
                                .attr('class', ACTIVE_CLASS_LIST)
                                .css( 'fill', data.color_3 );
						}
						else {
							$circle
                                .attr('class', INACTIVE_CLASS_LIST)
                                .css( 'fill', data.color_1 );
						}

						if ( !$existedElement.length ) {
							$element.append($item);
						}
					});
				},
				{
					name: EXAMPLE_NAME,
					val: 1,
					bg_image: null,
                    color_1: EXAMPLE_COLOR_1,
                    color_3: EXAMPLE_COLOR_3
				}
			),
			graph_simple: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
				}
			),
			graph_simple2: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
                }
			),
			graph_simple3: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
				}
			),
			graph_simple4: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
				}
			),
			graph_simple5: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
				}
			),
			graph_simple6: new IndicatorSkin_(
				'tmpl/graph_simple.html',
				graphRenderer_,
				{
					min: EXAMPLE_MIN,
					max: EXAMPLE_MAX,
					name: EXAMPLE_NAME,
					show_axes: true,
					val: EXAMPLE_GRAPH_DATA,
                    color_2: EXAMPLE_COLOR_2
				}
			)
		},

		// default options for skin, overwritten by specific skin when rendering
		defaults = {
			skin: 'horizontal_simple',
			val: EXAMPLE_VAL,
			round: false,
			valid: true
		},

		publicProps;

	// ****************
	// Helper functions
	// ****************

	function log(msg) {
		if (console && console.log) {
			console.log(msg);
		}
	}

	/**
	 * PUBLIC PROPERTIES
	 */

	publicProps = $.fn[indicator] = $[indicator] = function (options, callback) {
		options = options || {};

		var
			$this = this,
			$toUpdate = $([]),
			skin = typeof options.skin === 'undefined' ? defaults.skin :
											(typeof skins[ options.skin ] === 'undefined' ? defaults.skin : options.skin),
			renderAll = _.bind(
				function (callback) {
					var data;
					$toUpdate.each(function(){
						data = $.data(this, indicator);
						if (data && typeof data.skin != 'undefined' && typeof skins[ data.skin ] != 'undefined') {
							skins[data.skin].render( $(this) );
						}
						else {
							log('Unknown skin "' + data.skin + '"');
						}
					});

					if ( $.isFunction(callback) ) {
						callback();
					}
				}, $this, callback
			);

		if (!$this[0]) { // indicator being applied to empty collection
			return $this;
		}

		// store options
		$this.each(function () {
			var
				prop,
				oldData = $.data(this, indicator),
				newData;

			if (oldData && oldData.skin !== options.skin) {
				$this.find('.indicator-name:first, .indicator-body:first').remove();
			}

			newData = $.extend(true, {}, defaults, skins[options.skin].defaults, $.data(this, indicator) || {}, options);

			if ( newData.round !== false) {
				newData.val = Math.round(newData.val);
				newData.min = Math.round(newData.min);
				newData.max = Math.round(newData.max);
			}
			else {
				// Default format to 2 digits after dot
				if (typeof newData.val === 'number') {
					if (newData.val % 1) {
						newData.val = newData.val;
					}
				}
			}

			// check whether we need to update
			if (oldData) {
				for (prop in newData) {
					if (!_.isEqual(oldData[prop], newData[prop])) {
						$toUpdate.push(this);
						$.data(this, indicator, newData);
						$.data(this, indicator_old, oldData);
						break;
					}
				}
			}
			else {
                $toUpdate.push(this);
				$.data(this, indicator, newData);
				$.data(this, indicator_old, oldData);
			}
		}).addClass(indicatorItem);


		if ( !skins[skin].initialized ) {
			publicProps.init({skins: [skin]});

			// register handler on all ajax requests completed for loading 'skin'
			$(document).ajaxStop(renderAll);
		}
		else {
			renderAll();
		}

		return $this;
	};

	/**
	 * preload needed indicator skins
	 * @param  {Object}   options = {
	 *                            	skins: [] of 'gauge_circle'....
	 *                            }
	 * @param  {Function} callback
	 */
	publicProps.init = function(options, callback) {
		var
			t;

		options = options || {};

		options.skins =  _(options.skins || []).intersection( _(skins).keys() );
		options.skins = options.skins.length ? options.skins : _(skins).keys();

		for (t in options.skins) {
			if ( !skins[ options.skins[t] ].initialized && !skins[ options.skins[t] ].init_executed) {
				skins[ options.skins[t] ].init();
			}
		}
	};

	/**
	 * Get available skins to visualize
	 * @return {array} array of skins with default settings
	 */
	publicProps.getSkins = function() {
		var
			i,
			res = {};

		for (i in skins) {
			res[i] = $.extend(true, {}, skins[i].defaults);
		}

		return res;
	};

	/**
	 * Get array of sorted skin groups to print
	 * @return {array} array of groups with skin names
	 */
	publicProps.getGroups = function() {
		return $.extend(true, [], GROUPS);
	};

}( document, jQuery, _ ));

// disable image drag&drop
document.onmousedown = function(e) {
	if (e && e.preventDefault) {
		var t = e.target;
		var nName = t.nodeName.toLowerCase();
		if (nName == "img") {
			e.preventDefault();
			return false;
		}
	}
};
(function(jQuery) {
	jQuery.addChart = function(t, p) {
		if (t.chart)
			delete t.chart;
		// apply default properties
		p = jQuery.extend({
			chart_height: 430, // adf_chart height
			chart_width: 800, // adf_chart width
			toollbar_container: null, //element for inserting toollbar
			height: "hidden", // image height
			width: "hidden", // image width
			// report result related params
			report_result: null, // adf_chart address
			unit_id: 0, // unit id
			attach_id: 0, // report attament index
			// chart params
			scrolling: true, //allow chart scrolling left<->right
			zooming: true, //allow chart zooming
			// tracing: true, //allow callback tracing
			y_auto_scale: true, //allow y axis auto scale
			change_opts: true, //allow change chart options
			// callback proc
			on_moveto: null,
			on_loadimg: null,
			translation: {}
		}, p);

		var h = parseInt(p.chart_height);
		var w = parseInt(p.chart_width);
		var clickTimer = 0, moveTimer = 0;

		p.chart_height = (p.chart_height < 150) ? 150 : parseInt(p.chart_height);
		p.chart_width = (p.chart_width < 150) ? 150 : parseInt(p.chart_width);

		jQuery(t).show().attr({cellPadding: 0, cellSpacing: 0, border: 0});
		//create chart class
		var c = {
			init: function() {
				var id = p.toollbar_container==null ? jQuery(t).attr("id") : jQuery(p.toollbar_container).attr("id");
				p.id = id;
				p.a_scale = 0;
				jQuery(t).addClass("chart");
				if (p.toollbar_container!=null)
					jQuery(p.toollbar_container).addClass("chart");
				//init divs
				c.back_div = document.createElement('div'); //create background div
				c.nomove_div = document.createElement('div'); //create div that prevent image selection and drag&drop
				c.sel_div = document.createElement('div'); //create selection range div
				c.tool_div = document.createElement('div'); //create toolbar div
				c.img = document.createElement('img'); //create image
				jQuery(c.back_div).appendTo(t).attr("id", id + "_back_div").attr("style", "position: relative; left: 0px; top: 0px; height:" + p.height + "px; overflow: hidden;").addClass("chart-div");
				jQuery(c.img).appendTo(c.back_div).attr("id", id + "_img");
				jQuery(c.nomove_div).appendTo(c.back_div).attr("id", id + "_nomove_div").attr("style", "position: absolute; left: 0px; top: 0px; width: 100%; height: 100%;");
				jQuery(c.sel_div).appendTo(c.back_div).attr("id", id + "_sel_div").addClass("selection");
				jQuery(c.tool_div).appendTo(p.toollbar_container==null ? t : p.toollbar_container).attr("id", id + "_tool_div").addClass("toolbar");
				jQuery(c.img).width(w);
				jQuery(c.img).height(h);
				var html = "";
				if (p.scrolling) {
					html += "<div id='" + id + "_scroll_left' title='" + p.translation.scroll_left + "' class='button scroll_left'><span></span></div>";
					html += "<div id='" + id + "_scroll_right' title='" + p.translation.scroll_right + "' class='button scroll_right'><span></span></div>";
				}
				if (p.y_auto_scale)
					html += "<div id='" + id + "_y_auto_scale' title='" + p.translation.y_auto_scale + "' class='button y_auto_scale'><span></span></div>";
				if (p.zooming) {
					html += "<div id='" + id + "_zoom_in' title='" + p.translation.zoom_in + "' class='button zoom_in'><span></span></div>";
					html += "<div id='" + id + "_zoom_out' title='" + p.translation.zoom_out + "' class='button zoom_out'><span></span></div>";
					html += "<div id='" + id + "_zoom_custom' title='" + p.translation.zoom_custom + "' class='button zoom_custom'><span></span></div>";
				}
				html += "<td><div id='" + id + "_revert' title='" + p.translation.revert + "' class='button revert'><span></span></div></td>";

				html += "";
				jQuery(c.tool_div).html(html);
				jQuery("#" + id + " .button").click(function () {
					if (jQuery(this).attr("id").indexOf(p.id) == -1)
						return;
					if (jQuery(this).hasClass("zoom_custom")) {
						if (jQuery(this).hasClass("pushed")) {
							jQuery(this).removeClass("pushed");
							jQuery(c.back_div).css("cursor", "default");
							jQuery(c.sel_div).width(0);
							p.act = 0;
						} else {
							jQuery("[id^=" + p.id + "]").removeClass("pushed");
							jQuery(this).addClass("pushed");
							jQuery(c.back_div).css("cursor", "e-resize");
							jQuery(c.sel_div).removeClass("tracemode");
							jQuery(c.sel_div).width(2);
							p.act = 1;
						}
					} else if (jQuery(this).hasClass("trace")) {
						if (jQuery(this).hasClass("pushed")) {
							jQuery(this).removeClass("pushed");

							jQuery(c.sel_div).removeClass("tracemode");
							jQuery(c.back_div).css("cursor", "default");

							jQuery(c.sel_div).width(2);
							jQuery(c.back_div).css("cursor", "e-resize");
							jQuery("#" + id + " .button.zoom_custom").addClass("pushed");
							p.act = 1;
						} else {
							jQuery("[id^=" + p.id + "]").removeClass("pushed");
							jQuery(this).addClass("pushed");
							jQuery(c.sel_div).addClass("tracemode");
							jQuery(c.sel_div).width(2);
							jQuery(c.back_div).css("cursor", "crosshair");
							p.act = 2;
						}
					} else if (jQuery(this).hasClass("y_auto_scale")) {
						if (jQuery(this).hasClass("pushed_auto_y")) {
							jQuery(this).removeClass("pushed_auto_y");
							p.a_scale = 0;
						} else {
							jQuery("[id^=" + p.id + "]").removeClass("pushed_auto_y");
							jQuery(this).addClass("pushed_auto_y");
							p.a_scale = 1;
						}
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, 0, 0, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					} else if (jQuery(this).hasClass("revert")) {
						var url = p.report_result.getChartUrl(p.attach_id, 0, p.chart_width, p.chart_height, p.a_scale, 0, 0, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					} else if (jQuery(this).hasClass("scroll_left")) {
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, 1, -1, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					} else if (jQuery(this).hasClass("scroll_right")) {
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, -1, 1, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					}  else if (jQuery(this).hasClass("zoom_in")) {
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, 1, 1, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					} else if (jQuery(this).hasClass("zoom_out")) {
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, -1, -1, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					}
				});
				// jQuery(c.back_div).disableTextSelect();
				p.sel_from = 0;
				p.sel_to = 0;
				p.mouse_down = 0;
				p.act = 0;
				p.lat = 0;
				p.lon = 0;
				p.ds = 1;
				jQuery("#" + p.id + "_zoom_custom").click();
				jQuery(c.img).load(function() {
					if (p.on_loadimg)
						p.on_loadimg(false);
				});
				var url = p.report_result.getChartUrl(p.attach_id, 0, p.chart_width, p.chart_height, p.a_scale, 0, 0, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
				jQuery(c.img).attr("src", url);
				var attachment = p.report_result.getAttachments()[p.attach_id];
				for (var i = 0; i < attachment.datasets.length; i++)
					jQuery("#" + id + "_dsts").append("<option value='" + i + "'>" + attachment.datasets[i] + "</option>");

				var lastX = null, lastY = null;

				/// Hittest function
				var doHitTest = function(e, showMarker) {
					var img_w = jQuery(c.img).width();
					var x_from = parseInt(jQuery(c.sel_div).css("left"));
					var real_from = parseInt(x_from * p.chart_width / img_w);
					if (lastX == e.clientX && lastY == e.clientY && (e.type == "mousemove" || e.type == "mousedown"))
						return;
					jQuery("#tooltip").css("display", "none");
					lastX = e.clientX;
					lastY = e.clientY;

					p.report_result.hitTestChart(p.attach_id, -1, real_from, function(code, result) {
						if (code) {
							return;
						}
						if (!result) {
							return;
						}
						var left = e.clientX + 10;
						var offY = e.offsetY;
						if (typeof offY == "undefined") {
							offY = e.clientY - jQuery(e.target).offset().top;
						}
						var top = (e.clientY - offY) + (jQuery(c.sel_div).height() / 2);
						var text = "<div class='hittest-name'>" + result.textX + "</div>";
						text += "<hr/><div class='hittest-chart-descr'>";
						if (result.y != "undefined" && result.y instanceof Array && result.y.length) {
							for (var i = 0; i < result.y.length; i++) {
								text += "<div class='hittest-chart-line'><div class='hittest-chart-color' style='background-color:#" + sprintf("%06x", result.y[i].color) + "'></div><span class='descr-bold'>" + result.y[i].name + ": </span><span>" + result.y[i].textY + "</span></div>";
							}
						} else
							text += "<div class='hittest-chart-line'><span class='descr-bold'>" + result.axisY + ": </span><span>" + result.textY + "</span></div>";
						text += "</div>";

						var v = {x: jQuery(window).scrollLeft(),
							y: jQuery(window).scrollTop(),
							cx: jQuery(window).width(),
							cy: jQuery.browser.opera ? document.getElementsByTagName('html')[0].clientHeight : jQuery(window).height()
						};

						jQuery("#tooltip").height("auto").width("auto").css("overflow-y", "auto");
						jQuery("#tooltip h3").html("");

						if (result.msg && result.msg.pos) {
							var mod_rrm = WebCMS.get_module("report_result_map");
							var mod_rrt = WebCMS.get_module("report_result_table");
							var mod_tht = WebCMS.get_module("unit_info_text");

							if (mod_rrt && mod_tht && mod_rrt.get_unit()) {
								mod_tht.get_msg_info(result.msg, mod_rrt.get_unit(), null, function(res) {
									jQuery("#tooltip .body").html("<div class='ext-tooltip' id='hittest_chart_tooltip'>" + text + "<hr/>" + res + "</div>");
									jQuery("#tooltip").css("display", "");
									jQuery("#tooltip .body").css("display", "");
									var d = jQuery("#tooltip")[0];
									// check horizontal position
									if (v.x + v.cx < left + d.offsetWidth) {
										left -= d.offsetWidth + 20;
									}
									top -= d.offsetHeight / 2;
									if (v.y + v.cy < top + d.offsetHeight + 30) {
										top -= (top + d.offsetHeight) - (v.y + v.cy);
									}
									if (top < 0) {
										jQuery("#tooltip").height(d.offsetHeight - 20 + top);
										top = 10;
									}
									jQuery("#tooltip").css("left", left).css("top", top);

									if (showMarker) {
										var html = res;
										mod_rrm.center(result.msg.pos.y, result.msg.pos.x, html);
										mod_rrm.create_marker(result.msg.pos.y, result.msg.pos.x, html);
									}
								});
							}
						} else {
							jQuery("#tooltip .body").html("<div class='ext-tooltip' id='hittest_chart_tooltip'>" + text + "</div>");
							jQuery("#tooltip").css("display", "");
							jQuery("#tooltip .body").css("display", "");
							var d = jQuery("#tooltip")[0];
							// check horizontal position
							if (v.x + v.cx < left + d.offsetWidth) {
								left -= d.offsetWidth + 20;
							}
							top -= d.offsetHeight / 2;
							if (v.y + v.cy < top + d.offsetHeight + 30) {
								top -= (top + d.offsetHeight) - (v.y + v.cy);
							}
							if (top < 0) {
								jQuery("#tooltip").height(d.offsetHeight - 20 + top);
								top = 10;
							}
							jQuery("#tooltip").css("left", left).css("top", top);
						}
					});
				};

				jQuery(c.back_div).mousedown(function (e) {
					if (!p.act)
						return;
					var originalElement = e.srcElement || e.originalTarget;
					try {
						jQuery(originalElement).attr("id");
					} catch(e) { return; };

					var x_from = parseInt(jQuery(c.sel_div).css("left"));
					var img_w = jQuery(c.img).width();
					var real_from = parseInt(x_from * p.chart_width / img_w);
					if (isNaN(real_from) || real_from < 0)
						return;
					if (p.act == 1) {
						var cur_pos = x_from + 1;
						jQuery(c.sel_div).css("left", x_from);
						jQuery(c.sel_div).width(0);
						p.sel_from = x_from;
						p.mouse_down = 1;
					} else if (p.act == 2) {
						clearTimeout(clickTimer);
						clickTimer = setTimeout(function() {
							// perform hittest request and show result in tooltip, also show message marker on map
							doHitTest(e, true);
						}, 200);
					}
				});
				jQuery(c.back_div).mouseup(function (e) {
					var switch_to_msgs = function() {
						if (!ReportResultTable || !ReportResultTable.go_to_msgs_enabled)
							return;
						var img_w = jQuery(c.img).width();
						var x_from = parseInt(jQuery(c.sel_div).css("left"));
						var real_from = parseInt(x_from * p.chart_width / img_w);

						p.report_result.hitTestChart(p.attach_id, -1, real_from, function(code, result) {
							if (code || !result) {
								return;
							}
							var mod_rrt = WebCMS.get_module("report_result_table");
							if (mod_rrt && result.msg && result.msg.t)
								mod_rrt.switch_to_messages(result.msg.t);
						});
					};

					if (p.act == 2) {
						switch_to_msgs();
						return;
					}
					if (!p.mouse_down)
						return;
					p.mouse_down = 0;
					if (!p.act)
						return;
					var w = jQuery(c.sel_div).width();
					var x_from = 0;
					var x_to = 0;
					if (w) {
						if (p.on_loadimg)
							p.on_loadimg(true);
						var x_from = parseInt(jQuery(c.sel_div).css("left"));
						x_to = x_from + w;
						var img_w = jQuery(c.img).width();
						var real_from = parseInt(x_from * p.chart_width / img_w);
						var real_to = parseInt(x_to * p.chart_width / img_w);
						var url = p.report_result.getChartUrl(p.attach_id, 1, p.chart_width, p.chart_height, p.a_scale, real_from, real_to, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
						jQuery(c.img).attr("src", url);
					}
					else
						switch_to_msgs();
					jQuery(c.sel_div).width(2);
				});
				jQuery(c.back_div).mousemove(function (e) {
					if (p.act == 1) {
						if (!p.mouse_down) {
							var ofs = jQuery(this).offset();
							var cur_pos = e.clientX - ofs.left + jQuery(this).scrollLeft();
							jQuery(c.sel_div).css("left", cur_pos);
							return;
						}
						// zoom
						var ofs = jQuery(this).offset();
						var cur_pos = e.clientX - ofs.left + jQuery(this).scrollLeft();
						var x_from = p.sel_from;
						jQuery(c.sel_div).css("left", x_from > cur_pos ? cur_pos : x_from);
						jQuery(c.sel_div).width(x_from > cur_pos ? x_from - cur_pos : cur_pos - x_from);
					} else if (p.act == 2) {
						// zoom
						var ofs = jQuery(this).offset();
						var cur_pos = e.clientX - ofs.left + jQuery(this).scrollLeft();
						jQuery(c.sel_div).css("left", cur_pos);

						clearTimeout(moveTimer);
						moveTimer = setTimeout(function() {
							// perform hittest request and show result in tooltip
							doHitTest(e, false);
						}, 500);
					}
				}).bind("mouseleave", function(e) {
					if (p.act == 2) {
						clearTimeout(moveTimer);
						clearTimeout(clickTimer);
						var leaveTo = e.toElement;
						if (!leaveTo)
							leaveTo = e.relatedTarget;
						if (leaveTo && leaveTo.id == "tooltip" || jQuery(leaveTo).parents("#tooltip").length > 0) {
							jQuery("#tooltip").unbind("mouseleave").mouseleave(function() {
								jQuery("#tooltip").css("display", "none").unbind("mouseleave");
							});
							return;
						}
						setTimeout(function() {
							jQuery("#tooltip").css("display", "none");
						}, 500);
					}
				});
			}
		};
		//make chart functions accessible
		t.p = p;
		t.chart = c;
		c.init();
		return t;
	};

	var docloaded = true;
	//jQuery(document).ready(function() {docloaded = true});
	jQuery.fn.chart = function(p) {
		return this.each(function() {
				if (!docloaded) {
					jQuery(this).hide();
					var t = this;
					jQuery(document).ready(function() {
						jQuery.addChart(t, p);
					});
				} else
					jQuery.addChart(this, p);
				});
	}; //end chart
	$.fn.chartResize = function(p) { //function to update general options
		return this.each( function() {
				if (this.chart) {
					jQuery.extend(this.p, p);

					var h = parseInt(this.p.chart_height);
					var w = parseInt(this.p.chart_width);
					this.p.chart_height = (h < 150) ? 150 : h;
					this.p.chart_width = (w < 150) ? 150 : w;

					var url = this.p.report_result.getChartUrl(this.p.attach_id, 0, this.p.chart_width, this.p.chart_height, this.p.a_scale, 0, 0, wialon.report.ReportResult.chartFlag.headerNone|wialon.report.ReportResult.chartFlag.legendTop|wialon.report.ReportResult.chartFlag.legendShowAlways);
					jQuery(this.chart.img).attr("src", url);

					jQuery(this.chart.back_div).height(h);
					jQuery(this.chart.img).width(w);
					jQuery(this.chart.img).height(h);
				}
			});

	}; //end flexOptions
})(jQuery);

/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));

// set UTC time into Date object
Date.prototype.setUTC = function(year, month, day, hours, minutes, seconds, mseconds) {
	this.setUTCFullYear(year);
	this.setUTCDate(15);
	this.setUTCMonth(month);
	this.setUTCDate(day);
	this.setUTCHours(hours);
	this.setUTCMinutes(minutes);
	this.setUTCSeconds(seconds);
	this.setUTCMilliseconds(mseconds);
}

function intToDate(datestr, hours, minutes) {
	datestr = datestr + "";
	var d = new Date();
	d.setUTCFullYear(datestr.substr(0, 4));
	d.setUTCDate(15);
	d.setUTCMonth(datestr.substr(4, 2) - 1);
	d.setUTCDate(datestr.substr(6, 2));
	d.setUTCHours(hours);
	d.setUTCMinutes(minutes);
	d.setUTCSeconds(0);
	d.setUTCMilliseconds(0);

	return d;/*
	ar=parseInt(ar,10);
	var aw=Math.floor(ar/10000);
	ar=ar%10000;
	var D=Math.floor(ar/100);
	ar=ar%100;
	ar=new Date(aw,D-1,ar,12,0,0,0);
	return ar;*/
}

// is used for calendar week days and date synchronization
function fixDate(date) {
	var d = new Date();
	d.setTime(date.getTime());
	d.setHours(13);
	d.setMinutes(0);
	return d;
}

function getCaretPos(element) {
	if (typeof element.selectionStart != "undefined")
		return element.selectionStart;
	else if (document.selection && document.selection.createRange) {
		var r = document.selection.createRange();
		if (r == null)
			return 0;
		var re = element.createTextRange();
		var rc = re.duplicate();
		re.moveToBookmark(r.getBookmark());
		rc.setEndPoint('EndToStart', re);
		return rc.text.length;
	}
	return 0;
}
function setCaretPos (obj, position) {
		if (obj.setSelectionRange) {
			obj.setSelectionRange(position, position);
		} else if (obj.createTextRange) {
			var range = obj.createTextRange();
			range.move("character", position);
			range.select();
		} else if(window.getSelection){

			s = window.getSelection();
			var r1 = document.createRange();


			var walker=document.createTreeWalker(obj, NodeFilter.SHOW_ELEMENT, null, false);
			var p = position;
			var n = obj;

			while(walker.nextNode()) {
				n = walker.currentNode;
				if(p > n.value.length) {
					p -= n.value.length;
				}
				else break;
			}
			n = n.firstChild;
			r1.setStart(n, p);
			r1.setEnd(n, p);

			s.removeAllRanges();
			s.addRange(r1);

		} else if (document.selection) {
			var r1 = document.body.createTextRange();
			r1.moveToElementText(obj);
			r1.setEndPoint("EndToEnd", r1);
			r1.moveStart('character', position);
			r1.moveEnd('character', position-obj.innerText.length);
			r1.select();
		}
	}

/*(function(c){var a=["DOMMouseScroll","mousewheel"];c.event.special.mousewheel={
setup:function(){if(this.addEventListener){for(var d=a.length;d;){this.addEventListener(a[--d],b,false)}}else{this.onmousewheel=b}},teardown:function(){if(this.removeEventListener){for(var d=a.length;d;){this.removeEventListener(a[--d],b,false)}}else{this.onmousewheel=null}}};c.fn.extend({mousewheel:function(d){return d?this.bind("mousewheel",d):this.trigger("mousewheel")},unmousewheel:function(d){return this.unbind("mousewheel",d)}});function b(f){var d=[].slice.call(arguments,1),g=0,e=true;f=c.event.fix(f||window.event);f.type="mousewheel";if(f.wheelDelta){g=f.wheelDelta/120}if(f.detail){g=-f.detail/3}d.unshift(f,g);return c.event.handle.apply(this,d)}})(jQuery); */
Calendar=(function(){function y(at){at=at||{};this.args=at=al(at,{animation:!c,cont:null,bottomBar:true,date:true,fdow:aq("fdow"),min:null,max:null,reverseWheel:false,selection:[],selectionType:y.SEL_SINGLE,weekNumbers:false,align:"Bl/ / /T/r",inputField:null,trigger:null,dateFormat:"%Y-%m-%d",opacity:j?1:3,titleFormat:"%B %Y",showTime:false,timePos:"right",time:true,minuteStep:5,disabled:ad,dateInfo:ad,onChange:ad,onSelect:ad,onTimeChange:ad,onFocus:ad,onBlur:ad});this.handlers={};var P=this,D=new Date();at.min=Y(at.min);at.max=Y(at.max);if(at.date===true){at.date=D}if(at.time===true){at.time=D.getUTCHours()*100+Math.floor(D.getUTCMinutes()/at.minuteStep)*at.minuteStep}this.date=Y(at.date);this.time=at.time;this.fdow=at.fdow;m("onChange onSelect onTimeChange onFocus onBlur".split(/\s+/),function(av){var au=at[av];if(!(au instanceof Array)){au=[au]}P.handlers[av]=au});this.selection=new y.Selection(at.selection,at.selectionType,R,this);var ar=K.call(this);if(at.cont){W(at.cont).appendChild(ar)}if(at.trigger){this.manageFields(at.trigger,at.inputField,at.dateFormat)}}var S=navigator.userAgent,s=/opera/i.test(S),ai=/Konqueror|Safari|KHTML/i.test(S),j=/msie/i.test(S)&&!s&&!(/mac_powerpc/i.test(S)),c=j&&/msie 6/i.test(S),x=/gecko/i.test(S)&&!ai&&!s&&!j,l=y.prototype,q=y.I18N={};y.SEL_NONE=0;y.SEL_SINGLE=1;y.SEL_MULTIPLE=2;y.SEL_WEEK=3;y.dateToInt=V;y.intToDate=B;y.printDate=ab;y.formatString=k;y.i18n=aq;y.LANG=function(P,D,ar){q.__=q[P]={name:D,data:ar}};y.setup=function(D){return new y(D)};l.moveTo=function(aG,aD){aG=Y(aG);var aC=af(aG,this.date,true),au,az=this.args,aH=az.min&&af(aG,az.min),aI=az.max&&af(aG,az.max);if(!az.animation){aD=false}ae(aH!=null&&aH<=1,[this.els.navPrevMonth,this.els.navPrevYear],"DynarchCalendar-navDisabled");ae(aI!=null&&aI>=-1,[this.els.navNextMonth,this.els.navNextYear],"DynarchCalendar-navDisabled");if(aH<-1){aG=az.min;au=1;aC=0}if(aI>1){aG=az.max;au=2;aC=0}this.date=aG;this.refresh(!!aD);this.callHooks("onChange",this,aG,aD);if(aD&&!(aC==0&&aD==2)){if(this._bodyAnim){this._bodyAnim.stop()}var aw=this.els.body,ax=G("div","DynarchCalendar-animBody-"+U[aC],aw),aF=aw.firstChild,av=am(aF)||0.7,ay=au?Z.brakes:aC==0?Z.shake:Z.accel_ab2,aE=aC*aC>4,ar=aE?aF.offsetTop:aF.offsetLeft,aB=ax.style,aA=aE?aw.offsetHeight:aw.offsetWidth;if(aC<0){aA+=ar}else{if(aC>0){aA=ar-aA}else{aA=Math.round(aA/7);if(au==2){aA=-aA}}}if(!au&&aC!=0){var P=ax.cloneNode(true),D=P.style,at=2*aA;P.appendChild(aF.cloneNode(true));D[aE?"marginTop":"marginLeft"]=aA+"px";aw.appendChild(P)}aF.style.visibility="hidden";ax.innerHTML=ac(this);this._bodyAnim=ap({onUpdate:v(function(aK,aM){var aL=ay(aK);if(P){var aJ=aM(aL,aA,at)+"px"}if(au){aB[aE?"marginTop":"marginLeft"]=aM(aL,aA,0)+"px"}else{if(aE||aC==0){aB.marginTop=aM(aC==0?ay(aK*aK):aL,0,aA)+"px";if(aC!=0){D.marginTop=aJ}}if(!aE||aC==0){aB.marginLeft=aM(aL,0,aA)+"px";if(aC!=0){D.marginLeft=aJ}}}if(this.args.opacity>2&&P){am(P,1-aL);am(ax,aL)}},this),onStop:v(function(aJ){aw.innerHTML=ac(this,aG);this._bodyAnim=null},this)})}this._lastHoverDate=null;return aH>=-1&&aI<=1};l.isDisabled=function(D){var P=this.args;return(P.min&&af(D,P.min)<0)||(P.max&&af(D,P.max)>0)||P.disabled(D)};l.toggleMenu=function(){u(this,!this._menuVisible)};l.refresh=function(D){var P=this.els;if(!D){P.body.innerHTML=ac(this)}P.title.innerHTML=F(this);P.yearInput.value=this.date.getUTCFullYear()};l.redraw=function(){var D=this.els;this.refresh();D.dayNames.innerHTML=h(this);D.menu.innerHTML=ak(this);if(D.bottomBar){D.bottomBar.innerHTML=H(this)}t(D.topCont,v(function(ar){var P=r[ar.className];if(P){D[P]=ar}if(ar.className=="DynarchCalendar-menu-year"){p(ar,this._focusEvents);D.yearInput=ar}else{if(j){ar.setAttribute("unselectable","on")}}},this));this.setTime(null,true)};l.setLanguage=function(D){var P=y.setLanguage(D);if(P){this.fdow=P.data.fdow;this.redraw()}};y.setLanguage=function(D){var P=q[D];if(P){q.__=P}return P};l.focus=function(){try{this.els[this._menuVisible?"yearInput":"focusLink"].focus()}catch(D){}i.call(this)};l.blur=function(){this.els.focusLink.blur();this.els.yearInput.blur();z.call(this)};l.showAt=function(P,ax,av){if(this._showAnim){this._showAnim.stop()}av=av&&this.args.animation;var aw=this.els.topCont,ar=this,D=this.els.body.firstChild,au=D.offsetHeight,at=aw.style;at.position="absolute";at.left=P+"px";at.top=ax+"px";at.zIndex=10000;at.display="";if(av){D.style.marginTop=-au+"px";this.args.opacity>1&&am(aw,0);this._showAnim=ap({onUpdate:function(ay,az){D.style.marginTop=-az(Z.accel_b(ay),au,0)+"px";ar.args.opacity>1&&am(aw,ay)},onStop:function(){ar.args.opacity>1&&am(aw,"");ar._showAnim=null}})}};l.hide=function(){this.opened = false;var at=this.els.topCont,P=this,D=this.els.body.firstChild,ar=D.offsetHeight,au=J(at).y;if(this.args.animation){if(this._showAnim){this._showAnim.stop()}this._showAnim=ap({onUpdate:function(av,aw){P.args.opacity>1&&am(at,1-av);D.style.marginTop=-aw(Z.accel_b(av),0,ar)+"px";at.style.top=aw(Z.accel_ab(av),au,au-10)+"px"},onStop:function(){at.style.display="none";D.style.marginTop="";P.args.opacity>1&&am(at,"");P._showAnim=null}})}else{at.style.display="none"}this.inputField=null};l.popup=function(D,at){D=W(D);if(!at){at=this.args.align}at=at.split(/\x2f/);var ar=J(D),aw=this.els.topCont,ay=aw.style,au,ax=X();ay.visibility="hidden";ay.display="";this.showAt(0,0);document.body.appendChild(aw);au={x:aw.offsetWidth,y:aw.offsetHeight};function P(az){var aA={x:av.x,y:av.y};if(!az){return aA}if(/B/.test(az)){aA.y+=D.offsetHeight}if(/b/.test(az)){aA.y+=D.offsetHeight-au.y}if(/T/.test(az)){aA.y-=au.y}if(/l/.test(az)){aA.x-=au.x-D.offsetWidth}if(/L/.test(az)){aA.x-=au.x}if(/R/.test(az)){aA.x+=D.offsetWidth}if(/c/i.test(az)){aA.x+=(D.offsetWidth-au.x)/2}if(/m/i.test(az)){aA.y+=(D.offsetHeight-au.y)/2}return aA}var av=ar;av=P(at[0]);if(av.y<ax.y){av.y=ar.y;av=P(at[1])}if(av.x+au.x>ax.x+ax.w){av.x=ar.x;av=P(at[2])}if(av.y+au.y>ax.y+ax.h){av.y=ar.y;av=P(at[3])}if(av.x<ax.x){av.x=ar.x;av=P(at[4])}this.showAt(av.x,av.y,true);ay.visibility="";this.focus()};l.manageFields=function(ar,P,D){P=W(P);p(W(ar),"click",v(function(){this.inputField=P;this.dateFormat=D;if(this.selection.type==y.SEL_SINGLE){var aw,av,au,at;aw=/input|textarea/i.test(P.tagName)?P.value:(P.innerText||P.textContent);if(aw){av=/(^|[^%])%[bBmo]/.exec(D);au=/(^|[^%])%[de]/.exec(D);if(av&&au){at=av.index<au.index}aw=Calendar.parseDate(aw,at);if(aw){this.moveTo(aw);this.selection.set(aw,false,true)}}}this.popup(ar)},this))};l.callHooks=function(ar){var at=b(arguments,1),D=this.handlers[ar],P=0;for(;P<D.length;++P){D[P].apply(this,at)}};l.addEventListener=function(P,D){this.handlers[P].push(D)};l.removeEventListener=function(at,ar){var D=this.handlers[at],P=D.length;while(--P>=0){if(D[P]===ar){D.splice(P,1)}}};l.getTime=function(){return this.time};l.setTime=function(au,P){if(this.args.showTime){au=this.time=au!=null?au:this.time;var ar=this.getUTCHours(),D=this.getUTCMinutes(),at=ar<12;if(this.args.showTime==12){if(ar==0){ar=12}if(ar>12){ar-=12}this.els.timeAM.innerHTML=aq(at?"AM":"PM")}if(ar<10){ar="0"+ar}if(D<10){D="0"+D}this.els.timeHour.innerHTML=ar;this.els.timeMinute.innerHTML=D;if(!P){this.callHooks("onTimeChange",this,au)}}};l.getUTCHours=function(){return Math.floor(this.time/100)};l.getUTCMinutes=function(){return this.time%100};l.setUTCHours=function(D){if(D<0){D+=24}this.setTime(100*(D%24)+this.time%100)};l.setUTCMinutes=function(D){if(D<0){D+=60}this.setTime(100*this.getUTCHours()+(D%60))};l._getInputYear=function(){var D=parseInt(this.els.yearInput.value,10);if(isNaN(D)){D=this.date.getUTCFullYear()}return D};l._showTooltip=function(D){var P="",at,ar=this.els.tooltip;if(D){D=B(D);at=this.args.dateInfo(D);if(at&&at.tooltip){P="<div class='DynarchCalendar-tooltipCont'>"+ab(D,at.tooltip)+"</div>"}}ar.innerHTML=P};var ah=" align='center' cellspacing='0' cellpadding='0'";function h(D){var ar=["<table",ah,"><tr>"],P=0;if(D.args.weekNumbers){ar.push("<td><div class='DynarchCalendar-weekNumber'>",aq("wk"),"</div></td>")}while(P<7){var at=(P+++D.fdow)%7;ar.push("<td><div",aq("weekend").indexOf(at)>=0?" class='DynarchCalendar-weekend'>":">",aq("sdn")[at],"</div></td>")}ar.push("</tr></table>");return ar.join("")}function ac(aw,aG,aD){aG=aG||aw.date;aD=aD||aw.fdow;aG=new Date(aG);var aI=aG.getUTCMonth(),av=[],aA=0,D=aw.args.weekNumbers;aG.setUTCDate(1);var az=(aG.getDay()-aD)%7;if(az<0){az+=7}aG.setUTCDate(-az);aG.setUTCDate(aG.getUTCDate()+1);var aE=new Date(),at=aE.getUTCDate(),P=aE.getUTCMonth(),aJ=aE.getUTCFullYear();av[aA++]="<table class='DynarchCalendar-bodyTable'"+ah+">";for(var aC=0;aC<6;++aC){av[aA++]="<tr class='DynarchCalendar-week";if(aC==0){av[aA++]=" DynarchCalendar-first-row"}if(aC==5){av[aA++]=" DynarchCalendar-last-row"}av[aA++]="'>";if(D){av[aA++]="<td class='DynarchCalendar-first-col'><div class='DynarchCalendar-weekNumber'>"+a(aG)+"</div></td>"}for(var aB=0;aB<7;++aB){var aF=aG.getUTCDate(),ay=aG.getUTCMonth(),au=aG.getUTCFullYear(),ar=10000*au+100*(ay+1)+aF,aH=aw.selection.isSelected(ar),ax=aw.isDisabled(aG);av[aA++]="<td class='";if(aB==0&&!D){av[aA++]=" DynarchCalendar-first-col"}if(aB==0&&aC==0){aw._firstDateVisible=ar}if(aB==6){av[aA++]=" DynarchCalendar-last-col";if(aC==5){aw._lastDateVisible=ar}}if(aH){av[aA++]=" DynarchCalendar-td-selected"}av[aA++]="'><div dyc-type='date' unselectable='on' dyc-date='"+ar+"' ";if(ax){av[aA++]="disabled='1' "}av[aA++]="class='DynarchCalendar-day";if(aq("weekend").indexOf(aG.getDay())>=0){av[aA++]=" DynarchCalendar-weekend"}if(ay!=aI){av[aA++]=" DynarchCalendar-day-othermonth"}if(aF==at&&ay==P&&au==aJ){av[aA++]=" DynarchCalendar-day-today"}if(ax){av[aA++]=" DynarchCalendar-day-disabled"}if(aH){av[aA++]=" DynarchCalendar-day-selected"}ax=aw.args.dateInfo(aG);if(ax&&ax.klass){av[aA++]=" "+ax.klass}av[aA++]="'>"+aF+"</div></td>";aG.setUTCDate(aF+1)}av[aA++]="</tr>"}av[aA++]="</table>";return av.join("")}function n(D){var P=["<table class='DynarchCalendar-topCont'",ah,"><tr><td><div class='DynarchCalendar'>",!j?"<button class='DynarchCalendar-focusLink'></button>":"<a class='DynarchCalendar-focusLink' href='#'></a>","<div class='DynarchCalendar-topBar'><div dyc-type='nav' dyc-btn='-Y' dyc-cls='hover-navBtn,pressed-navBtn' class='DynarchCalendar-navBtn DynarchCalendar-prevYear'><div></div></div><div dyc-type='nav' dyc-btn='+Y' dyc-cls='hover-navBtn,pressed-navBtn' class='DynarchCalendar-navBtn DynarchCalendar-nextYear'><div></div></div><div dyc-type='nav' dyc-btn='-M' dyc-cls='hover-navBtn,pressed-navBtn' class='DynarchCalendar-navBtn DynarchCalendar-prevMonth'><div></div></div><div dyc-type='nav' dyc-btn='+M' dyc-cls='hover-navBtn,pressed-navBtn' class='DynarchCalendar-navBtn DynarchCalendar-nextMonth'><div></div></div><center><table class='DynarchCalendar-titleCont'",ah,"><tr><td><div dyc-type='title' dyc-btn='menu' dyc-cls='hover-title,pressed-title' class='DynarchCalendar-title'>",F(D),"</div></td></tr></table></center><div class='DynarchCalendar-dayNames'>",h(D),"</div></div><div class='DynarchCalendar-body'></div>"];if(D.args.bottomBar||D.args.showTime){P.push("<div class='DynarchCalendar-bottomBar'>",H(D),"</div>")}P.push("<center><div class='DynarchCalendar-menu' style='display: none'>",ak(D),"</div></center><div class='DynarchCalendar-tooltip'></div></div></td></tr></table>");return P.join("")}function F(D){return"<div unselectable='on'>"+ab(D.date,D.args.titleFormat)+"</div>"}function ak(P){var au=["<table height='100%'",ah,"><tr><td><center><table style='margin-top: 1.5em'",ah,"><tr><td colspan='3'><input dyc-btn='year' class='DynarchCalendar-menu-year' size='6' value='",P.date.getUTCFullYear(),"' /></td></tr><tr><td><div dyc-type='menubtn' dyc-cls='hover-navBtn,pressed-navBtn' dyc-btn='today'>",aq("goToday"),"</div></td></tr></table></center><p class='DynarchCalendar-menu-sep'>&nbsp;</p><table class='DynarchCalendar-menu-mtable'",ah,">"],av=aq("mn"),at=0,D=au.length,ar;while(at<12){au[D++]="<tr>";for(ar=4;--ar>0;){au[D++]="<td><div dyc-type='menubtn' dyc-cls='hover-navBtn,pressed-navBtn' dyc-btn='m"+at+"' class='DynarchCalendar-menu-month'>"+av[at++]+"</div></td>"}au[D++]="</tr>"}au[D++]="</table></td></tr></table>";return au.join("")}function w(D,P){P.push("<table class='DynarchCalendar-time' align='right'><tr><td rowspan='2'><div dyc-type='time-hour' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-hour'></div></td><td dyc-type='time-hour+' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-up'></td><td rowspan='2' class='DynarchCalendar-time-sep'></td><td rowspan='2'><div dyc-type='time-min' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-minute'></div></td><td dyc-type='time-min+' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-up'></td>");if(D.args.showTime==12){P.push("<td rowspan='2' class='DynarchCalendar-time-sep'></td><td rowspan='2'><div class='DynarchCalendar-time-am' dyc-type='time-am' dyc-cls='hover-time,pressed-time'></div></td>")}P.push("</tr><tr><td dyc-type='time-hour-' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-down'></td><td dyc-type='time-min-' dyc-cls='hover-time,pressed-time' class='DynarchCalendar-time-down'></td></tr></table>")}function H(D){var ar=[],P=D.args;ar.push("<table",ah," style='width:100%'><tr>");function at(){if(P.showTime){ar.push("<td>");w(D,ar);ar.push("</td>")}}if(P.timePos=="left"){at()}if(P.bottomBar){ar.push("<td>");ar.push("<table",ah,"><tr><td><div dyc-btn='today' dyc-cls='hover-bottomBar-today,pressed-bottomBar-today' dyc-type='bottomBar-today' class='DynarchCalendar-bottomBar-today'>",aq("today"),"</div></td></tr></table>");ar.push("</td>")}if(P.timePos=="right"){at()}ar.push("</tr></table>");return ar.join("")}var r={"DynarchCalendar-topCont":"topCont","DynarchCalendar-focusLink":"focusLink",DynarchCalendar:"main","DynarchCalendar-topBar":"topBar","DynarchCalendar-title":"title","DynarchCalendar-dayNames":"dayNames","DynarchCalendar-body":"body","DynarchCalendar-menu":"menu","DynarchCalendar-menu-year":"yearInput","DynarchCalendar-bottomBar":"bottomBar","DynarchCalendar-tooltip":"tooltip","DynarchCalendar-time-hour":"timeHour","DynarchCalendar-time-minute":"timeMinute","DynarchCalendar-time-am":"timeAM","DynarchCalendar-navBtn DynarchCalendar-prevYear":"navPrevYear","DynarchCalendar-navBtn DynarchCalendar-nextYear":"navNextYear","DynarchCalendar-navBtn DynarchCalendar-prevMonth":"navPrevMonth","DynarchCalendar-navBtn DynarchCalendar-nextMonth":"navNextMonth"};function K(){var ar=G("div"),P=this.els={},D={mousedown:v(I,this,true),mouseup:v(I,this,false),mouseover:v(T,this,true),mouseout:v(T,this,false),keypress:v(L,this)};D[x?"DOMMouseScroll":"mousewheel"]=v(E,this);if(j){D.dblclick=D.mousedown;D.keydown=D.keypress}ar.innerHTML=n(this);t(ar.firstChild,function(au){var at=r[au.className];if(at){P[at]=au}if(j){au.setAttribute("unselectable","on")}});p(P.main,D);p([P.focusLink,P.yearInput],this._focusEvents={focus:v(i,this),blur:v(e,this)});this.moveTo(this.date,false);this.setTime(null,true);return P.topCont}function i(){if(this._bluringTimeout){clearTimeout(this._bluringTimeout)}this.focused=true;M(this.els.main,"DynarchCalendar-focused");this.callHooks("onFocus",this)}function z(){this.focused=false;if (this.args.onBlur && !this.args.onBlur(this))return;aj(this.els.main,"DynarchCalendar-focused");if(this._menuVisible){u(this,false)}if(!this.args.cont){this.hide()}this.callHooks("onBlur",this)}function e(){this._bluringTimeout=setTimeout(v(z,this),50)}function N(D){switch(D){case"time-hour+":this.setUTCHours(this.getUTCHours()+1);break;case"time-hour-":this.setUTCHours(this.getUTCHours()-1);break;case"time-min+":this.setUTCMinutes(this.getUTCMinutes()+this.args.minuteStep);break;case"time-min-":this.setUTCMinutes(this.getUTCMinutes()-this.args.minuteStep);break;default:return}}var U={"-3":"backYear","-2":"back","0":"now","2":"fwd","3":"fwdYear"};function aa(P,at,D){if(this._bodyAnim){this._bodyAnim.stop()}var ar;if(at!=0){ar=new Date(P.date);ar.setUTCDate(1);switch(at){case"-Y":case -2:ar.setUTCFullYear(ar.getUTCFullYear()-1);break;case"+Y":case 2:ar.setUTCFullYear(ar.getUTCFullYear()+1);break;case"-M":case -1:ar.setUTCMonth(ar.getUTCMonth()-1);break;case"+M":case 1:ar.setUTCMonth(ar.getUTCMonth()+1);break}}else{ar=new Date()}return P.moveTo(ar,!D)}function u(ar,P){ar._menuVisible=P;ae(P,ar.els.title,"DynarchCalendar-pressed-title");var at=ar.els.menu;if(c){at.style.height=ar.els.main.offsetHeight+"px"}if(!ar.args.animation){O(at,P);if(ar.focused){ar.focus()}}else{if(ar._menuAnim){ar._menuAnim.stop()}var D=ar.els.main.offsetHeight;if(c){at.style.width=ar.els.topBar.offsetWidth+"px"}if(P){at.firstChild.style.marginTop=-D+"px";ar.args.opacity>0&&am(at,0);O(at,true)}ar._menuAnim=ap({onUpdate:function(au,av){at.firstChild.style.marginTop=av(Z.accel_b(au),-D,0,!P)+"px";ar.args.opacity>0&&am(at,av(Z.accel_b(au),0,0.85,!P))},onStop:function(){ar.args.opacity>0&&am(at,0.85);at.firstChild.style.marginTop="";ar._menuAnim=null;if(!P){O(at,false);if(ar.focused){ar.focus()}}}})}}function I(az,ay){ay=ay||window.event;var au=o(ay);
if(au&&!au.getAttribute("disabled")){
var D=au.getAttribute("dyc-btn"),ax=au.getAttribute("dyc-type"),av=au.getAttribute("dyc-date"),at=this.selection,ar,P={
mouseover:an,mousemove:an,mouseup:function(aC){
var aB=au.getAttribute("dyc-cls");
if(aB){aj(au,ao(aB,1))}clearTimeout(ar);d(document,P,true);P=null}};if(az){setTimeout(v(this.focus,this),1);
var aA=au.getAttribute("dyc-cls");
if(aA){M(au,ao(aA,1))}if("menu"==D){this.toggleMenu()}else{if(au&&/^[+-][MY]$/.test(D)){if(aa(this,D)){var aw=v(function(){if(aa(this,D,true)){ar=setTimeout(aw,40)}else{P.mouseup();aa(this,D)}},this);ar=setTimeout(aw,350);p(document,P,true)}else{P.mouseup()}}else{if("year"==D){this.els.yearInput.focus();this.els.yearInput.select()}else{if(ax=="time-am"){p(document,P,true)}else{if(/^time/.test(ax)){var aw=v(function(aB){N.call(this,aB);ar=setTimeout(aw,100)},this,ax);N.call(this,ax);ar=setTimeout(aw,350);p(document,P,true)}else{if(av&&at.type){if(at.type==y.SEL_MULTIPLE){if(ay.shiftKey&&this._selRangeStart){at.selectRange(this._selRangeStart,av)}else{if(!ay.ctrlKey&&!at.isSelected(av)){at.clear(true)}at.set(av,true);this._selRangeStart=av}}else{at.set(av);this.moveTo(B(av),2)}au=this._getDateDiv(av);T.call(this,true,{target:au})}p(document,P,true)}}}}}if(j&&P&&/dbl/i.test(ay.type)){P.mouseup()}if(!this.args.fixed&&/^(DynarchCalendar-(topBar|bottomBar|weekend|weekNumber|menu(-sep)?))?$/.test(au.className)&&!this.args.cont){P.mousemove=v(g,this);this._mouseDiff=f(ay,J(this.els.topCont));p(document,P,true)}}else{if("today"==D){if(!this._menuVisible&&at.type==y.SEL_SINGLE){at.set(new Date())}this.moveTo(new Date(),true);u(this,false)}else{if(/^m([0-9]+)/.test(D)){var av=new Date(this.date);av.setUTCDate(1);av.setUTCMonth(RegExp.$1);av.setUTCFullYear(this._getInputYear());this.moveTo(av,true);u(this,false)}else{if(ax=="time-am"){this.setUTCHours(this.getUTCHours()+12)}}}}if(!j){an(ay)}}}function g(P){P=P||window.event;var D=this.els.topCont.style,ar=f(P,this._mouseDiff);D.left=ar.x+"px";D.top=ar.y+"px"}function o(P){var D=P.target||P.srcElement,ar=D;
while(D&&D.getAttribute&&!D.getAttribute("dyc-type")){D=D.parentNode}
return D.getAttribute&&D||ar}function ao(D,P){return"DynarchCalendar-"+D.split(/,/)[P]}function T(au,at){at=at||window.event;var ar=o(at);if(ar){
var P=ar.getAttribute("dyc-type");
if(P&&!ar.getAttribute("disabled")){if(!au||!this._bodyAnim||P!="date"){
var D=ar.getAttribute("dyc-cls");
D=D?ao(D,0):"DynarchCalendar-hover-"+P;if(P!="date"||this.selection.type){ae(au,ar,D)}if(P=="date"){ae(au,ar.parentNode.parentNode,"DynarchCalendar-hover-week");
this._showTooltip(ar.getAttribute("dyc-date"))}
if(/^time-hour/.test(P)){ae(au,this.els.timeHour,"DynarchCalendar-hover-time")}if(/^time-min/.test(P)){ae(au,this.els.timeMinute,"DynarchCalendar-hover-time")}aj(this._getDateDiv(this._lastHoverDate),"DynarchCalendar-hover-date");this._lastHoverDate=null}}}if(!au){this._showTooltip()}}function E(ar){ar=ar||window.event;var P=o(ar);if(P){
while (P && jQuery(P).size() && typeof jQuery(P).attr("dyc-type") == "undefined")
	P = jQuery(P).parent().get(0);
if (!P || !jQuery(P).size())
	return;

var at=P.getAttribute("dyc-btn"),D=P.getAttribute("dyc-type"),au=ar.wheelDelta?ar.wheelDelta/120:-ar.detail/3;au=au<0?-1:au>0?1:0;
if(this.args.reverseWheel){au=-au}if(/^(time-(hour|min))/.test(D)){switch(RegExp.$1){case"time-hour":this.setUTCHours(this.getUTCHours()+au);break;case"time-min":this.setUTCMinutes(this.getUTCMinutes()+this.args.minuteStep*au);break}an(ar)}else{if(/Y/i.test(at)){au*=2}aa(this,-au);an(ar)}}}function R(){this.refresh();var D=this.inputField,P=this.selection;if(D){var ar=P.print(this.dateFormat);(/input|textarea/i.test(D.tagName))?D.value=ar:D.innerHTML=ar}this.callHooks("onSelect",this,P)}var ag={37:-1,38:-2,39:1,40:2},Q={33:-1,34:1};function L(aB){if(this._menuAnim){return}aB=aB||window.event;
var ar=aB.target||aB.srcElement,aC=ar.getAttribute("dyc-btn"),aD=aB.keyCode,ay=aB.charCode||aD,D=ag[aD];
if("year"==aC&&aD==13){var au=new Date(this.date);au.setUTCDate(1);au.setUTCFullYear(this._getInputYear());this.moveTo(au,true);u(this,false);return an(aB)}if(this._menuVisible){if(aD==27){u(this,false);return an(aB)}}else{if(!aB.ctrlKey){D=null}if(D==null&&!aB.ctrlKey){D=Q[aD]}if(aD==36){D=0}if(D!=null){aa(this,D);return an(aB)}ay=String.fromCharCode(ay).toLowerCase();var ax=this.els.yearInput,P=this.selection;if(ay==" "){u(this,true);this.focus();ax.focus();ax.select();return an(aB)}if(ay>="0"&&ay<="9"){u(this,true);this.focus();ax.value=ay;ax.focus();return an(aB)}var av=aq("mn"),az=aB.shiftKey?-1:this.date.getUTCMonth(),aw=0,at;while(++aw<12){at=av[(az+aw)%12].toLowerCase();if(at.indexOf(ay)==0){var au=new Date(this.date);au.setUTCDate(1);au.setUTCMonth((az+aw)%12);this.moveTo(au,true);return an(aB)}}if(aD>=37&&aD<=40){var au=this._lastHoverDate;if(!au&&!P.isEmpty()){au=aD<39?P.getFirstDate():P.getLastDate();if(au<this._firstDateVisible||au>this._lastDateVisible){au=null}}if(!au){au=aD<39?this._lastDateVisible:this._firstDateVisible}else{var aA=au;au=B(au);var az=100;while(az-->0){switch(aD){case 37:au.setUTCDate(au.getUTCDate()-1);break;case 38:au.setUTCDate(au.getUTCDate()-7);break;case 39:au.setUTCDate(au.getUTCDate()+1);break;case 40:au.setUTCDate(au.getUTCDate()+7);break}if(!this.isDisabled(au)){break}}au=V(au);if(au<this._firstDateVisible||au>this._lastDateVisible){this.moveTo(au)}}aj(this._getDateDiv(aA),M(this._getDateDiv(au),"DynarchCalendar-hover-date"));this._lastHoverDate=au;return an(aB)}if(aD==13){if(this._lastHoverDate){if(P.type==y.SEL_MULTIPLE&&(aB.shiftKey||aB.ctrlKey)){if(aB.shiftKey&&this._selRangeStart){P.clear(true);P.selectRange(this._selRangeStart,this._lastHoverDate)}if(aB.ctrlKey){P.set(this._selRangeStart=this._lastHoverDate,true)}}else{P.reset(this._selRangeStart=this._lastHoverDate)}return an(aB)}}if(aD==27&&!this.args.cont){this.hide()}}}l._getDateDiv=function(D){var ar=null;if(D){try{t(this.els.body,function(at){
if(at.getAttribute("dyc-date")==D){throw ar=at}})}catch(P){}}return ar};function k(D,P){return D.replace(/\$\{([^:\}]+)(:[^\}]+)?\}/g,function(av,au,at){var aw=P[au],ar;if(at){ar=at.substr(1).split(/\s*\|\s*/);aw=(aw>=ar.length?ar[ar.length-1]:ar[aw]).replace(/##?/g,function(ax){return ax.length==2?"#":aw})}return aw})}function aq(ar,P){var D=q.__.data[ar];if(P&&typeof D=="string"){D=k(D,P)}return D}(y.Selection=function(ar,P,D,at){this.type=P;this.sel=ar instanceof Array?ar:[ar];this.onChange=v(D,at);this.cal=at}).prototype={get:function(){return this.type==y.SEL_SINGLE?this.sel[0]:this.sel},isEmpty:function(){return this.sel.length==0},set:function(P,D,ar){var at=this.type==y.SEL_SINGLE;if(P instanceof Array){this.sel=P;this.normalize();if(!ar){this.onChange(this)}}else{P=V(P);if(at||!this.isSelected(P)){at?this.sel=[P]:this.sel.splice(this.findInsertPos(P),0,P);this.normalize();if(!ar){this.onChange(this)}}else{if(D){this.unselect(P,ar)}}}},reset:function(){this.sel=[];this.set.apply(this,arguments)},countDays:function(){var av=0,D=this.sel,P=D.length,at,au,ar;while(--P>=0){at=D[P];if(at instanceof Array){au=B(at[0]);ar=B(at[1]);av+=Math.round(Math.abs(ar.getTime()-au.getTime())/86400000)}++av}return av},unselect:function(P,ar){P=V(P);var at=false;for(var ay=this.sel,au=ay.length,D;--au>=0;){D=ay[au];if(D instanceof Array){if(P>=D[0]&&P<=D[1]){var av=B(P),ax=av.getUTCDate();if(P==D[0]){av.setUTCDate(ax+1);D[0]=V(av);at=true}else{if(P==D[1]){av.setUTCDate(ax-1);D[1]=V(av);at=true}else{var aw=new Date(av);aw.setUTCDate(ax+1);av.setUTCDate(ax-1);ay.splice(au+1,0,[V(aw),D[1]]);D[1]=V(av);at=true}}}}else{if(P==D){ay.splice(au,1);at=true}}}if(at){this.normalize();if(!ar){this.onChange(this)}}},normalize:function(){this.sel=this.sel.sort(function(ay,ax){if(ay instanceof Array){ay=ay[0]}if(ax instanceof Array){ax=ax[0]}return ay-ax});for(var P=this.sel,ar=P.length,av,au;--ar>=0;){av=P[ar];if(av instanceof Array){if(av[0]>av[1]){P.splice(ar,1);continue}if(av[0]==av[1]){av=P[ar]=av[0]}}if(au){var at=au,aw=av instanceof Array?av[1]:av;aw=B(aw);aw.setUTCDate(aw.getUTCDate()+1);aw=V(aw);if(aw>=at){var D=P[ar+1];if(av instanceof Array&&D instanceof Array){av[1]=D[1];P.splice(ar+1,1)}else{if(av instanceof Array){av[1]=au;P.splice(ar+1,1)}else{if(D instanceof Array){D[0]=av;P.splice(ar,1)}else{P[ar]=[av,D];P.splice(ar+1,1)}}}}}au=av instanceof Array?av[0]:av}},findInsertPos:function(P){for(var D=this.sel,ar=D.length,at;--ar>=0;){at=D[ar];if(at instanceof Array){at=at[0]}if(at<=P){break}}return ar+1},clear:function(D){this.sel=[];if(!D){this.onChange(this)}},selectRange:function(ar,P){ar=V(ar);P=V(P);if(ar>P){var D=ar;ar=P;P=D}this.sel.push([ar,P]);this.normalize();this.onChange(this)},isSelected:function(D){for(var P=this.sel.length,ar;--P>=0;){ar=this.sel[P];if(ar instanceof Array&&D>=ar[0]&&D<=ar[1]||D==ar){return true}}return false},getFirstDate:function(){var D=this.sel[0];if(D&&D instanceof Array){D=D[0]}return D},getLastDate:function(){if(this.sel.length>0){var D=this.sel[this.sel.length-1];if(D&&D instanceof Array){D=D[1]}return D}},print:function(ar,at){var P=[],au=0,aw,av=this.cal.getUTCHours(),D=this.cal.getUTCMinutes();if(!at){at=" -> "}while(au<this.sel.length){aw=this.sel[au++];if(aw instanceof Array){P.push(ab(B(aw[0],av,D),ar)+at+ab(B(aw[1],av,D),ar))}else{P.push(ab(B(aw,av,D),ar))}}return P},getDates:function(P){var D=[],ar=0,au,at;while(ar<this.sel.length){at=this.sel[ar++];if(at instanceof Array){au=B(at[0]);at=at[1];while(V(au)<at){D.push(P?ab(au,P):new Date(au));au.setUTCDate(au.getUTCDate()+1)}}else{au=B(at)}D.push(P?ab(au,P):au)}return D}};function a(P){P=new Date(P.getUTCFullYear(),P.getUTCMonth(),P.getUTCDate(),12,0,0);var ar=P.getDay();P.setUTCDate(P.getUTCDate()-(ar+6)%7+3);var D=P.valueOf();P.setUTCMonth(0);P.setUTCDate(4);return Math.round((D-P.valueOf())/(7*86400000))+1}function C(D){D=new Date(D.getUTCFullYear(),D.getUTCMonth(),D.getUTCDate(),0,0,0);var ar=new Date(D.getUTCFullYear(),0,1,12,0,0);var P=D-ar;return Math.floor(P/86400000)}function V(D){if(D instanceof Date){return 10000*D.getUTCFullYear()+100*(D.getUTCMonth()+1)+D.getUTCDate()}if(typeof D=="string"){return parseInt(D,10)}return D}
function B(ar,au,av,at,P){
if (!(ar instanceof Date)) {
	ar=parseInt(ar,10);
	var aw=Math.floor(ar/10000);
	ar=ar%10000;
	var D=Math.floor(ar/100);
	ar=ar%100;
	ar=new Date(aw,D-1,ar,au||12,av||0,at||0,P||0)
}
return ar
};
function af(aw,au,ar){var av=aw.getUTCFullYear(),ay=aw.getUTCMonth(),P=aw.getUTCDate(),at=au.getUTCFullYear(),ax=au.getUTCMonth(),D=au.getUTCDate();return av<at?-3:av>at?3:ay<ax?-2:ay>ax?2:ar?0:P<D?-1:P>D?1:0}
function ab(D, ax, gm) {
    var P = D.getUTCMonth(),
        aw = D.getUTCDate(),
        ay = D.getUTCFullYear(),
        az = a(D),
        aA = D.getUTCDay(),
        aB = D.getUTCHours(),
        ar = (aB >= 12),
        au = (ar) ? (aB - 12) : aB,
        aD = C(D),
        at = D.getUTCMinutes(),
        av = D.getSeconds(),
        aC = /%./g,
        aE;
    if (au === 0) {
        au = 12
    }
    aE = {
        "%a": aq("sdn")[aA],
        "%A": aq("dn")[aA],
        "%B": aq("mn")[P],
        "%b": aq("smn")[P],
        "%C": 1 + Math.floor(ay / 100),
        "%E": aw < 10 ? "0" + aw : aw,
        "%e": aw,
        "%H": aB < 10 ? "0" + aB : aB,
        "%I": au < 10 ? "0" + au : au,
        "%j": aD < 10 ? "00" + aD : aD < 100 ? "0" + aD : aD,
        "%k": aB,
        "%i": au,
        "%m": P < 9 ? "0" + (1 + P) : 1 + P,
        "%l": 1 + P,
        "%M": at < 10 ? "0" + at : at,
        "%n": "\n",
        "%P": ar ? "PM" : "AM",
        "%p": ar ? "pm" : "am",
        "%s": Math.floor(D.getTime() / 1000),
        "%S": av < 10 ? "0" + av : av,
        "%t": "\t",
        "%U": az < 10 ? "0" + az : az,
        "%W": az < 10 ? "0" + az : az,
        "%V": az < 10 ? "0" + az : az,
        "%u": aA + 1,
        "%w": aA,
        "%y": ("" + ay).substr(2, 2),
        "%Y": ay,
        "%%": "%"
    };
    if (gm) {
	var meta = [];
	// remember patterns
	for (var i in aE) {
		var patt = new RegExp(i, "g");
		while (patt.test(ax) == true) {
			meta.push({type: i, val:""+aE[i], ind: patt.lastIndex-2});
		}
	}

	// if there are no pattern return fake if exists
	if (!meta.length && ax)
		return {res: ax, meta: [{type: "fake", val:ax}]};

	meta.sort(function(a,b){return a.ind - b.ind;});
	// fill fake symbols
	for(var i=0; i<meta.length; i++) {
		if (!i && meta[i].ind > 0)
			meta.splice(i, 0, {type: "fake", val: ax.substring(0, meta[i].ind)});
		if (i == meta.length-1) {
			if ((meta[i].ind + 2) < ax.length)
				meta.splice(meta.length, 0, {type: "fake", val: ax.substring(meta[i].ind + 2)});
		} else {
			var start = meta[i].ind + 2;
			var end = meta[i+1].ind;
			if (start < end) {
				meta.splice(i+1, 0, {type: "fake", val: ax.substring(start, end)});
				i++;
			}
		}
	}
	for (var i=0;i<meta.length; i++)
		delete meta[i].ind

	// replace
	ax = ax.replace(aC, function (aF) {
	    return aE.hasOwnProperty(aF) ? aE[aF] : aF
	});
	return {res: ax, meta: meta};
    } else {
	return ax.replace(aC, function (aF) {
	    return aE.hasOwnProperty(aF) ? aE[aF] : aF
	})
    }
}
function Y(P){if(P){if(typeof P=="number"){return B(P)}if(!(P instanceof Date)){var D=P.split(/-/);return new Date(parseInt(D[0],10),parseInt(D[1],10)-1,parseInt(D[2],10),12,0,0,0)}}return P}function A(ar){ar=ar.toLowerCase();function P(at){for(var au=at.length;--au>=0;){if(at[au].toLowerCase().indexOf(ar)==0){return au}}}var D=P(aq("smn"))||P(aq("mn"));if(D!=null){D++}return D}y.parseDate=function(au,D,aw){if(!/\S/.test(au)){return""}au=au.replace(/^\s+/,"").replace(/\s+$/,"");aw=aw||new Date();var aB=null,P=null,aD=null,av=null,ar=null,aC=null;var ay=au.match(/([0-9]{1,2}):([0-9]{1,2})(:[0-9]{1,2})?\s*(am|pm)?/i);if(ay){av=parseInt(ay[1],10);ar=parseInt(ay[2],10);aC=ay[3]?parseInt(ay[3].substr(1),10):0;au=au.substring(0,ay.index)+au.substr(ay.index+ay[0].length);if(ay[4]){if(ay[4].toLowerCase()=="pm"&&av<12){av+=12}else{if(ay[4].toLowerCase()=="am"&&av>=12){av-=12}}}}var az=au.split(/\W+/);var ax=[];for(var at=0;at<az.length;++at){var aA=az[at];if(/^[0-9]{4}$/.test(aA)){aB=parseInt(aA,10);if(!P&&!aD&&D==null){D=true}}else{if(/^[0-9]{1,2}$/.test(aA)){aA=parseInt(aA,10);if(aA>=60){aB=aA}else{if(aA>=0&&aA<=12){ax.push(aA)}else{if(aA>=1&&aA<=31){aD=aA}}}}else{P=A(aA)}}}if(ax.length>=2){if(D){if(!P){P=ax.shift()}if(!aD){aD=ax.shift()}}else{if(!aD){aD=ax.shift()}if(!P){P=ax.shift()}}}else{if(ax.length==1){if(!aD){aD=ax.shift()}else{if(!P){P=ax.shift()}}}}if(!aB){aB=ax.length>0?ax.shift():aw.getUTCFullYear()}if(aB<30){aB+=2000}else{if(aB<99){aB+=1900}}if(!P){P=aw.getUTCMonth()+1}return aB&&P&&aD?new Date(aB,P-1,aD,av,ar,aC):null};function al(D,at,P,ar){ar={};for(P in at){if(at.hasOwnProperty(P)){ar[P]=at[P]}}for(P in D){if(D.hasOwnProperty(P)){ar[P]=D[P]}}return ar}function p(ar,au,at,D){if(ar instanceof Array){for(var P=ar.length;--P>=0;){p(ar[P],au,at,D)}}else{if(typeof au=="object"){for(var P in au){if(au.hasOwnProperty(P)){p(ar,P,au[P],at)}}}else{if(ar.addEventListener){ar.addEventListener(au,at,j?true:!!D)}else{if(ar.attachEvent){ar.attachEvent("on"+au,at)}else{ar["on"+au]=at}}}}}function d(ar,au,at,D){if(ar instanceof Array){for(var P=ar.length;--P>=0;){d(ar[P],au,at)}}else{if(typeof au=="object"){for(var P in au){if(au.hasOwnProperty(P)){d(ar,P,au[P],at)}}}else{if(ar.removeEventListener){ar.removeEventListener(au,at,j?true:!!D)}else{if(ar.detachEvent){ar.detachEvent("on"+au,at)}else{ar["on"+au]=null}}}}}function an(D){D=D||window.event;if(j){D.cancelBubble=true;D.returnValue=false}else{D.preventDefault();D.stopPropagation()}return false}function aj(au,at,av){if(au){var D=au.className.replace(/^\s+|\s+$/,"").split(/\x20/),P=[],ar;for(ar=D.length;ar>0;){if(D[--ar]!=at){P.push(D[ar])}}if(av){P.push(av)}au.className=P.join(" ")}return av}function M(P,D){return aj(P,D,D)}function ae(at,ar,P){if(ar instanceof Array){for(var D=ar.length;--D>=0;){ae(at,ar[D],P)}}else{aj(ar,P,at?P:null)}return at}function G(at,D,ar){var P=null;if(document.createElementNS){P=document.createElementNS("http://www.w3.org/1999/xhtml",at)}else{P=document.createElement(at)}if(D){P.className=D}if(ar){ar.appendChild(P)}return P}function b(au,av){if(av==null){av=0}var D,at,P;try{D=Array.prototype.slice.call(au,av)}catch(ar){D=new Array(au.length-av);for(at=av,P=0;at<au.length;++at,++P){D[P]=au[at]}}return D}function v(P,ar){var D=b(arguments,2);return(ar==undefined?function(){return P.apply(this,D.concat(b(arguments)))}:function(){return P.apply(ar,D.concat(b(arguments)))})}function t(P,ar){if(!ar(P)){for(var D=P.firstChild;D;D=D.nextSibling){if(D.nodeType==1){t(D,ar)}}}}function ap(D,aw,ar){D=al(D,{fps:50,len:15,onUpdate:ad,onStop:ad});if(j){D.len=Math.round(D.len/2)}function at(aA,az,ax,ay){return ay?ax+aA*(az-ax):az+aA*(ax-az)}function av(){if(aw){P()}ar=0;aw=setInterval(au,1000/D.fps)}function P(){if(aw){clearInterval(aw);aw=null}D.onStop(ar/D.len,at)}function au(){var ax=D.len;D.onUpdate(ar/ax,at);if(ar==ax){P()}++ar}av();return{start:av,stop:P,update:au,args:D,map:at}}var Z={elastic_b:function(D){return 1-Math.cos(-D*5.5*Math.PI)/Math.pow(2,7*D)},magnetic:function(D){return 1-Math.cos(D*D*D*10.5*Math.PI)/Math.exp(4*D)},accel_b:function(D){D=1-D;return 1-D*D*D*D},accel_a:function(D){return D*D*D},accel_ab:function(D){D=1-D;return 1-Math.sin(D*D*Math.PI/2)},accel_ab2:function(D){return(D/=0.5)<1?1/2*D*D:-1/2*((--D)*(D-2)-1)},brakes:function(D){D=1-D;return 1-Math.sin(D*D*Math.PI)},shake:function(D){return D<0.5?-Math.cos(D*11*Math.PI)*D*D:(D=1-D,Math.cos(D*11*Math.PI)*D*D)}};function am(D,P){if(P===""){j?D.style.filter="":D.style.opacity=""}else{if(P!=null){j?D.style.filter="alpha(opacity="+P*100+")":D.style.opacity=P}else{if(!j){P=parseFloat(D.style.opacity)}else{if(/alpha\(opacity=([0-9.])+\)/.test(D.style.opacity)){P=parseFloat(RegExp.$1)/100}}}}return P}function O(ar,D){var P=ar.style;if(D!=null){P.display=D?"":"none"}return P.display!="none"}function f(P,ar){var D=j?P.clientX+document.body.scrollLeft:P.pageX;var at=j?P.clientY+document.body.scrollTop:P.pageY;if(ar){D-=ar.x;at-=ar.y}return{x:D,y:at}}function J(au){var D=0,at=0,ar=/^div$/i.test(au.tagName),av,P;if(ar&&au.scrollLeft){D=au.scrollLeft}if(ar&&au.scrollTop){at=au.scrollTop}av={x:au.offsetLeft-D,y:au.offsetTop-at};if(au.offsetParent){P=J(au.offsetParent);av.x+=P.x;av.y+=P.y}return av}function X(){var P=document.documentElement,D=document.body;return{x:P.scrollLeft||D.scrollLeft,y:P.scrollTop||D.scrollTop,w:P.clientWidth||window.innerWidth||D.clientWidth,h:P.clientHeight||window.innerHeight||D.clientHeight}}function m(D,ar,P){for(P=0;P<D.length;++P){ar(D[P])}}var ad=new Function();function W(D){if(typeof D=="string"){D=document.getElementById(D)}return D}return y})();

// Calendar.LANG("ru", "русский", {

//         fdow: 1,                // first day of week for this locale; 0 = Sunday, 1 = Monday, etc.
//         goToday: "Сегодня",
//         today: "Сегодня",         // appears in bottom bar
//         wk: "",
//         weekend: "0,6",         // 0 = Sunday, 1 = Monday, etc.
//         AM: "am",
//         PM: "pm",
//         mn :  [ "Январь",
//                 "Февраль",
//                 "Март",
//                 "Апрель",
//                 "Май",
//                 "Июнь",
//                 "Июль",
//                 "Август",
//                 "Сентябрь",
//                 "Октябрь",
//                 "Ноябрь",
//                 "Декабрь" ],
//         smn : [ "Янв",
//                "Фев",
//                "Мар",
//                "Апр",
//                "Май",
//                "Июн",
//                "Июл",
//                "Авг",
//                "Сен",
//                "Окт",
//                "Ноя",
//                "Дек" ],
//         dn : [ "Воскресенье",
//                "Понедельник",
//                "Вторник",
//                "Среда",
//                "Четверг",
//                "Пятница",
//                "Суббота",
//                "Воскресенье" ],

//         sdn : [ "Вс",
//                 "Пн",
//                 "Вт",
//                 "Ср",
//                 "Чт",
//                 "Пт",
//                 "Сб",
//                 "Вс" ]
// }
// );
Calendar.LANG("en", "English", {

        fdow: 1,                // first day of week for this locale; 0 = Sunday, 1 = Monday, etc.

        goToday: "Go Today",

        today: "Today",         // appears in bottom bar

        wk: "",

        weekend: "0,6",         // 0 = Sunday, 1 = Monday, etc.

        AM: "am",

        PM: "pm",

        mn : [ "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December" ],

        smn : [ "Jan",
               "Feb",
               "Mar",
               "Apr",
               "May",
               "Jun",
               "Jul",
               "Aug",
               "Sep",
               "Oct",
               "Nov",
               "Dec" ],

        dn : [ "Sunday",
               "Monday",
               "Tuesday",
               "Wednesday",
               "Thursday",
               "Friday",
               "Saturday",
               "Sunday" ],

        sdn : [ "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun" ]

});




DateInput = (function($) {
 // Localise the $ function

$.fn.getDateTime = function() {

	var date;
	this.each(function() {

		for(i = 0 ; i < DateInput.col.length; i++) {

			obj = DateInput.col[i];
			if(obj.input[0].id == this.id) {

				date = obj.getDateTime();
				return date;
			}

		}

		return null;
	}
);
	return date;
}
;

$.fn.getDateTimeLoc = function(calendar) {
	calendar = calendar ? calendar : jQuery(this).get(0).calendar;
	if (!calendar)
		return 0;
	var val = calendar.selection.get();
	var date = intToDate(val, calendar.getUTCHours(), calendar.getUTCMinutes());
	date = parseInt(date.getTime() / 1000);
	if ((calendar.dep_down && !jQuery(calendar.dep_down).attr("disabled")) ||
		(calendar.dep_up && !jQuery(calendar.dep_up).attr("disabled"))) {
		var sec_calendar = jQuery(calendar.dep_down ? calendar.dep_down : calendar.dep_up).get(0).calendar;
		if (sec_calendar) {
			var sec_val = sec_calendar.selection.get();
			var sec_date = intToDate(sec_val, sec_calendar.getUTCHours(), sec_calendar.getUTCMinutes());
			sec_date = parseInt(sec_date.getTime() / 1000);
			if ((calendar.dep_down && date > sec_date) || (calendar.dep_up && date < sec_date))
				date = sec_date;
		}
	}
	return date;
};


$.fn.getDateTimeAbs = function() {
	if (!jQuery(this).get(0))
		return 0;
	var calendar = jQuery(this).get(0).calendar;
	if (!calendar)
		return 0;
	var val = calendar.selection.get();
	var date = intToDate(val, calendar.getUTCHours(), calendar.getUTCMinutes());
	date = parseInt(date.getTime() / 1000);
	if ((calendar.dep_down && !jQuery(calendar.dep_down).attr("disabled")) ||
		(calendar.dep_up && !jQuery(calendar.dep_up).attr("disabled"))) {
		var sec_calendar = jQuery(calendar.dep_down ? calendar.dep_down : calendar.dep_up).get(0).calendar;
		if (sec_calendar) {
			var sec_val = sec_calendar.selection.get();
			var sec_date = intToDate(sec_val, sec_calendar.getUTCHours(), sec_calendar.getUTCMinutes());
			sec_date = parseInt(sec_date.getTime() / 1000);
			if ((calendar.dep_down && date > sec_date) || (calendar.dep_up && date < sec_date))
				date = sec_date;
		}
	}
	return wialon.util.DateTime.absoluteTime(date);
};

$.fn.setDateTimeLoc = function(date) {
	var date = new Date(date * 1000);
	return this.each(function() {

		var calendar = jQuery(this).get(0).calendar;
		if (!calendar)
			return;

		calendar.selection.set(Calendar.dateToInt(date));
		calendar.setTime(date.getUTCHours() * 100 + date.getUTCMinutes());
		jQuery(this).val(Calendar.printDate(date, calendar.args.dateFormat));
		calendar.moveTo(fixDate(date), true);
	});
};
$.fn.setDateTimeAbs = function(date) {
	date =  wialon.util.DateTime.userTime(date);
	var date = new Date(date * 1000);
	return this.each(function() {
		var calendar = jQuery(this).get(0).calendar;
		if (!calendar)
			return;

		calendar.selection.set(Calendar.dateToInt(date));
		calendar.setTime(date.getUTCHours() * 100 + date.getUTCMinutes());
		jQuery(this).val(Calendar.printDate(date, calendar.args.dateFormat));
		calendar.moveTo(fixDate(date), true);
	});
};

$.fn.date_input = function(opts) {
	return this.each(function() {
		var calendar = jQuery(this).get(0).calendar;
		// check calendar exists
		if (!calendar) {
			// if (opts.lang != "ru" && opts.lang != "en")
			// 	opts.lang = "en";

			calendar = Calendar.setup({
				animation: false,
				inputField: this,
				weekNumbers: true,
        		showTime: opts.showTime ? opts.showTime : 24,
        		minuteStep: 1,
				fixed: 1,
        		lang: opts.lang,
        		min: new Date().setUTC(1971, 0, 1, 0, 0, 0, 0),
        		max: new Date().setUTC(2038, 0, 18, 0, 0, 0, 0),
        		dateFormat: opts.format ? opts.format : "%e %b %Y %H:%M",
        		onSelect: function() {
        			var val = this.selection.get();
        			var date = intToDate(val, this.getUTCHours(), this.getUTCMinutes());
        			jQuery(this.args.inputField).val(Calendar.printDate(date, this.args.dateFormat)).trigger("change");
        			if (!this.edit)
        				this.hide();
					jQuery(this.args.inputField).trigger("change");
				},
				onTimeChange: function() {
					var val = this.selection.get();
        			var date = intToDate(val, this.getUTCHours(), this.getUTCMinutes());
        			jQuery(this.args.inputField).val(Calendar.printDate(date, this.args.dateFormat)).trigger("change");

        		},
        		onChange: function(p) {
				},
				onBlur: function(p) {
					return !jQuery(p.args.inputField).get(0).focused;
				}
			});
			calendar.setLanguage(opts.lang);
			jQuery(this).get(0).calendar = calendar;
			jQuery(this).css("font-family", "Arial");
			jQuery(this).css("font-size", "13px");
			jQuery(this).click(function(event) {
				if (jQuery(this).attr("disabled"))
					return;
				var calendar = jQuery(this).get(0).calendar;
				if (!calendar)
					return;
				if (calendar.opened) {
					var height = parseInt(jQuery(this).css("height"));
					if (isNaN(height))
						height = jQuery(this).height() - 3;
					var x_shift = event.clientX - jQuery(this).offset().left;
					var aspect = 0.4;
					var total_w = jQuery(this).val().length * height * aspect;
					if (x_shift > total_w + 10) {
						calendar.hide();
						return;
					}
				}
				jQuery(this).get(0).clicked = true;
				calendar.popup(this);
				calendar.opened = true;
				jQuery(this).get(0).focused = true;
				jQuery(this).focus();
				jQuery(this).get(0).clicked = false;
				calendar.focused = true;
				var height = parseInt(jQuery(this).css("height"));

				if (!isNaN(height)) {
					var node_ofset = jQuery(event.target).offset(),
						node_top = node_ofset ? node_ofset.top + jQuery(event.target).height() + 4 : undefined,
						offset = event.clientY + height;
					jQuery(".DynarchCalendar-topCont").each(function() {
					    var display = jQuery(this).css("display");
					    if (display != "none")
						    jQuery(this).css({top: (node_top == undefined ? offset : node_top-height-jQuery(this).height()) + "px"});
					});
				}
			});

			var change_value_handler = function() {
				if (jQuery(this).attr("disabled"))
					return;
				if (jQuery(this).get(0).time_check)
					clearTimeout(jQuery(this).get(0).time_check);
				var mod = this;
				jQuery(this).get(0).time_check = setTimeout(function() {
					var calendar = jQuery(mod).get(0).calendar;
					if (!calendar)
						return;
					var cursor_pos = getCaretPos(jQuery(mod).get(0));

					// get array with all patterns used in time mask
					var format = calendar.args.dateFormat;
					var curr_date = new Date(jQuery(this).getDateTimeLoc(calendar)*1000);
					var parts = Calendar.printDate(curr_date,format, true).meta;
					if (!parts)
						return;

					var val = jQuery(mod).val();
					var i18n = Calendar.I18N[calendar.args.lang].data;
					//function that converts input data to UTC value for current element of date
					var get_val = function(str) {
						if (!this.type)
							return;
						if (this.arr)
							this.type.push(this.arr.indexOf(str));
						else if (this.h_12){
							var index = format_patterns.indexOf("%p");
							var h = values[index];
							h = h ? h : "am";
							var val = parseInt(str,10);
							this.type.push(h == "am" ? (val == 12 ? 0 : val) : (val == 12 ? val : 12 + val));
						} else if (this.reg == "(\\d\\d)") {
							var year = parseInt(str,10);
							year = year >70 ? "19" : "20";
							year += str;
							this.type.push(parseInt(year,10));
						} else if (this.min1)
							this.type.push(parseInt(str,10)-1);
						else
							this.type.push(parseInt(str,10));
					};
					var w_day = [];
					var day = [];
					var month = [];
					var year = [];
					var hour = [];
					var minute = [];
					// object with info about type and calculation metod of current part of mask
					var patterns = {
						"%A"	: {"reg":"([A-ZА-Я][a-zа-я]+)", "arr":i18n.dn, "func": get_val, "type": w_day},
						"%a"	: {"reg":"([A-ZА-Я][a-zа-я]+)", "arr":i18n.sdn, "func": get_val, "type": w_day},
						"%E"	: {"reg":"(0[1-9]|[12]\\d|3[0-1])", "func": get_val, "type": day},
						"%e" 	: {"reg":"([1-9]|[12]\\d|3[0-1])", "func": get_val, "type": day},
						"%I"	: {"reg":"(0[1-9]|1[0-2])", "func": get_val, "type": hour, "h_12": true},
						"%M"	: {"reg":"([0-5]\\d)", "func": get_val, "type": minute},
						"%S"	: {"reg":"([0-5]\\d)", "func": get_val},
						"%p"	: {"reg":"(am|pm)", "func": get_val},
						"%Y"	: {"reg":"(197[1-9]|19[89]\\d|20[0-2]\\d|203[0-7])", "func": get_val, "type": year},
						"%y" 	: {"reg":"(\\d\\d)", "func": get_val, "type": year},
						"%H"	: {"reg":"(0\\d|1\\d|2[0-3])", "func": get_val, "type": hour},
						"%B"	: {"reg":"([A-ZА-Я][a-zа-я]+)", "arr":i18n.mn, "func": get_val, "type": month},
						"%b"	: {"reg":"([A-ZА-Я][a-zа-я]+)", "arr":i18n.smn, "func": get_val, "type": month},
						"%m"	: {"reg":"(0[1-9]|1[0-2])", "func": get_val, "type": month, "min1": true},
						"%l" 	: {"reg":"([1-9]|1[0-2])", "func": get_val, "type": month, "min1": true}
					};
					// validate by RegExp
					var reg_exp = format.replace(/\//g, "\\/");
					for (var i in patterns)
						reg_exp = reg_exp.replace(new RegExp(i, "g"), patterns[i].reg);
					var values = (new RegExp(reg_exp, "g")).exec(val);
					if (values === null) {
						jQuery(mod).addClass("incorrect-time");
						jQuery(mod).trigger("time_validation", true);
						return;
					}

					// compare values if current pattern used more then one time
					values.splice(0, 1);
					var format_patterns = [];
					for (var i=0; i<parts.length; i++)
						if (parts[i].type != "fake")
							format_patterns.push(parts[i].type);
					for (var i=0; i<format_patterns.length; i++)
						patterns[format_patterns[i]].func(values[i]);
					var values = [w_day,day,month,year,hour,minute];
					for (var i=0; i<values.length; i++) {
						var first = values[i][0];
						for(var j=0;j<values[i].length; j++) {
							if (first != values[i][j]) {
								jQuery(mod).addClass("incorrect-time");
								jQuery(mod).trigger("time_validation", true);
								return;
							}
						}
					}

					w_day = w_day.length ? w_day[0] : -2;
					day = day.length ? day[0] : curr_date.getUTCDate();
					month = month.length ? month[0] : curr_date.getUTCMonth();
					year = year.length ? year[0] : curr_date.getUTCFullYear();
					hour = hour.length ? hour[0] : curr_date.getUTCHours();
					minute = minute.length ? minute[0] : curr_date.getUTCMinutes();
					if (w_day == -1 || month == -1) {
						jQuery(mod).addClass("incorrect-time");
							jQuery(mod).trigger("time_validation", true);
							return;
					}

					// apply new date
					if (year >= 1971 && year < 2038 && month >= 0 && day >= 1 && hour >=0 && hour < 24 && minute >=0 && minute < 60) {
						var date = new Date();
						date.setUTC(year, month, day, hour, minute, 0 , 0);
						if (w_day != -2 && date.getUTCDay() != w_day) {
							jQuery(mod).addClass("incorrect-time");
							jQuery(mod).trigger("time_validation", true);
							return;
						}
						if (date.getTime() == curr_date.getTime()) {
							jQuery(mod).removeClass("incorrect-time");
							jQuery(mod).trigger("time_validation", false);
							return;
						}
						calendar.edit = true;
						calendar.selection.set(Calendar.dateToInt(date));
						calendar.edit = false;
						calendar.setTime(date.getUTCHours() * 100 + date.getUTCMinutes());
						calendar.moveTo(fixDate(date), true);
						jQuery(this).trigger("change");
						setCaretPos(jQuery(mod).get(0), cursor_pos);
						jQuery(mod).removeClass("incorrect-time");
						jQuery(mod).trigger("time_validation", false);
					}
				}, 1000);
			};
			jQuery(this).keyup(change_value_handler);
			jQuery(this).change(change_value_handler);
		}
		jQuery(this).keydown(function(evt) {
			if (jQuery(this).attr("disabled"))
				return;
			if (evt.which == 13 || evt.keyCode == 13 || evt.which == 27 || evt.keyCode == 27) {
				var calendar = jQuery(this).get(0).calendar;
				if (!calendar)
					return;
				calendar.hide();
			}
		});
		jQuery(this).mousewheel(function(event, delta) {
			if (jQuery(this).attr("disabled") || jQuery(this).hasClass("incorrect-time"))
				return;
			event.stopPropagation();
			event.preventDefault();
			var cursor_pos = getCaretPos(jQuery(this).get(0));
			var calendar = jQuery(this).get(0).calendar;
			if (!calendar)
				return;
			// value diff on scroll
			if (delta > 0)
				delta = 1;
			else
				delta = -1;
			// add or clear hidden field
			if (!jQuery("#datetime_text").size())
				jQuery("body").append("<div id='datetime_text' style='display:none; padding-left: 2px; font-family: Arial; font-size: 12px;'/>");
			else
				jQuery("#datetime_text").html("");
			// get array with meta info about formatted date string; [{val:string, len: int}] val-type of data, len-length of data
			var curr_date = new Date(jQuery(this).getDateTimeLoc()*1000);
			var parts = Calendar.printDate(curr_date,calendar.args.dateFormat, true).meta;
			if (!parts)
				return;
			// cursor position
			var x_shift = event.clientX - jQuery(this).offset().left - parseInt(jQuery(this).css('padding-left'));
			x_shift = x_shift<0?0:x_shift;

			// find type of changed value
			var start_index = 0;
			if (parts[0].type.indexOf("%") == -1) {
				jQuery("#datetime_text").html(parts[0].val);
				start_index++;
			}
			var type_changed = "";
			for(var i=start_index; i<parts.length; i++) {
				if (parts[i].type.indexOf("%") == -1)
					continue;
				var html = jQuery("#datetime_text").html() + parts[i].val;
				if (parts[i+1] && parts[i+1].type.indexOf("%") == -1)
					html += parts[i+1].val;
				jQuery("#datetime_text").html(html);
				var width = jQuery("#datetime_text").width();
				if (width >= x_shift) {
					type_changed = parts[i].type;
					break;
				}
			}
			type_changed = type_changed ? type_changed : "%M";

			// find old values and change them
			var day = curr_date.getUTCDate();
			var month = curr_date.getUTCMonth();
			var year = curr_date.getUTCFullYear();
			var hour = curr_date.getUTCHours();
			var minute = curr_date.getUTCMinutes();
			if (/%A|%a|%E|%e/g.test(type_changed))
				day += delta;
			else if (/%B|%b|%m|%l/g.test(type_changed))
				month += delta;
			else if (/%Y|%y/g.test(type_changed))
				year += delta;
			else if (/%H|%I/g.test(type_changed))
				hour += delta;
			else if (/%M/g.test(type_changed))
				minute += delta;
			else if (/%p/g.test(type_changed))
				hour = hour>11 ? hour - 12 : hour + 12;

			// set new date
			var date = new Date();
			date.setUTC(year, month, day, hour, minute, 0 , 0);
			if (date.getUTCFullYear() >= 1971 && date.getUTCFullYear() < 2038) {
				calendar.edit = true;
				calendar.selection.set(Calendar.dateToInt(date));
				calendar.edit = false;
				calendar.setTime(date.getUTCHours() * 100 + date.getUTCMinutes());
				calendar.moveTo(fixDate(date), true);
				jQuery(this).trigger("change");
			}
			setCaretPos(jQuery(this).get(0), cursor_pos);
		});
		jQuery(this).focus(function() {
			jQuery(this).get(0).focused = true;
			if (jQuery(this).get(0).clicked)
				return;
		});
		jQuery(this).blur(function() {
			if (jQuery(this).get(0).clicked)
				return;
			var elem = jQuery(this).get(0);
			elem.focused = false;
			var calendar = elem.calendar;
			if (!calendar)
				return;
			if (elem.time_blur)
				clearTimeout(elem.time_blur);

			elem.time_blur = setTimeout(function() {
				if (!calendar.focused && !elem.focused)
					calendar.hide();
				}, 100);
		});
	// check dependencies
	if (opts.dependencyDown) {
		var dep = jQuery("#" + opts.dependencyDown);
		if (!dep.size())
			return;
		calendar.dep_down = dep.get(0);
	} else if (opts.dependencyUp) {
		var dep = jQuery("#" + opts.dependencyUp);
		if (!dep.size())
			return;
		calendar.dep_up = dep.get(0);
		}
	});
};
}
)(jQuery); // End localisation of the $ function
