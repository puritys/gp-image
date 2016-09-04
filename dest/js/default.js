(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
(function() {

    var lib = {
        parseUrl: function(url) {//{{{
            var regUrl, matches, ret, param = {};
            // (https) (host) (port) (path) (param)
            regUrl = /(https?):\/\/([a-z0-9][a-z0-9\-\.]+[a-z0-9])(:[0-9]+)?(\/[^\?]*)?\??(.*)/i;
            ret = {
                port: 80,
                protocol: "",
                host: "",
                path: "",
                param: ""
            };
            matches = url.match(regUrl);
            if (matches && matches[2]) {
                ret['protocol'] = matches[1].toLowerCase();
                ret['host'] = matches[2];
            }

            if (matches && matches[3] && matches[3] != "undefined") {
                ret['port'] = parseInt(matches[3].substr(1), 10);
            } else {
                if ("https" === ret.protocol) {
                    ret['port'] = 443;
                }
            }

            if (matches && !matches[4]) {
                ret['path'] = "/";
            } else {
                ret['path'] = matches[4];
            }

            if (matches && matches[5]) {
                ret['param'] = this.stringToParam(matches[5]);
            }

            return ret;
        },//}}}

        stringifyParam: function(param)
        {//{{{
            var ret = [];
            for (var pro in param) {
                this.paramToString(ret, pro, param[pro]);
            }
            return ret.join('&');
        },//}}}

        paramToString: function (ret, key, value) 
        {//{{{
            var i, n, k;
            if (value instanceof Array) {
                n = value.length;
                for (i = 0; i < n; i++) {
                    this.paramToString(ret, key + "["+i+"]", value[i]);
                }
            } else if (value instanceof Object) {
                for (k in value) {
                    this.paramToString(ret, key + "["+k+"]", value[k]);
                }
            } else {
                ret.push(key + "=" + encodeURIComponent(value));
            }
        },//}}}

        stringToParam: function (string) 
        {//{{{
            var pm, i, n, value, pos, key, param = {};
            pm = string.split(/&/);
            n = pm.length;
            for (i = 0; i < n; i++) {
                pos = pm[i].indexOf("=");
                key = pm[i].substr(0, pos);
                value = pm[i].substr(pos + 1, pm[i].length - pos - 1);
                value = decodeURIComponent(value);
                if (param[key]) {
                    if (Object.prototype.toString.call(param[key]) === '[object Array]') {
                        param[key].push(value);
                    } else {
                        param[key] = [param[key], value];
                    }
                } else {
                    param[key] = value;
                }
            }
            return param;
        },//}}}


        addParams: function (url, params) 
        {//{{{
            var paramStr, matches, urlParam;
            if (!url) return "";
            if (!params) params = {};
            if (url.indexOf('#') != -1) {
                url = url.replace(/\#.*/, '');
            }
            matches = url.match(/\?(.+)/);
            if (matches && matches[1]) {
                urlParam = this.stringToParam(matches[1]);
                if (urlParam) {
                    params = this.mergeTwoParamters(urlParam, params);
                    url = url.replace(/\?.+/, '');
                }
            }
            paramStr = this.stringifyParam(params);
            if (!paramStr) return url;
            if (url.match(/\?/)) {
                url += "&";
            } else {
                url += "?";
            }
            url += paramStr;
            return url;
        },//}}}

        cookieToString: function (cookies)
        {
            var str = [], key;
            if (cookies instanceof Array) {
                return cookies.join('; ');
            } else {
                for (key in cookies) {
                    str.push(key + '=' + cookies[key]);
                }
            }
            return str.join('; ');
        },
        mergeTwoParamters: function (obj1, obj2)
        {//{{{
            var obj3 = {}, attrname;
            for (attrname in obj1) { obj3[attrname] = obj1[attrname]; }
            for (attrname in obj2) { obj3[attrname] = obj2[attrname]; }
            return obj3;
        }//}}}

    };

    module = module.exports = lib;
}());



},{}],2:[function(require,module,exports){
/* globals FormData */
/*
 *
 * */
"use strict";
Function.prototype.bind=Function.prototype.bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}var a=Array.prototype.slice,f=a.call(arguments,1),e=this,c=function(){},d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};


