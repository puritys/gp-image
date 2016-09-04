killWatch:
	ps aux |grep watchify  |grep -v grep | awk '{print $$2}' | xargs -I%s -t -n 1  sudo kill -9 %s 2>&1 
	ps aux |grep watch-less  |grep -v grep | awk '{print $$2}' | xargs -I%s -t -n 1  sudo kill -9 %s 2>&1 

watch:
	gmake killWatch
	watchify src/js/default.js  -d -v -o dest/js/default.js &
	watch-less --output dest/css/  -d src/css/ --extension css &

less:
	lessc src/css/default.less > dest/css/default.css

browserify:
	browserify src/js/default.js  -o tmp.js 
	java -jar  /usr/local/lib/java/yuicompressor-2.4.6.jar --charset utf8 --type js -o dest/js/default.js tmp.js 
	rm tmp.js
