(function (win, doc) {
    var lh = require('light-http/lightHttp-simple.js');
    var self;
    function imageView() {
        this.main = doc.querySelector(".main");
        this.filesWrap = this.main.querySelector(".files-wrap");
        if (!this.main) {
            throw "Can not find the class of .main";
            return ;
        }
        this.path = "src";
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

    var obj = new imageView();
    
    obj.process();
 
}(window, document))