(function () {
/****
* obj.ajax("testGet", {"test":1}, function (content) {});
* obj.ajaxPost("testPost.php", {"test": 1, "test2": 2},{}, function (content) {});

//Redirect to another url.
* obj.get("testGet", {"test":1}); 
* obj.post("testPost.php", {"test":1});

*****/
    var lib = require('./lib.js');
    //var Q = require('q');


    function lightHttp() {//{{{
        if (!lib) {
            console.log("Missing library named lightHttpLib");
        }
        this.jsonpIndex   = 1;
        this.lightHttpLib = lib; //window.lightHttpLib;
        this.timeout      = 15000; //15 seconds
        this.jsonpCallbackList = {};
        this.uploadFiles  = [];
    }//}}}

    var o = lightHttp.prototype;
    o.uploadFiles = [];

    o.addFile = function (field, input) 
    {//{{{
        if (!input) {
            return false;
        }
        this.uploadFiles.push({
            field: field,
            input: input
        });
    };//}}}

    o.clear = function ()
    {//{{{
        this.uploadFiles = [];
    };//}}}

    o.composeFormData = function (uploadFiles, param)
    {//{{{
        var f, i ,n, it, key;
        f = new FormData();
        n = uploadFiles.length;
        for (i = 0; i < n; i++) {
            it = uploadFiles[i];
            f.append(it.field, it.input.files[0]);
        }
        for (key in param) {
            this.paramToFormData(f, key, param[key]);
        }
        return f;
    };//}}}

    o.paramToFormData = function (formData, key ,value, isHtmlForm)
    {//{{{
        var i ,n, k;
        if (value instanceof Array) {
            n = value.length;
            for (i = 0; i < n; i++) {
                this.paramToFormData(formData, key + "["+i+"]", value[i], isHtmlForm);
            }
        } else if (value instanceof Object) {
            for (k in value) {
                this.paramToFormData(formData, key+"["+k+"]", value[k], isHtmlForm);
            }
        } else {
            if (isHtmlForm) {
                var input = document.createElement('input');
                input.name  = key;
                input.value = value;
                formData.appendChild(input);
            } else {
                formData.append(key, value);
            }
        }
    };//}}}

    o.get = function (url, param) 
    {//{{{
        url = this.lightHttpLib.addParams(url, param);
        window.location.href = url;
    };//}}}

    o.post = function (url, param)
    {//{{{
        var form, key, input, isHtmlForm;
        isHtmlForm = true;
        form = document.createElement('form');
        form.action = url;
        form.method = "POST";
        for (key in param) {
            if (!param.hasOwnProperty(key)) continue;
            this.paramToFormData(form, key, param[key], isHtmlForm);
        }
        document.body.appendChild(form);
        form.submit();
        return form;
    };//}}}

    /**
     * ajax: make a ajax request
     * @param string url
     * @param object param
     * @param object header
     * @param function callback
     */
    o.ajax = function ()
    {//{{{
        var args = ["ajax", "GET"];
        for (var i = 0, len = arguments.length; i< len; i++) args.push(arguments[i]);
        return this.request.apply(this, args);
    };//}}}

    o.ajaxpost = o.ajaxPost = function ()
    {//{{{
        var args = ["ajaxPost", "POST"];
        for (var i = 0, len = arguments.length; i< len; i++) args.push(arguments[i]);
        return this.request.apply(this, args);
    };//}}}

    o.pajax = function () 
    {//{{{
        var args = ["pjax", "GET"];
        for (var i = 0, len = arguments.length; i< len; i++) args.push(arguments[i]);
        return this.request.apply(this, args);
    };//}}}

    o.jsonp = function (url, param, header, callback)
    {//{{{
        var script, jsonpCallback, self;
        self = this;
        if (!param) param = {};
        if (typeof(header) == "function") callback = header;
        this.cleanJsonpCallback();

        // Handle JSONP callback.
        jsonpCallback = "lightHttp_jsonp_" + this.jsonpIndex + "_" + (new Date()).getTime();
        param['callback'] = jsonpCallback;
        this.jsonpCallbackList[jsonpCallback] = 0;
        window[jsonpCallback] = function(data) {
            callback(data, {});
            self.jsonpCallbackList[jsonpCallback] = 1;
        };

        // Make the request.
        url = this.lightHttpLib.addParams(url, param);
        script = document.createElement('script');
        script.src = url;
        document.body.appendChild(script);
        this.jsonpIndex++;
    };//}}}

    /*
     * name, type, url, param, header, callback
    */
    o.request = function () 
    {//{{{
        var type = "GET", xhr, url, param, header, name,
            callback, postData = "", async = true, 
            defer, isPromise = false, formData,
            options = {}, args = {};
        var respHandler, timeoutHandler;
        // Handle Arguments
        if (!arguments) return "";
        if (typeof(arguments[0]) != "undefined") name = arguments[0];
        if (typeof(arguments[1]) != "undefined") type = arguments[1];
        if (typeof(arguments[2]) != "undefined") url = arguments[2];
        if (typeof(arguments[3]) != "undefined") param = arguments[3];
        if (typeof(arguments[4]) != "undefined") {
            if (typeof(arguments[4]) == "function") {
                callback = arguments[4];
            } else {
                header = arguments[4];
            }
        }
        if (typeof(arguments[5]) != "undefined") {
            if (typeof(arguments[5]) == "function") {
                callback = arguments[5];
            } else {
                options = arguments[5];
            }
        }
        if (typeof(arguments[6]) != "undefined") callback = arguments[6];
        if (callback) {
            args.callback = callback;
        } else {
            isPromise  = true;
            defer      = Q.defer();
            args.defer = defer;
        }
        args.isPromise = isPromise;
        if (param) args.param = param;

        // Handle XML HTTP Request object
        xhr = this.instantiateRequest();
        args.xhr = xhr;
        respHandler = this.responseHandler.bind(this, args);
        timeoutHandler = this.timeoutHandler.bind(this, args);
        if (xhr.timeout) {
            if (options.timeout) {
                xhr.timeout = options.timeout;
            } else {
                xhr.timeout = this.timeout;
            }
            xhr.ontimeout = timeoutHandler;
        }
        xhr.onreadystatechange = respHandler;

        // Handle HTTP payload
        if (this.uploadFiles.length > 0) {
            formData = this.composeFormData(this.uploadFiles, param);
        } else {
            postData = this.lightHttpLib.stringifyParam(param);
        }

        if (type === "POST") {
            xhr.open(type, url, async);
            this.setHeaders(xhr, header);
            if (formData) {
                xhr.send(formData);
            } else {
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.send(postData);
            }
        } else {
            if (postData) {
                if (url.match(/\?/)) {
                    url += "&" + postData;
                } else {
                    url += "?" + postData;
                }
            }
            xhr.open(type, url, async);
            this.setHeaders(xhr, header);
            xhr.send();
        }
        this.clear();
        if (true === isPromise) {
            return defer.promise;
        }
    };//}}}

    o.instantiateRequest = function ()
    {//{{{
        var xhr;
        if (window.XMLHttpRequest) {
           xhr = new XMLHttpRequest();
           if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/xml');
           }
        } else if (window.ActiveXObject) {
           try {
              xhr = new ActiveXObject("Msxml2.XMLHTTP");
           } catch (e) {
              try {
                 xhr = new ActiveXObject("Microsoft.XMLHTTP");
              } catch (e2) {}
           }
        }
        return xhr;
    };//}}}

    o.responseHandler = function(args)
    {//{{{
        var resp = "", respInfo = {}, xhr;
        xhr = args.xhr;
        //xhr.getResponseHeader("Connection")
        //header = xhr.getAllResponseHeaders();
        if (xhr.readyState == 4) {
            respInfo = xhr;
            resp = xhr.responseText;
            if (true === args.isPromise) {
                args.defer.resolve(resp, respInfo);
            } else if (args.callback) {
                args.callback(resp, respInfo);
            }
        }
    };//}}}

    o.setHeaders = function (xhr, headers)
    {//{{{
        for (var key in headers) {
            xhr.setRequestHeader(key, headers[key]);
        }

    };//}}}

    o.timeoutHandler = function (args)
    {//{{{
        //var respInfo = {};
        //console.log("timeout");
        //args.isTimeout = true;
        //respInfo.errMsg = "timeout";
        //respInfo.status = 408;
        //if (args.callback) args.callback("", respInfo);
    };//}}}

    o.jsonpHandler = function () 
    {

    };

    /**
     * remove jsonp callback function from window to prevent memory leak.
     */
    o.cleanJsonpCallback = function ()
    {//{{{
        var func;
        for (func in this.jsonpCallbackList) {
            if (this.jsonpCallbackList[func] === 1) {
                //console.log("delete  jsonp callback = " + func);
                try {
                    delete window[func];
                } catch (e) {}
            }
        }
    };//}}}

    window.lightHttp = lightHttp;
    if (module) {
        module = module.exports = new lightHttp();
        module.constructor = lightHttp;
    }
}());

},{"./lib.js":1}],3:[function(require,module,exports){
(function (win, doc) {
    var lh = require('light-http/lightHttp-simple.js');
    var self;
    function imageView() {
        var param;
        this.main = doc.querySelector(".main");
        this.filesWrap = this.main.querySelector(".files-wrap");
        this.dirsWrap = this.main.querySelector(".dirs-wrap");
       
        if (!this.main) {
            throw "Can not find the class of .main";
            return ;
        }
        param = this.getParameters();
        if (param && param.path) {
            this.path = param.path;
        } else {
            this.path = "src";
        }
        self = this;
    }

    var o = imageView.prototype;
    o.process = function () {
        this.fetchFileList(); 
    }

    o.fetchFileList = function () {
        var url, fileHtml = [], dirHtml = [];
        url = self.path + "/filelist.json";
        lh.ajax(url, "", function (content) {
            var c = JSON.parse(content);
            if (c && c.dirs) {
                c.dirs.forEach(function(file) {
                    var path;
                    path = self.path + "/" + file;
                    dirHtml.push('<div class="dir-wrap">');
                    dirHtml.push('<a href="?path='+path+'" >'+file+'</a>');
                    dirHtml.push('</div>');
                });
                self.dirsWrap.innerHTML = dirHtml.join("\n");
            }
            if (c && c.files) {
                c.files.forEach(function(file) {
                    var fullPath;
                    fullPath = self.path + "/" + file;
                    fileHtml.push('<div class="file-wrap">');
                    if (file.match(/\.(jpg|png|gif|jpeg)/)) {
                        fileHtml.push('<img src="'+fullPath+'" />');
                    }
                    fileHtml.push('</div>');
                });
                self.filesWrap.innerHTML = fileHtml.join("\n");
            }
        });
    }

    o.getParameters = function() {
      var query = location.search.substr(1);
      var result = {};
      query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
      return result;
    }

    var obj = new imageView();
    
    obj.process();
 
}(window, document))

},{"light-http/lightHttp-simple.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy9saWdodC1odHRwL2xpYi5qcyIsIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2xpZ2h0LWh0dHAvbGlnaHRIdHRwLXNpbXBsZS5qcyIsInNyYy9qcy9kZWZhdWx0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbihmdW5jdGlvbigpIHtcblxuICAgIHZhciBsaWIgPSB7XG4gICAgICAgIHBhcnNlVXJsOiBmdW5jdGlvbih1cmwpIHsvL3t7e1xuICAgICAgICAgICAgdmFyIHJlZ1VybCwgbWF0Y2hlcywgcmV0LCBwYXJhbSA9IHt9O1xuICAgICAgICAgICAgLy8gKGh0dHBzKSAoaG9zdCkgKHBvcnQpIChwYXRoKSAocGFyYW0pXG4gICAgICAgICAgICByZWdVcmwgPSAvKGh0dHBzPyk6XFwvXFwvKFthLXowLTldW2EtejAtOVxcLVxcLl0rW2EtejAtOV0pKDpbMC05XSspPyhcXC9bXlxcP10qKT9cXD8/KC4qKS9pO1xuICAgICAgICAgICAgcmV0ID0ge1xuICAgICAgICAgICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICAgICAgICAgIHByb3RvY29sOiBcIlwiLFxuICAgICAgICAgICAgICAgIGhvc3Q6IFwiXCIsXG4gICAgICAgICAgICAgICAgcGF0aDogXCJcIixcbiAgICAgICAgICAgICAgICBwYXJhbTogXCJcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG1hdGNoZXMgPSB1cmwubWF0Y2gocmVnVXJsKTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXNbMl0pIHtcbiAgICAgICAgICAgICAgICByZXRbJ3Byb3RvY29sJ10gPSBtYXRjaGVzWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgcmV0Wydob3N0J10gPSBtYXRjaGVzWzJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyAmJiBtYXRjaGVzWzNdICYmIG1hdGNoZXNbM10gIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHJldFsncG9ydCddID0gcGFyc2VJbnQobWF0Y2hlc1szXS5zdWJzdHIoMSksIDEwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiaHR0cHNcIiA9PT0gcmV0LnByb3RvY29sKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFsncG9ydCddID0gNDQzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hdGNoZXMgJiYgIW1hdGNoZXNbNF0pIHtcbiAgICAgICAgICAgICAgICByZXRbJ3BhdGgnXSA9IFwiL1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXRbJ3BhdGgnXSA9IG1hdGNoZXNbNF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXNbNV0pIHtcbiAgICAgICAgICAgICAgICByZXRbJ3BhcmFtJ10gPSB0aGlzLnN0cmluZ1RvUGFyYW0obWF0Y2hlc1s1XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sLy99fX1cblxuICAgICAgICBzdHJpbmdpZnlQYXJhbTogZnVuY3Rpb24ocGFyYW0pXG4gICAgICAgIHsvL3t7e1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvIGluIHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbVRvU3RyaW5nKHJldCwgcHJvLCBwYXJhbVtwcm9dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQuam9pbignJicpO1xuICAgICAgICB9LC8vfX19XG5cbiAgICAgICAgcGFyYW1Ub1N0cmluZzogZnVuY3Rpb24gKHJldCwga2V5LCB2YWx1ZSkgXG4gICAgICAgIHsvL3t7e1xuICAgICAgICAgICAgdmFyIGksIG4sIGs7XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIG4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmFtVG9TdHJpbmcocmV0LCBrZXkgKyBcIltcIitpK1wiXVwiLCB2YWx1ZVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmFtVG9TdHJpbmcocmV0LCBrZXkgKyBcIltcIitrK1wiXVwiLCB2YWx1ZVtrXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXQucHVzaChrZXkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LC8vfX19XG5cbiAgICAgICAgc3RyaW5nVG9QYXJhbTogZnVuY3Rpb24gKHN0cmluZykgXG4gICAgICAgIHsvL3t7e1xuICAgICAgICAgICAgdmFyIHBtLCBpLCBuLCB2YWx1ZSwgcG9zLCBrZXksIHBhcmFtID0ge307XG4gICAgICAgICAgICBwbSA9IHN0cmluZy5zcGxpdCgvJi8pO1xuICAgICAgICAgICAgbiA9IHBtLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwb3MgPSBwbVtpXS5pbmRleE9mKFwiPVwiKTtcbiAgICAgICAgICAgICAgICBrZXkgPSBwbVtpXS5zdWJzdHIoMCwgcG9zKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBtW2ldLnN1YnN0cihwb3MgKyAxLCBwbVtpXS5sZW5ndGggLSBwb3MgLSAxKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChwYXJhbVtrZXldKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ba2V5XS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtW2tleV0gPSBbcGFyYW1ba2V5XSwgdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJhbTtcbiAgICAgICAgfSwvL319fVxuXG5cbiAgICAgICAgYWRkUGFyYW1zOiBmdW5jdGlvbiAodXJsLCBwYXJhbXMpIFxuICAgICAgICB7Ly97e3tcbiAgICAgICAgICAgIHZhciBwYXJhbVN0ciwgbWF0Y2hlcywgdXJsUGFyYW07XG4gICAgICAgICAgICBpZiAoIXVybCkgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICBpZiAoIXBhcmFtcykgcGFyYW1zID0ge307XG4gICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoJyMnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHVybCA9IHVybC5yZXBsYWNlKC9cXCMuKi8sICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hdGNoZXMgPSB1cmwubWF0Y2goL1xcPyguKykvKTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXNbMV0pIHtcbiAgICAgICAgICAgICAgICB1cmxQYXJhbSA9IHRoaXMuc3RyaW5nVG9QYXJhbShtYXRjaGVzWzFdKTtcbiAgICAgICAgICAgICAgICBpZiAodXJsUGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gdGhpcy5tZXJnZVR3b1BhcmFtdGVycyh1cmxQYXJhbSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoL1xcPy4rLywgJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmFtU3RyID0gdGhpcy5zdHJpbmdpZnlQYXJhbShwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFwYXJhbVN0cikgcmV0dXJuIHVybDtcbiAgICAgICAgICAgIGlmICh1cmwubWF0Y2goL1xcPy8pKSB7XG4gICAgICAgICAgICAgICAgdXJsICs9IFwiJlwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmwgKz0gXCI/XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1cmwgKz0gcGFyYW1TdHI7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9LC8vfX19XG5cbiAgICAgICAgY29va2llVG9TdHJpbmc6IGZ1bmN0aW9uIChjb29raWVzKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3RyID0gW10sIGtleTtcbiAgICAgICAgICAgIGlmIChjb29raWVzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29va2llcy5qb2luKCc7ICcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBjb29raWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ci5wdXNoKGtleSArICc9JyArIGNvb2tpZXNba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0ci5qb2luKCc7ICcpO1xuICAgICAgICB9LFxuICAgICAgICBtZXJnZVR3b1BhcmFtdGVyczogZnVuY3Rpb24gKG9iajEsIG9iajIpXG4gICAgICAgIHsvL3t7e1xuICAgICAgICAgICAgdmFyIG9iajMgPSB7fSwgYXR0cm5hbWU7XG4gICAgICAgICAgICBmb3IgKGF0dHJuYW1lIGluIG9iajEpIHsgb2JqM1thdHRybmFtZV0gPSBvYmoxW2F0dHJuYW1lXTsgfVxuICAgICAgICAgICAgZm9yIChhdHRybmFtZSBpbiBvYmoyKSB7IG9iajNbYXR0cm5hbWVdID0gb2JqMlthdHRybmFtZV07IH1cbiAgICAgICAgICAgIHJldHVybiBvYmozO1xuICAgICAgICB9Ly99fX1cblxuICAgIH07XG5cbiAgICBtb2R1bGUgPSBtb2R1bGUuZXhwb3J0cyA9IGxpYjtcbn0oKSk7XG5cblxuIiwiLyogZ2xvYmFscyBGb3JtRGF0YSAqL1xuLypcbiAqXG4gKiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5GdW5jdGlvbi5wcm90b3R5cGUuYmluZD1GdW5jdGlvbi5wcm90b3R5cGUuYmluZHx8ZnVuY3Rpb24oYil7aWYodHlwZW9mIHRoaXMhPT1cImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTt9dmFyIGE9QXJyYXkucHJvdG90eXBlLnNsaWNlLGY9YS5jYWxsKGFyZ3VtZW50cywxKSxlPXRoaXMsYz1mdW5jdGlvbigpe30sZD1mdW5jdGlvbigpe3JldHVybiBlLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBjP3RoaXM6Ynx8d2luZG93LGYuY29uY2F0KGEuY2FsbChhcmd1bWVudHMpKSk7fTtjLnByb3RvdHlwZT10aGlzLnByb3RvdHlwZTtkLnByb3RvdHlwZT1uZXcgYygpO3JldHVybiBkO307XG5cblxuKGZ1bmN0aW9uICgpIHtcbi8qKioqXG4qIG9iai5hamF4KFwidGVzdEdldFwiLCB7XCJ0ZXN0XCI6MX0sIGZ1bmN0aW9uIChjb250ZW50KSB7fSk7XG4qIG9iai5hamF4UG9zdChcInRlc3RQb3N0LnBocFwiLCB7XCJ0ZXN0XCI6IDEsIFwidGVzdDJcIjogMn0se30sIGZ1bmN0aW9uIChjb250ZW50KSB7fSk7XG5cbi8vUmVkaXJlY3QgdG8gYW5vdGhlciB1cmwuXG4qIG9iai5nZXQoXCJ0ZXN0R2V0XCIsIHtcInRlc3RcIjoxfSk7IFxuKiBvYmoucG9zdChcInRlc3RQb3N0LnBocFwiLCB7XCJ0ZXN0XCI6MX0pO1xuXG4qKioqKi9cbiAgICB2YXIgbGliID0gcmVxdWlyZSgnLi9saWIuanMnKTtcbiAgICAvL3ZhciBRID0gcmVxdWlyZSgncScpO1xuXG5cbiAgICBmdW5jdGlvbiBsaWdodEh0dHAoKSB7Ly97e3tcbiAgICAgICAgaWYgKCFsaWIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyBsaWJyYXJ5IG5hbWVkIGxpZ2h0SHR0cExpYlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmpzb25wSW5kZXggICA9IDE7XG4gICAgICAgIHRoaXMubGlnaHRIdHRwTGliID0gbGliOyAvL3dpbmRvdy5saWdodEh0dHBMaWI7XG4gICAgICAgIHRoaXMudGltZW91dCAgICAgID0gMTUwMDA7IC8vMTUgc2Vjb25kc1xuICAgICAgICB0aGlzLmpzb25wQ2FsbGJhY2tMaXN0ID0ge307XG4gICAgICAgIHRoaXMudXBsb2FkRmlsZXMgID0gW107XG4gICAgfS8vfX19XG5cbiAgICB2YXIgbyA9IGxpZ2h0SHR0cC5wcm90b3R5cGU7XG4gICAgby51cGxvYWRGaWxlcyA9IFtdO1xuXG4gICAgby5hZGRGaWxlID0gZnVuY3Rpb24gKGZpZWxkLCBpbnB1dCkgXG4gICAgey8ve3t7XG4gICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwbG9hZEZpbGVzLnB1c2goe1xuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgaW5wdXQ6IGlucHV0XG4gICAgICAgIH0pO1xuICAgIH07Ly99fX1cblxuICAgIG8uY2xlYXIgPSBmdW5jdGlvbiAoKVxuICAgIHsvL3t7e1xuICAgICAgICB0aGlzLnVwbG9hZEZpbGVzID0gW107XG4gICAgfTsvL319fVxuXG4gICAgby5jb21wb3NlRm9ybURhdGEgPSBmdW5jdGlvbiAodXBsb2FkRmlsZXMsIHBhcmFtKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgZiwgaSAsbiwgaXQsIGtleTtcbiAgICAgICAgZiA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBuID0gdXBsb2FkRmlsZXMubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBpdCA9IHVwbG9hZEZpbGVzW2ldO1xuICAgICAgICAgICAgZi5hcHBlbmQoaXQuZmllbGQsIGl0LmlucHV0LmZpbGVzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGtleSBpbiBwYXJhbSkge1xuICAgICAgICAgICAgdGhpcy5wYXJhbVRvRm9ybURhdGEoZiwga2V5LCBwYXJhbVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZjtcbiAgICB9Oy8vfX19XG5cbiAgICBvLnBhcmFtVG9Gb3JtRGF0YSA9IGZ1bmN0aW9uIChmb3JtRGF0YSwga2V5ICx2YWx1ZSwgaXNIdG1sRm9ybSlcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIGkgLG4sIGs7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBuID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1Ub0Zvcm1EYXRhKGZvcm1EYXRhLCBrZXkgKyBcIltcIitpK1wiXVwiLCB2YWx1ZVtpXSwgaXNIdG1sRm9ybSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1Ub0Zvcm1EYXRhKGZvcm1EYXRhLCBrZXkrXCJbXCIraytcIl1cIiwgdmFsdWVba10sIGlzSHRtbEZvcm0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzSHRtbEZvcm0pIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0Lm5hbWUgID0ga2V5O1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9Oy8vfX19XG5cbiAgICBvLmdldCA9IGZ1bmN0aW9uICh1cmwsIHBhcmFtKSBcbiAgICB7Ly97e3tcbiAgICAgICAgdXJsID0gdGhpcy5saWdodEh0dHBMaWIuYWRkUGFyYW1zKHVybCwgcGFyYW0pO1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICB9Oy8vfX19XG5cbiAgICBvLnBvc3QgPSBmdW5jdGlvbiAodXJsLCBwYXJhbSlcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIGZvcm0sIGtleSwgaW5wdXQsIGlzSHRtbEZvcm07XG4gICAgICAgIGlzSHRtbEZvcm0gPSB0cnVlO1xuICAgICAgICBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICAgICAgICBmb3JtLmFjdGlvbiA9IHVybDtcbiAgICAgICAgZm9ybS5tZXRob2QgPSBcIlBPU1RcIjtcbiAgICAgICAgZm9yIChrZXkgaW4gcGFyYW0pIHtcbiAgICAgICAgICAgIGlmICghcGFyYW0uaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICB0aGlzLnBhcmFtVG9Gb3JtRGF0YShmb3JtLCBrZXksIHBhcmFtW2tleV0sIGlzSHRtbEZvcm0pO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgICAgIGZvcm0uc3VibWl0KCk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgIH07Ly99fX1cblxuICAgIC8qKlxuICAgICAqIGFqYXg6IG1ha2UgYSBhamF4IHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gc3RyaW5nIHVybFxuICAgICAqIEBwYXJhbSBvYmplY3QgcGFyYW1cbiAgICAgKiBAcGFyYW0gb2JqZWN0IGhlYWRlclxuICAgICAqIEBwYXJhbSBmdW5jdGlvbiBjYWxsYmFja1xuICAgICAqL1xuICAgIG8uYWpheCA9IGZ1bmN0aW9uICgpXG4gICAgey8ve3t7XG4gICAgICAgIHZhciBhcmdzID0gW1wiYWpheFwiLCBcIkdFVFwiXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGk8IGxlbjsgaSsrKSBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9Oy8vfX19XG5cbiAgICBvLmFqYXhwb3N0ID0gby5hamF4UG9zdCA9IGZ1bmN0aW9uICgpXG4gICAgey8ve3t7XG4gICAgICAgIHZhciBhcmdzID0gW1wiYWpheFBvc3RcIiwgXCJQT1NUXCJdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaTwgbGVuOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07Ly99fX1cblxuICAgIG8ucGFqYXggPSBmdW5jdGlvbiAoKSBcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIGFyZ3MgPSBbXCJwamF4XCIsIFwiR0VUXCJdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaTwgbGVuOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07Ly99fX1cblxuICAgIG8uanNvbnAgPSBmdW5jdGlvbiAodXJsLCBwYXJhbSwgaGVhZGVyLCBjYWxsYmFjaylcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIHNjcmlwdCwganNvbnBDYWxsYmFjaywgc2VsZjtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICghcGFyYW0pIHBhcmFtID0ge307XG4gICAgICAgIGlmICh0eXBlb2YoaGVhZGVyKSA9PSBcImZ1bmN0aW9uXCIpIGNhbGxiYWNrID0gaGVhZGVyO1xuICAgICAgICB0aGlzLmNsZWFuSnNvbnBDYWxsYmFjaygpO1xuXG4gICAgICAgIC8vIEhhbmRsZSBKU09OUCBjYWxsYmFjay5cbiAgICAgICAganNvbnBDYWxsYmFjayA9IFwibGlnaHRIdHRwX2pzb25wX1wiICsgdGhpcy5qc29ucEluZGV4ICsgXCJfXCIgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBwYXJhbVsnY2FsbGJhY2snXSA9IGpzb25wQ2FsbGJhY2s7XG4gICAgICAgIHRoaXMuanNvbnBDYWxsYmFja0xpc3RbanNvbnBDYWxsYmFja10gPSAwO1xuICAgICAgICB3aW5kb3dbanNvbnBDYWxsYmFja10gPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhLCB7fSk7XG4gICAgICAgICAgICBzZWxmLmpzb25wQ2FsbGJhY2tMaXN0W2pzb25wQ2FsbGJhY2tdID0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBNYWtlIHRoZSByZXF1ZXN0LlxuICAgICAgICB1cmwgPSB0aGlzLmxpZ2h0SHR0cExpYi5hZGRQYXJhbXModXJsLCBwYXJhbSk7XG4gICAgICAgIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgIHRoaXMuanNvbnBJbmRleCsrO1xuICAgIH07Ly99fX1cblxuICAgIC8qXG4gICAgICogbmFtZSwgdHlwZSwgdXJsLCBwYXJhbSwgaGVhZGVyLCBjYWxsYmFja1xuICAgICovXG4gICAgby5yZXF1ZXN0ID0gZnVuY3Rpb24gKCkgXG4gICAgey8ve3t7XG4gICAgICAgIHZhciB0eXBlID0gXCJHRVRcIiwgeGhyLCB1cmwsIHBhcmFtLCBoZWFkZXIsIG5hbWUsXG4gICAgICAgICAgICBjYWxsYmFjaywgcG9zdERhdGEgPSBcIlwiLCBhc3luYyA9IHRydWUsIFxuICAgICAgICAgICAgZGVmZXIsIGlzUHJvbWlzZSA9IGZhbHNlLCBmb3JtRGF0YSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fSwgYXJncyA9IHt9O1xuICAgICAgICB2YXIgcmVzcEhhbmRsZXIsIHRpbWVvdXRIYW5kbGVyO1xuICAgICAgICAvLyBIYW5kbGUgQXJndW1lbnRzXG4gICAgICAgIGlmICghYXJndW1lbnRzKSByZXR1cm4gXCJcIjtcbiAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbMF0pICE9IFwidW5kZWZpbmVkXCIpIG5hbWUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzFdKSAhPSBcInVuZGVmaW5lZFwiKSB0eXBlID0gYXJndW1lbnRzWzFdO1xuICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1syXSkgIT0gXCJ1bmRlZmluZWRcIikgdXJsID0gYXJndW1lbnRzWzJdO1xuICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1szXSkgIT0gXCJ1bmRlZmluZWRcIikgcGFyYW0gPSBhcmd1bWVudHNbM107XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzRdKSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1s0XSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBhcmd1bWVudHNbNF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhlYWRlciA9IGFyZ3VtZW50c1s0XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1s1XSkgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbNV0pID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gYXJndW1lbnRzWzVdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzWzVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzZdKSAhPSBcInVuZGVmaW5lZFwiKSBjYWxsYmFjayA9IGFyZ3VtZW50c1s2XTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhcmdzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpc1Byb21pc2UgID0gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmVyICAgICAgPSBRLmRlZmVyKCk7XG4gICAgICAgICAgICBhcmdzLmRlZmVyID0gZGVmZXI7XG4gICAgICAgIH1cbiAgICAgICAgYXJncy5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG4gICAgICAgIGlmIChwYXJhbSkgYXJncy5wYXJhbSA9IHBhcmFtO1xuXG4gICAgICAgIC8vIEhhbmRsZSBYTUwgSFRUUCBSZXF1ZXN0IG9iamVjdFxuICAgICAgICB4aHIgPSB0aGlzLmluc3RhbnRpYXRlUmVxdWVzdCgpO1xuICAgICAgICBhcmdzLnhociA9IHhocjtcbiAgICAgICAgcmVzcEhhbmRsZXIgPSB0aGlzLnJlc3BvbnNlSGFuZGxlci5iaW5kKHRoaXMsIGFyZ3MpO1xuICAgICAgICB0aW1lb3V0SGFuZGxlciA9IHRoaXMudGltZW91dEhhbmRsZXIuYmluZCh0aGlzLCBhcmdzKTtcbiAgICAgICAgaWYgKHhoci50aW1lb3V0KSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHhoci50aW1lb3V0ID0gdGhpcy50aW1lb3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeGhyLm9udGltZW91dCA9IHRpbWVvdXRIYW5kbGVyO1xuICAgICAgICB9XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZXNwSGFuZGxlcjtcblxuICAgICAgICAvLyBIYW5kbGUgSFRUUCBwYXlsb2FkXG4gICAgICAgIGlmICh0aGlzLnVwbG9hZEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvcm1EYXRhID0gdGhpcy5jb21wb3NlRm9ybURhdGEodGhpcy51cGxvYWRGaWxlcywgcGFyYW0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9zdERhdGEgPSB0aGlzLmxpZ2h0SHR0cExpYi5zdHJpbmdpZnlQYXJhbShwYXJhbSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJQT1NUXCIpIHtcbiAgICAgICAgICAgIHhoci5vcGVuKHR5cGUsIHVybCwgYXN5bmMpO1xuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHhociwgaGVhZGVyKTtcbiAgICAgICAgICAgIGlmIChmb3JtRGF0YSkge1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKGZvcm1EYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIik7XG4gICAgICAgICAgICAgICAgeGhyLnNlbmQocG9zdERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHBvc3REYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVybC5tYXRjaCgvXFw/LykpIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsICs9IFwiJlwiICsgcG9zdERhdGE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsICs9IFwiP1wiICsgcG9zdERhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeGhyLm9wZW4odHlwZSwgdXJsLCBhc3luYyk7XG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcnMoeGhyLCBoZWFkZXIpO1xuICAgICAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIGlmICh0cnVlID09PSBpc1Byb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xuICAgICAgICB9XG4gICAgfTsvL319fVxuXG4gICAgby5pbnN0YW50aWF0ZVJlcXVlc3QgPSBmdW5jdGlvbiAoKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgeGhyO1xuICAgICAgICBpZiAod2luZG93LlhNTEh0dHBSZXF1ZXN0KSB7XG4gICAgICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICBpZiAoeGhyLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgeGhyLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQveG1sJyk7XG4gICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB4aHIgPSBuZXcgQWN0aXZlWE9iamVjdChcIk1zeG1sMi5YTUxIVFRQXCIpO1xuICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgIHhociA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTEhUVFBcIik7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUyKSB7fVxuICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHhocjtcbiAgICB9Oy8vfX19XG5cbiAgICBvLnJlc3BvbnNlSGFuZGxlciA9IGZ1bmN0aW9uKGFyZ3MpXG4gICAgey8ve3t7XG4gICAgICAgIHZhciByZXNwID0gXCJcIiwgcmVzcEluZm8gPSB7fSwgeGhyO1xuICAgICAgICB4aHIgPSBhcmdzLnhocjtcbiAgICAgICAgLy94aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb25uZWN0aW9uXCIpXG4gICAgICAgIC8vaGVhZGVyID0geGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpO1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNCkge1xuICAgICAgICAgICAgcmVzcEluZm8gPSB4aHI7XG4gICAgICAgICAgICByZXNwID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIGlmICh0cnVlID09PSBhcmdzLmlzUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIGFyZ3MuZGVmZXIucmVzb2x2ZShyZXNwLCByZXNwSW5mbyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3MuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBhcmdzLmNhbGxiYWNrKHJlc3AsIHJlc3BJbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07Ly99fX1cblxuICAgIG8uc2V0SGVhZGVycyA9IGZ1bmN0aW9uICh4aHIsIGhlYWRlcnMpXG4gICAgey8ve3t7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihrZXksIGhlYWRlcnNba2V5XSk7XG4gICAgICAgIH1cblxuICAgIH07Ly99fX1cblxuICAgIG8udGltZW91dEhhbmRsZXIgPSBmdW5jdGlvbiAoYXJncylcbiAgICB7Ly97e3tcbiAgICAgICAgLy92YXIgcmVzcEluZm8gPSB7fTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInRpbWVvdXRcIik7XG4gICAgICAgIC8vYXJncy5pc1RpbWVvdXQgPSB0cnVlO1xuICAgICAgICAvL3Jlc3BJbmZvLmVyck1zZyA9IFwidGltZW91dFwiO1xuICAgICAgICAvL3Jlc3BJbmZvLnN0YXR1cyA9IDQwODtcbiAgICAgICAgLy9pZiAoYXJncy5jYWxsYmFjaykgYXJncy5jYWxsYmFjayhcIlwiLCByZXNwSW5mbyk7XG4gICAgfTsvL319fVxuXG4gICAgby5qc29ucEhhbmRsZXIgPSBmdW5jdGlvbiAoKSBcbiAgICB7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGpzb25wIGNhbGxiYWNrIGZ1bmN0aW9uIGZyb20gd2luZG93IHRvIHByZXZlbnQgbWVtb3J5IGxlYWsuXG4gICAgICovXG4gICAgby5jbGVhbkpzb25wQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgZnVuYztcbiAgICAgICAgZm9yIChmdW5jIGluIHRoaXMuanNvbnBDYWxsYmFja0xpc3QpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmpzb25wQ2FsbGJhY2tMaXN0W2Z1bmNdID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImRlbGV0ZSAganNvbnAgY2FsbGJhY2sgPSBcIiArIGZ1bmMpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB3aW5kb3dbZnVuY107XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07Ly99fX1cblxuICAgIHdpbmRvdy5saWdodEh0dHAgPSBsaWdodEh0dHA7XG4gICAgaWYgKG1vZHVsZSkge1xuICAgICAgICBtb2R1bGUgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBsaWdodEh0dHAoKTtcbiAgICAgICAgbW9kdWxlLmNvbnN0cnVjdG9yID0gbGlnaHRIdHRwO1xuICAgIH1cbn0oKSk7XG4iLCIoZnVuY3Rpb24gKHdpbiwgZG9jKSB7XG4gICAgdmFyIGxoID0gcmVxdWlyZSgnbGlnaHQtaHR0cC9saWdodEh0dHAtc2ltcGxlLmpzJyk7XG4gICAgdmFyIHNlbGY7XG4gICAgZnVuY3Rpb24gaW1hZ2VWaWV3KCkge1xuICAgICAgICB2YXIgcGFyYW07XG4gICAgICAgIHRoaXMubWFpbiA9IGRvYy5xdWVyeVNlbGVjdG9yKFwiLm1haW5cIik7XG4gICAgICAgIHRoaXMuZmlsZXNXcmFwID0gdGhpcy5tYWluLnF1ZXJ5U2VsZWN0b3IoXCIuZmlsZXMtd3JhcFwiKTtcbiAgICAgICAgdGhpcy5kaXJzV3JhcCA9IHRoaXMubWFpbi5xdWVyeVNlbGVjdG9yKFwiLmRpcnMtd3JhcFwiKTtcbiAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLm1haW4pIHtcbiAgICAgICAgICAgIHRocm93IFwiQ2FuIG5vdCBmaW5kIHRoZSBjbGFzcyBvZiAubWFpblwiO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBwYXJhbSA9IHRoaXMuZ2V0UGFyYW1ldGVycygpO1xuICAgICAgICBpZiAocGFyYW0gJiYgcGFyYW0ucGF0aCkge1xuICAgICAgICAgICAgdGhpcy5wYXRoID0gcGFyYW0ucGF0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGF0aCA9IFwic3JjXCI7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIG8gPSBpbWFnZVZpZXcucHJvdG90eXBlO1xuICAgIG8ucHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5mZXRjaEZpbGVMaXN0KCk7IFxuICAgIH1cblxuICAgIG8uZmV0Y2hGaWxlTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybCwgZmlsZUh0bWwgPSBbXSwgZGlySHRtbCA9IFtdO1xuICAgICAgICB1cmwgPSBzZWxmLnBhdGggKyBcIi9maWxlbGlzdC5qc29uXCI7XG4gICAgICAgIGxoLmFqYXgodXJsLCBcIlwiLCBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGMgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgICAgaWYgKGMgJiYgYy5kaXJzKSB7XG4gICAgICAgICAgICAgICAgYy5kaXJzLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aDtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHNlbGYucGF0aCArIFwiL1wiICsgZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgZGlySHRtbC5wdXNoKCc8ZGl2IGNsYXNzPVwiZGlyLXdyYXBcIj4nKTtcbiAgICAgICAgICAgICAgICAgICAgZGlySHRtbC5wdXNoKCc8YSBocmVmPVwiP3BhdGg9JytwYXRoKydcIiA+JytmaWxlKyc8L2E+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpckh0bWwucHVzaCgnPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc2VsZi5kaXJzV3JhcC5pbm5lckhUTUwgPSBkaXJIdG1sLmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYyAmJiBjLmZpbGVzKSB7XG4gICAgICAgICAgICAgICAgYy5maWxlcy5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxQYXRoO1xuICAgICAgICAgICAgICAgICAgICBmdWxsUGF0aCA9IHNlbGYucGF0aCArIFwiL1wiICsgZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZUh0bWwucHVzaCgnPGRpdiBjbGFzcz1cImZpbGUtd3JhcFwiPicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZS5tYXRjaCgvXFwuKGpwZ3xwbmd8Z2lmfGpwZWcpLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVIdG1sLnB1c2goJzxpbWcgc3JjPVwiJytmdWxsUGF0aCsnXCIgLz4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaWxlSHRtbC5wdXNoKCc8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzZWxmLmZpbGVzV3JhcC5pbm5lckhUTUwgPSBmaWxlSHRtbC5qb2luKFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvLmdldFBhcmFtZXRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBxdWVyeSA9IGxvY2F0aW9uLnNlYXJjaC5zdWJzdHIoMSk7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBxdWVyeS5zcGxpdChcIiZcIikuZm9yRWFjaChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgIHZhciBpdGVtID0gcGFydC5zcGxpdChcIj1cIik7XG4gICAgICAgIHJlc3VsdFtpdGVtWzBdXSA9IGRlY29kZVVSSUNvbXBvbmVudChpdGVtWzFdKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gbmV3IGltYWdlVmlldygpO1xuICAgIFxuICAgIG9iai5wcm9jZXNzKCk7XG4gXG59KHdpbmRvdywgZG9jdW1lbnQpKVxuIl19
