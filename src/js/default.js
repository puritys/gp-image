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
