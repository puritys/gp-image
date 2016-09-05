使用 Github Pages 來管理圖片
===============================

project name: gp-image   [[Demo Page](https://puritys.github.io/gp-image/)]

你是否有曾經遇過電腦硬碟壞掉，造成硬碟裡面的圖片全部不見，救不回來的情形，有一次公司 IT 把一台存放圖片的雲端硬碟刪除，造成圖片全數消失，還好我手上還有備份檔，為了避免慘狀再次發生，我改用 Github Pages 功能來存放所有的圖檔。

## 建立一個 Github Pages

點擊 Github 右上角有一個 Settings ，進入設定頁面，頁面往下拉就會看到 Automatic page generator (如下圖)，點下去就可以建立一個 Github Page ，過程中需要選擇 layout ，隨便選選就好。
<img src="https://puritys.github.io/gp-image/src/github/applyGhPages1.png">

## 將所有圖片上傳至 gh-pages 這個 branch 中的 "src" 目錄。

將預設建立的資料夾都刪除，自已建立一個 src 目錄，然後把圖片都放到這個目錄下。

## 使用 gp-image 自動產生 Web 介面與檔案列表

先安裝 gp-image

```javascript
npm install gp-image
```

建立基本的頁面與 UI，這個檔案只要做一次就好，除非 UI 有修改才需要重新建立。

```javascript
gpImage --init
```

建立檔案列表，執行時必需帶目錄(src) ，這個目錄下的所有資料夾都會建立一個叫 filelist.json 的檔案，全部 git add, commit 到 gh-pages 即可。 

```javascript
gpImage --find src
```
