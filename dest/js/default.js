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
        this.hasParentDir = (this.path != "src") ? true : false;
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
            if (true === self.hasParentDir) {
                dirHtml.push('<div class="dir-wrap">');
                dirHtml.push('<a href="#" onclick="history.go(-1);return false;" >../</a>');
                dirHtml.push('</div>');
            }

            if (c && c.dirs && c.dirs.length > 0) {
                c.dirs.forEach(function(file) {
                    var path;
                    path = self.path + "/" + file;
                    dirHtml.push('<div class="dir-wrap">');
                    dirHtml.push('<a href="?path='+path+'" >'+file+'</a>');
                    dirHtml.push('</div>');
                });
            } 

            if (dirHtml) self.dirsWrap.innerHTML = dirHtml.join("\n");

            if (c && c.files) {
                c.files.forEach(function(file) {
                    var fullPath;
                    fullPath = self.path + "/" + file;
                    fileHtml.push('<div class="file-wrap">');
                    fileHtml.push('<a href="'+fullPath+'" target="_blank">');
                    if (file.match(/\.(jpg|png|gif|jpeg)/)) {
                        fileHtml.push('<img src="'+fullPath+'" />');
                    }
                    fileHtml.push('</a>');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy9saWdodC1odHRwL2xpYi5qcyIsIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2xpZ2h0LWh0dHAvbGlnaHRIdHRwLXNpbXBsZS5qcyIsInNyYy9qcy9kZWZhdWx0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGxpYiA9IHtcbiAgICAgICAgcGFyc2VVcmw6IGZ1bmN0aW9uKHVybCkgey8ve3t7XG4gICAgICAgICAgICB2YXIgcmVnVXJsLCBtYXRjaGVzLCByZXQsIHBhcmFtID0ge307XG4gICAgICAgICAgICAvLyAoaHR0cHMpIChob3N0KSAocG9ydCkgKHBhdGgpIChwYXJhbSlcbiAgICAgICAgICAgIHJlZ1VybCA9IC8oaHR0cHM/KTpcXC9cXC8oW2EtejAtOV1bYS16MC05XFwtXFwuXStbYS16MC05XSkoOlswLTldKyk/KFxcL1teXFw/XSopP1xcPz8oLiopL2k7XG4gICAgICAgICAgICByZXQgPSB7XG4gICAgICAgICAgICAgICAgcG9ydDogODAsXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6IFwiXCIsXG4gICAgICAgICAgICAgICAgaG9zdDogXCJcIixcbiAgICAgICAgICAgICAgICBwYXRoOiBcIlwiLFxuICAgICAgICAgICAgICAgIHBhcmFtOiBcIlwiXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbWF0Y2hlcyA9IHVybC5tYXRjaChyZWdVcmwpO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlc1syXSkge1xuICAgICAgICAgICAgICAgIHJldFsncHJvdG9jb2wnXSA9IG1hdGNoZXNbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICByZXRbJ2hvc3QnXSA9IG1hdGNoZXNbMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXNbM10gJiYgbWF0Y2hlc1szXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0Wydwb3J0J10gPSBwYXJzZUludChtYXRjaGVzWzNdLnN1YnN0cigxKSwgMTApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJodHRwc1wiID09PSByZXQucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0Wydwb3J0J10gPSA0NDM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyAmJiAhbWF0Y2hlc1s0XSkge1xuICAgICAgICAgICAgICAgIHJldFsncGF0aCddID0gXCIvXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldFsncGF0aCddID0gbWF0Y2hlc1s0XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlc1s1XSkge1xuICAgICAgICAgICAgICAgIHJldFsncGFyYW0nXSA9IHRoaXMuc3RyaW5nVG9QYXJhbShtYXRjaGVzWzVdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwvL319fVxuXG4gICAgICAgIHN0cmluZ2lmeVBhcmFtOiBmdW5jdGlvbihwYXJhbSlcbiAgICAgICAgey8ve3t7XG4gICAgICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBwcm8gaW4gcGFyYW0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtVG9TdHJpbmcocmV0LCBwcm8sIHBhcmFtW3Byb10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldC5qb2luKCcmJyk7XG4gICAgICAgIH0sLy99fX1cblxuICAgICAgICBwYXJhbVRvU3RyaW5nOiBmdW5jdGlvbiAocmV0LCBrZXksIHZhbHVlKSBcbiAgICAgICAgey8ve3t7XG4gICAgICAgICAgICB2YXIgaSwgbiwgaztcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgbiA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyYW1Ub1N0cmluZyhyZXQsIGtleSArIFwiW1wiK2krXCJdXCIsIHZhbHVlW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyYW1Ub1N0cmluZyhyZXQsIGtleSArIFwiW1wiK2srXCJdXCIsIHZhbHVlW2tdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sLy99fX1cblxuICAgICAgICBzdHJpbmdUb1BhcmFtOiBmdW5jdGlvbiAoc3RyaW5nKSBcbiAgICAgICAgey8ve3t7XG4gICAgICAgICAgICB2YXIgcG0sIGksIG4sIHZhbHVlLCBwb3MsIGtleSwgcGFyYW0gPSB7fTtcbiAgICAgICAgICAgIHBtID0gc3RyaW5nLnNwbGl0KC8mLyk7XG4gICAgICAgICAgICBuID0gcG0ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIHBvcyA9IHBtW2ldLmluZGV4T2YoXCI9XCIpO1xuICAgICAgICAgICAgICAgIGtleSA9IHBtW2ldLnN1YnN0cigwLCBwb3MpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcG1baV0uc3Vic3RyKHBvcyArIDEsIHBtW2ldLmxlbmd0aCAtIHBvcyAtIDEpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1ba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHBhcmFtW2tleV0pID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbVtrZXldLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ba2V5XSA9IFtwYXJhbVtrZXldLCB2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhcmFtO1xuICAgICAgICB9LC8vfX19XG5cblxuICAgICAgICBhZGRQYXJhbXM6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcykgXG4gICAgICAgIHsvL3t7e1xuICAgICAgICAgICAgdmFyIHBhcmFtU3RyLCBtYXRjaGVzLCB1cmxQYXJhbTtcbiAgICAgICAgICAgIGlmICghdXJsKSByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIGlmICghcGFyYW1zKSBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZignIycpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoL1xcIy4qLywgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWF0Y2hlcyA9IHVybC5tYXRjaCgvXFw/KC4rKS8pO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlc1sxXSkge1xuICAgICAgICAgICAgICAgIHVybFBhcmFtID0gdGhpcy5zdHJpbmdUb1BhcmFtKG1hdGNoZXNbMV0pO1xuICAgICAgICAgICAgICAgIGlmICh1cmxQYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSB0aGlzLm1lcmdlVHdvUGFyYW10ZXJzKHVybFBhcmFtLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgvXFw/LisvLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyYW1TdHIgPSB0aGlzLnN0cmluZ2lmeVBhcmFtKHBhcmFtcyk7XG4gICAgICAgICAgICBpZiAoIXBhcmFtU3RyKSByZXR1cm4gdXJsO1xuICAgICAgICAgICAgaWYgKHVybC5tYXRjaCgvXFw/LykpIHtcbiAgICAgICAgICAgICAgICB1cmwgKz0gXCImXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVybCArPSBcIj9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVybCArPSBwYXJhbVN0cjtcbiAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH0sLy99fX1cblxuICAgICAgICBjb29raWVUb1N0cmluZzogZnVuY3Rpb24gKGNvb2tpZXMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSBbXSwga2V5O1xuICAgICAgICAgICAgaWYgKGNvb2tpZXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb29raWVzLmpvaW4oJzsgJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGNvb2tpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyLnB1c2goa2V5ICsgJz0nICsgY29va2llc1trZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyLmpvaW4oJzsgJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lcmdlVHdvUGFyYW10ZXJzOiBmdW5jdGlvbiAob2JqMSwgb2JqMilcbiAgICAgICAgey8ve3t7XG4gICAgICAgICAgICB2YXIgb2JqMyA9IHt9LCBhdHRybmFtZTtcbiAgICAgICAgICAgIGZvciAoYXR0cm5hbWUgaW4gb2JqMSkgeyBvYmozW2F0dHJuYW1lXSA9IG9iajFbYXR0cm5hbWVdOyB9XG4gICAgICAgICAgICBmb3IgKGF0dHJuYW1lIGluIG9iajIpIHsgb2JqM1thdHRybmFtZV0gPSBvYmoyW2F0dHJuYW1lXTsgfVxuICAgICAgICAgICAgcmV0dXJuIG9iajM7XG4gICAgICAgIH0vL319fVxuXG4gICAgfTtcblxuICAgIG1vZHVsZSA9IG1vZHVsZS5leHBvcnRzID0gbGliO1xufSgpKTtcblxuXG4iLCIvKiBnbG9iYWxzIEZvcm1EYXRhICovXG4vKlxuICpcbiAqICovXG5cInVzZSBzdHJpY3RcIjtcbkZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kPUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kfHxmdW5jdGlvbihiKXtpZih0eXBlb2YgdGhpcyE9PVwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihcIkZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlXCIpO312YXIgYT1BcnJheS5wcm90b3R5cGUuc2xpY2UsZj1hLmNhbGwoYXJndW1lbnRzLDEpLGU9dGhpcyxjPWZ1bmN0aW9uKCl7fSxkPWZ1bmN0aW9uKCl7cmV0dXJuIGUuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGM/dGhpczpifHx3aW5kb3csZi5jb25jYXQoYS5jYWxsKGFyZ3VtZW50cykpKTt9O2MucHJvdG90eXBlPXRoaXMucHJvdG90eXBlO2QucHJvdG90eXBlPW5ldyBjKCk7cmV0dXJuIGQ7fTtcblxuXG4oZnVuY3Rpb24gKCkge1xuLyoqKipcbiogb2JqLmFqYXgoXCJ0ZXN0R2V0XCIsIHtcInRlc3RcIjoxfSwgZnVuY3Rpb24gKGNvbnRlbnQpIHt9KTtcbiogb2JqLmFqYXhQb3N0KFwidGVzdFBvc3QucGhwXCIsIHtcInRlc3RcIjogMSwgXCJ0ZXN0MlwiOiAyfSx7fSwgZnVuY3Rpb24gKGNvbnRlbnQpIHt9KTtcblxuLy9SZWRpcmVjdCB0byBhbm90aGVyIHVybC5cbiogb2JqLmdldChcInRlc3RHZXRcIiwge1widGVzdFwiOjF9KTsgXG4qIG9iai5wb3N0KFwidGVzdFBvc3QucGhwXCIsIHtcInRlc3RcIjoxfSk7XG5cbioqKioqL1xuICAgIHZhciBsaWIgPSByZXF1aXJlKCcuL2xpYi5qcycpO1xuICAgIC8vdmFyIFEgPSByZXF1aXJlKCdxJyk7XG5cblxuICAgIGZ1bmN0aW9uIGxpZ2h0SHR0cCgpIHsvL3t7e1xuICAgICAgICBpZiAoIWxpYikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIGxpYnJhcnkgbmFtZWQgbGlnaHRIdHRwTGliXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuanNvbnBJbmRleCAgID0gMTtcbiAgICAgICAgdGhpcy5saWdodEh0dHBMaWIgPSBsaWI7IC8vd2luZG93LmxpZ2h0SHR0cExpYjtcbiAgICAgICAgdGhpcy50aW1lb3V0ICAgICAgPSAxNTAwMDsgLy8xNSBzZWNvbmRzXG4gICAgICAgIHRoaXMuanNvbnBDYWxsYmFja0xpc3QgPSB7fTtcbiAgICAgICAgdGhpcy51cGxvYWRGaWxlcyAgPSBbXTtcbiAgICB9Ly99fX1cblxuICAgIHZhciBvID0gbGlnaHRIdHRwLnByb3RvdHlwZTtcbiAgICBvLnVwbG9hZEZpbGVzID0gW107XG5cbiAgICBvLmFkZEZpbGUgPSBmdW5jdGlvbiAoZmllbGQsIGlucHV0KSBcbiAgICB7Ly97e3tcbiAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBsb2FkRmlsZXMucHVzaCh7XG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICBpbnB1dDogaW5wdXRcbiAgICAgICAgfSk7XG4gICAgfTsvL319fVxuXG4gICAgby5jbGVhciA9IGZ1bmN0aW9uICgpXG4gICAgey8ve3t7XG4gICAgICAgIHRoaXMudXBsb2FkRmlsZXMgPSBbXTtcbiAgICB9Oy8vfX19XG5cbiAgICBvLmNvbXBvc2VGb3JtRGF0YSA9IGZ1bmN0aW9uICh1cGxvYWRGaWxlcywgcGFyYW0pXG4gICAgey8ve3t7XG4gICAgICAgIHZhciBmLCBpICxuLCBpdCwga2V5O1xuICAgICAgICBmID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgIG4gPSB1cGxvYWRGaWxlcy5sZW5ndGg7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGl0ID0gdXBsb2FkRmlsZXNbaV07XG4gICAgICAgICAgICBmLmFwcGVuZChpdC5maWVsZCwgaXQuaW5wdXQuZmlsZXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoa2V5IGluIHBhcmFtKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtVG9Gb3JtRGF0YShmLCBrZXksIHBhcmFtW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmO1xuICAgIH07Ly99fX1cblxuICAgIG8ucGFyYW1Ub0Zvcm1EYXRhID0gZnVuY3Rpb24gKGZvcm1EYXRhLCBrZXkgLHZhbHVlLCBpc0h0bWxGb3JtKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgaSAsbiwgaztcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIG4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbVRvRm9ybURhdGEoZm9ybURhdGEsIGtleSArIFwiW1wiK2krXCJdXCIsIHZhbHVlW2ldLCBpc0h0bWxGb3JtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbVRvRm9ybURhdGEoZm9ybURhdGEsIGtleStcIltcIitrK1wiXVwiLCB2YWx1ZVtrXSwgaXNIdG1sRm9ybSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaXNIdG1sRm9ybSkge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQubmFtZSAgPSBrZXk7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07Ly99fX1cblxuICAgIG8uZ2V0ID0gZnVuY3Rpb24gKHVybCwgcGFyYW0pIFxuICAgIHsvL3t7e1xuICAgICAgICB1cmwgPSB0aGlzLmxpZ2h0SHR0cExpYi5hZGRQYXJhbXModXJsLCBwYXJhbSk7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgIH07Ly99fX1cblxuICAgIG8ucG9zdCA9IGZ1bmN0aW9uICh1cmwsIHBhcmFtKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgZm9ybSwga2V5LCBpbnB1dCwgaXNIdG1sRm9ybTtcbiAgICAgICAgaXNIdG1sRm9ybSA9IHRydWU7XG4gICAgICAgIGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgICAgIGZvcm0uYWN0aW9uID0gdXJsO1xuICAgICAgICBmb3JtLm1ldGhvZCA9IFwiUE9TVFwiO1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJhbSkge1xuICAgICAgICAgICAgaWYgKCFwYXJhbS5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXMucGFyYW1Ub0Zvcm1EYXRhKGZvcm0sIGtleSwgcGFyYW1ba2V5XSwgaXNIdG1sRm9ybSk7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcbiAgICAgICAgZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgfTsvL319fVxuXG4gICAgLyoqXG4gICAgICogYWpheDogbWFrZSBhIGFqYXggcmVxdWVzdFxuICAgICAqIEBwYXJhbSBzdHJpbmcgdXJsXG4gICAgICogQHBhcmFtIG9iamVjdCBwYXJhbVxuICAgICAqIEBwYXJhbSBvYmplY3QgaGVhZGVyXG4gICAgICogQHBhcmFtIGZ1bmN0aW9uIGNhbGxiYWNrXG4gICAgICovXG4gICAgby5hamF4ID0gZnVuY3Rpb24gKClcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIGFyZ3MgPSBbXCJhamF4XCIsIFwiR0VUXCJdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaTwgbGVuOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07Ly99fX1cblxuICAgIG8uYWpheHBvc3QgPSBvLmFqYXhQb3N0ID0gZnVuY3Rpb24gKClcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIGFyZ3MgPSBbXCJhamF4UG9zdFwiLCBcIlBPU1RcIl07XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpPCBsZW47IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTsvL319fVxuXG4gICAgby5wYWpheCA9IGZ1bmN0aW9uICgpIFxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgYXJncyA9IFtcInBqYXhcIiwgXCJHRVRcIl07XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpPCBsZW47IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTsvL319fVxuXG4gICAgby5qc29ucCA9IGZ1bmN0aW9uICh1cmwsIHBhcmFtLCBoZWFkZXIsIGNhbGxiYWNrKVxuICAgIHsvL3t7e1xuICAgICAgICB2YXIgc2NyaXB0LCBqc29ucENhbGxiYWNrLCBzZWxmO1xuICAgICAgICBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCFwYXJhbSkgcGFyYW0gPSB7fTtcbiAgICAgICAgaWYgKHR5cGVvZihoZWFkZXIpID09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2sgPSBoZWFkZXI7XG4gICAgICAgIHRoaXMuY2xlYW5Kc29ucENhbGxiYWNrKCk7XG5cbiAgICAgICAgLy8gSGFuZGxlIEpTT05QIGNhbGxiYWNrLlxuICAgICAgICBqc29ucENhbGxiYWNrID0gXCJsaWdodEh0dHBfanNvbnBfXCIgKyB0aGlzLmpzb25wSW5kZXggKyBcIl9cIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHBhcmFtWydjYWxsYmFjayddID0ganNvbnBDYWxsYmFjaztcbiAgICAgICAgdGhpcy5qc29ucENhbGxiYWNrTGlzdFtqc29ucENhbGxiYWNrXSA9IDA7XG4gICAgICAgIHdpbmRvd1tqc29ucENhbGxiYWNrXSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEsIHt9KTtcbiAgICAgICAgICAgIHNlbGYuanNvbnBDYWxsYmFja0xpc3RbanNvbnBDYWxsYmFja10gPSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIE1ha2UgdGhlIHJlcXVlc3QuXG4gICAgICAgIHVybCA9IHRoaXMubGlnaHRIdHRwTGliLmFkZFBhcmFtcyh1cmwsIHBhcmFtKTtcbiAgICAgICAgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgdGhpcy5qc29ucEluZGV4Kys7XG4gICAgfTsvL319fVxuXG4gICAgLypcbiAgICAgKiBuYW1lLCB0eXBlLCB1cmwsIHBhcmFtLCBoZWFkZXIsIGNhbGxiYWNrXG4gICAgKi9cbiAgICBvLnJlcXVlc3QgPSBmdW5jdGlvbiAoKSBcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIHR5cGUgPSBcIkdFVFwiLCB4aHIsIHVybCwgcGFyYW0sIGhlYWRlciwgbmFtZSxcbiAgICAgICAgICAgIGNhbGxiYWNrLCBwb3N0RGF0YSA9IFwiXCIsIGFzeW5jID0gdHJ1ZSwgXG4gICAgICAgICAgICBkZWZlciwgaXNQcm9taXNlID0gZmFsc2UsIGZvcm1EYXRhLFxuICAgICAgICAgICAgb3B0aW9ucyA9IHt9LCBhcmdzID0ge307XG4gICAgICAgIHZhciByZXNwSGFuZGxlciwgdGltZW91dEhhbmRsZXI7XG4gICAgICAgIC8vIEhhbmRsZSBBcmd1bWVudHNcbiAgICAgICAgaWYgKCFhcmd1bWVudHMpIHJldHVybiBcIlwiO1xuICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1swXSkgIT0gXCJ1bmRlZmluZWRcIikgbmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbMV0pICE9IFwidW5kZWZpbmVkXCIpIHR5cGUgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzJdKSAhPSBcInVuZGVmaW5lZFwiKSB1cmwgPSBhcmd1bWVudHNbMl07XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzNdKSAhPSBcInVuZGVmaW5lZFwiKSBwYXJhbSA9IGFyZ3VtZW50c1szXTtcbiAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbNF0pICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzRdKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGFyZ3VtZW50c1s0XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyID0gYXJndW1lbnRzWzRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzWzVdKSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1s1XSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBhcmd1bWVudHNbNV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbNV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbNl0pICE9IFwidW5kZWZpbmVkXCIpIGNhbGxiYWNrID0gYXJndW1lbnRzWzZdO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGFyZ3MuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlzUHJvbWlzZSAgPSB0cnVlO1xuICAgICAgICAgICAgZGVmZXIgICAgICA9IFEuZGVmZXIoKTtcbiAgICAgICAgICAgIGFyZ3MuZGVmZXIgPSBkZWZlcjtcbiAgICAgICAgfVxuICAgICAgICBhcmdzLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbiAgICAgICAgaWYgKHBhcmFtKSBhcmdzLnBhcmFtID0gcGFyYW07XG5cbiAgICAgICAgLy8gSGFuZGxlIFhNTCBIVFRQIFJlcXVlc3Qgb2JqZWN0XG4gICAgICAgIHhociA9IHRoaXMuaW5zdGFudGlhdGVSZXF1ZXN0KCk7XG4gICAgICAgIGFyZ3MueGhyID0geGhyO1xuICAgICAgICByZXNwSGFuZGxlciA9IHRoaXMucmVzcG9uc2VIYW5kbGVyLmJpbmQodGhpcywgYXJncyk7XG4gICAgICAgIHRpbWVvdXRIYW5kbGVyID0gdGhpcy50aW1lb3V0SGFuZGxlci5iaW5kKHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAoeGhyLnRpbWVvdXQpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB4aHIudGltZW91dCA9IG9wdGlvbnMudGltZW91dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSB0aGlzLnRpbWVvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub250aW1lb3V0ID0gdGltZW91dEhhbmRsZXI7XG4gICAgICAgIH1cbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHJlc3BIYW5kbGVyO1xuXG4gICAgICAgIC8vIEhhbmRsZSBIVFRQIHBheWxvYWRcbiAgICAgICAgaWYgKHRoaXMudXBsb2FkRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9ybURhdGEgPSB0aGlzLmNvbXBvc2VGb3JtRGF0YSh0aGlzLnVwbG9hZEZpbGVzLCBwYXJhbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwb3N0RGF0YSA9IHRoaXMubGlnaHRIdHRwTGliLnN0cmluZ2lmeVBhcmFtKHBhcmFtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBcIlBPU1RcIikge1xuICAgICAgICAgICAgeGhyLm9wZW4odHlwZSwgdXJsLCBhc3luYyk7XG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcnMoeGhyLCBoZWFkZXIpO1xuICAgICAgICAgICAgaWYgKGZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgICAgeGhyLnNlbmQoZm9ybURhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiKTtcbiAgICAgICAgICAgICAgICB4aHIuc2VuZChwb3N0RGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocG9zdERhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAodXJsLm1hdGNoKC9cXD8vKSkge1xuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gXCImXCIgKyBwb3N0RGF0YTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gXCI/XCIgKyBwb3N0RGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub3Blbih0eXBlLCB1cmwsIGFzeW5jKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyh4aHIsIGhlYWRlcik7XG4gICAgICAgICAgICB4aHIuc2VuZCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgaWYgKHRydWUgPT09IGlzUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XG4gICAgICAgIH1cbiAgICB9Oy8vfX19XG5cbiAgICBvLmluc3RhbnRpYXRlUmVxdWVzdCA9IGZ1bmN0aW9uICgpXG4gICAgey8ve3t7XG4gICAgICAgIHZhciB4aHI7XG4gICAgICAgIGlmICh3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHtcbiAgICAgICAgICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgIGlmICh4aHIub3ZlcnJpZGVNaW1lVHlwZSkge1xuICAgICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZSgndGV4dC94bWwnKTtcbiAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7XG4gICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHhociA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTXN4bWwyLlhNTEhUVFBcIik7XG4gICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgeGhyID0gbmV3IEFjdGl2ZVhPYmplY3QoXCJNaWNyb3NvZnQuWE1MSFRUUFwiKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZTIpIHt9XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geGhyO1xuICAgIH07Ly99fX1cblxuICAgIG8ucmVzcG9uc2VIYW5kbGVyID0gZnVuY3Rpb24oYXJncylcbiAgICB7Ly97e3tcbiAgICAgICAgdmFyIHJlc3AgPSBcIlwiLCByZXNwSW5mbyA9IHt9LCB4aHI7XG4gICAgICAgIHhociA9IGFyZ3MueGhyO1xuICAgICAgICAvL3hoci5nZXRSZXNwb25zZUhlYWRlcihcIkNvbm5lY3Rpb25cIilcbiAgICAgICAgLy9oZWFkZXIgPSB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCk7XG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICByZXNwSW5mbyA9IHhocjtcbiAgICAgICAgICAgIHJlc3AgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgaWYgKHRydWUgPT09IGFyZ3MuaXNQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgYXJncy5kZWZlci5yZXNvbHZlKHJlc3AsIHJlc3BJbmZvKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJncy5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGFyZ3MuY2FsbGJhY2socmVzcCwgcmVzcEluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTsvL319fVxuXG4gICAgby5zZXRIZWFkZXJzID0gZnVuY3Rpb24gKHhociwgaGVhZGVycylcbiAgICB7Ly97e3tcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKTtcbiAgICAgICAgfVxuXG4gICAgfTsvL319fVxuXG4gICAgby50aW1lb3V0SGFuZGxlciA9IGZ1bmN0aW9uIChhcmdzKVxuICAgIHsvL3t7e1xuICAgICAgICAvL3ZhciByZXNwSW5mbyA9IHt9O1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwidGltZW91dFwiKTtcbiAgICAgICAgLy9hcmdzLmlzVGltZW91dCA9IHRydWU7XG4gICAgICAgIC8vcmVzcEluZm8uZXJyTXNnID0gXCJ0aW1lb3V0XCI7XG4gICAgICAgIC8vcmVzcEluZm8uc3RhdHVzID0gNDA4O1xuICAgICAgICAvL2lmIChhcmdzLmNhbGxiYWNrKSBhcmdzLmNhbGxiYWNrKFwiXCIsIHJlc3BJbmZvKTtcbiAgICB9Oy8vfX19XG5cbiAgICBvLmpzb25wSGFuZGxlciA9IGZ1bmN0aW9uICgpIFxuICAgIHtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUganNvbnAgY2FsbGJhY2sgZnVuY3Rpb24gZnJvbSB3aW5kb3cgdG8gcHJldmVudCBtZW1vcnkgbGVhay5cbiAgICAgKi9cbiAgICBvLmNsZWFuSnNvbnBDYWxsYmFjayA9IGZ1bmN0aW9uICgpXG4gICAgey8ve3t7XG4gICAgICAgIHZhciBmdW5jO1xuICAgICAgICBmb3IgKGZ1bmMgaW4gdGhpcy5qc29ucENhbGxiYWNrTGlzdCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuanNvbnBDYWxsYmFja0xpc3RbZnVuY10gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZGVsZXRlICBqc29ucCBjYWxsYmFjayA9IFwiICsgZnVuYyk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHdpbmRvd1tmdW5jXTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTsvL319fVxuXG4gICAgd2luZG93LmxpZ2h0SHR0cCA9IGxpZ2h0SHR0cDtcbiAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZSA9IG1vZHVsZS5leHBvcnRzID0gbmV3IGxpZ2h0SHR0cCgpO1xuICAgICAgICBtb2R1bGUuY29uc3RydWN0b3IgPSBsaWdodEh0dHA7XG4gICAgfVxufSgpKTtcbiIsIihmdW5jdGlvbiAod2luLCBkb2MpIHtcbiAgICB2YXIgbGggPSByZXF1aXJlKCdsaWdodC1odHRwL2xpZ2h0SHR0cC1zaW1wbGUuanMnKTtcbiAgICB2YXIgc2VsZjtcbiAgICBmdW5jdGlvbiBpbWFnZVZpZXcoKSB7XG4gICAgICAgIHZhciBwYXJhbTtcbiAgICAgICAgdGhpcy5tYWluID0gZG9jLnF1ZXJ5U2VsZWN0b3IoXCIubWFpblwiKTtcbiAgICAgICAgdGhpcy5maWxlc1dyYXAgPSB0aGlzLm1haW4ucXVlcnlTZWxlY3RvcihcIi5maWxlcy13cmFwXCIpO1xuICAgICAgICB0aGlzLmRpcnNXcmFwID0gdGhpcy5tYWluLnF1ZXJ5U2VsZWN0b3IoXCIuZGlycy13cmFwXCIpO1xuICAgICAgICBpZiAoIXRoaXMubWFpbikge1xuICAgICAgICAgICAgdGhyb3cgXCJDYW4gbm90IGZpbmQgdGhlIGNsYXNzIG9mIC5tYWluXCI7XG4gICAgICAgICAgICByZXR1cm4gO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtID0gdGhpcy5nZXRQYXJhbWV0ZXJzKCk7XG4gICAgICAgIGlmIChwYXJhbSAmJiBwYXJhbS5wYXRoKSB7XG4gICAgICAgICAgICB0aGlzLnBhdGggPSBwYXJhbS5wYXRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wYXRoID0gXCJzcmNcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhhc1BhcmVudERpciA9ICh0aGlzLnBhdGggIT0gXCJzcmNcIikgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuICAgIHZhciBvID0gaW1hZ2VWaWV3LnByb3RvdHlwZTtcbiAgICBvLnByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmV0Y2hGaWxlTGlzdCgpOyBcbiAgICB9XG5cbiAgICBvLmZldGNoRmlsZUxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cmwsIGZpbGVIdG1sID0gW10sIGRpckh0bWwgPSBbXTtcbiAgICAgICAgdXJsID0gc2VsZi5wYXRoICsgXCIvZmlsZWxpc3QuanNvblwiO1xuICAgICAgICBsaC5hamF4KHVybCwgXCJcIiwgZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBjID0gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICAgICAgICAgIGlmICh0cnVlID09PSBzZWxmLmhhc1BhcmVudERpcikge1xuICAgICAgICAgICAgICAgIGRpckh0bWwucHVzaCgnPGRpdiBjbGFzcz1cImRpci13cmFwXCI+Jyk7XG4gICAgICAgICAgICAgICAgZGlySHRtbC5wdXNoKCc8YSBocmVmPVwiI1wiIG9uY2xpY2s9XCJoaXN0b3J5LmdvKC0xKTtyZXR1cm4gZmFsc2U7XCIgPi4uLzwvYT4nKTtcbiAgICAgICAgICAgICAgICBkaXJIdG1sLnB1c2goJzwvZGl2PicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYyAmJiBjLmRpcnMgJiYgYy5kaXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjLmRpcnMuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRoO1xuICAgICAgICAgICAgICAgICAgICBwYXRoID0gc2VsZi5wYXRoICsgXCIvXCIgKyBmaWxlO1xuICAgICAgICAgICAgICAgICAgICBkaXJIdG1sLnB1c2goJzxkaXYgY2xhc3M9XCJkaXItd3JhcFwiPicpO1xuICAgICAgICAgICAgICAgICAgICBkaXJIdG1sLnB1c2goJzxhIGhyZWY9XCI/cGF0aD0nK3BhdGgrJ1wiID4nK2ZpbGUrJzwvYT4nKTtcbiAgICAgICAgICAgICAgICAgICAgZGlySHRtbC5wdXNoKCc8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gXG5cbiAgICAgICAgICAgIGlmIChkaXJIdG1sKSBzZWxmLmRpcnNXcmFwLmlubmVySFRNTCA9IGRpckh0bWwuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgaWYgKGMgJiYgYy5maWxlcykge1xuICAgICAgICAgICAgICAgIGMuZmlsZXMuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmdWxsUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZnVsbFBhdGggPSBzZWxmLnBhdGggKyBcIi9cIiArIGZpbGU7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVIdG1sLnB1c2goJzxkaXYgY2xhc3M9XCJmaWxlLXdyYXBcIj4nKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZUh0bWwucHVzaCgnPGEgaHJlZj1cIicrZnVsbFBhdGgrJ1wiIHRhcmdldD1cIl9ibGFua1wiPicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZS5tYXRjaCgvXFwuKGpwZ3xwbmd8Z2lmfGpwZWcpLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVIdG1sLnB1c2goJzxpbWcgc3JjPVwiJytmdWxsUGF0aCsnXCIgLz4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaWxlSHRtbC5wdXNoKCc8L2E+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVIdG1sLnB1c2goJzwvZGl2PicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNlbGYuZmlsZXNXcmFwLmlubmVySFRNTCA9IGZpbGVIdG1sLmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG8uZ2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHF1ZXJ5ID0gbG9jYXRpb24uc2VhcmNoLnN1YnN0cigxKTtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHF1ZXJ5LnNwbGl0KFwiJlwiKS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBwYXJ0LnNwbGl0KFwiPVwiKTtcbiAgICAgICAgcmVzdWx0W2l0ZW1bMF1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGl0ZW1bMV0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHZhciBvYmogPSBuZXcgaW1hZ2VWaWV3KCk7XG4gICAgXG4gICAgb2JqLnByb2Nlc3MoKTtcbiBcbn0od2luZG93LCBkb2N1bWVudCkpXG4iXX0=
