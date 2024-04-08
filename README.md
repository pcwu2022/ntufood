## NTU 台大餐廳隨機選擇器
Created by `pcwu2022`

你，每次吃飯都會選擇困難嗎？

從水源市場走到台大正門再走回水源市場還是找不到自己要吃什麼嗎？

輸入你想去的地方、選擇你想要的風格，系統會幫你隨機排序，幫你完成這個困擾你每一天的選擇！

### 程式執行快速上手

1. 安裝必要的套件
    ```bash
    npm install --all
    ```
2. 編輯 `generate/data.csv` （用 Microsoft Excel 開啟會更方便！）
3. 生成前端資料（如果有更改到 data.csv 一定要做這一步！）

    ```bash
    npm run generate
    ```
4. 啟動 node.js 伺服器
    ```bash
    npm run server
    ```
5. 打開 http://localhost:8080 就可以看到了！

### 程式運作方式介紹

由於網站是架在 Github 的 Static Websites 上，因此沒有辦法支援 node.js 伺服器以及任何形式的動態資料庫。目前的解決方法如下：

1. 在測試時使用 `index.js` 當作後端的伺服器，並利用 `generate/datagenerate.js` 將 `generate/data.csv` 的資料轉成 JSON 格式
2. 在 Deploy 的時候， Github 會找 root 資料夾裡面的 `index.html` 檔案，而這個檔案所引用到的 CSS 和 JS ，以及 JSON 都在 `frontend`資料夾裡面
3. 由於 Safari 似乎沒辦法從前端讀取 JSON 檔案（目前還不知道是不是 Safari 的問題但 Chrome 和 Edge 都可以正常使用），因此 `generate/datagenerate.js` 同時也生成一份 `frontend/data.js` 替代 `frontend/data.json` 由於資料量不大，可以直接用 import 的方式以動態變數的形式匯入到主程式 `script.js` 中

### 程式架構

- `index.html`: 主頁面的前端 HTML
- `index.js`: 測試使用，正式 Deploy 不會用到
- `generate/`
    - `datagenerate.js`: 生成 data.js 與 data.json 使用
    - `data.csv`: 給人看的檔案，可以用 Microsoft Excel 開啟
- `frontend/`
    - `data.js`: 資料庫（生成檔）
    - `enum.js`: 中文英文轉換
    - `map.js`: 操作 [Leaflet](https://leafletjs.com/)地圖
    - `script.js`: `index.html`引用的 JS 檔
    - `data.json`: 資料庫（生成檔）
    - `style.css`: `index.html`引用的 CSS 檔

[Contribute to us on Github!](https://github.com/pcwu2022/ntufood)