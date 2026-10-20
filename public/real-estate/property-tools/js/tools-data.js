/*
 * 阿布拉.凱｜房產安心查 V1.0
 *
 * 日後要新增網站，只要在 tools 陣列中複製一組 { ... } 並修改內容。
 * category 可使用：land-records、price-tax、building、land-use、risk
 * sourceType 可使用：official、professional、community
 */
window.ABRAKAI_PROPERTY_TOOLS = {
  version: "1.0",
  updatedAt: "2026-09-20",
  categories: [
    {
      id: "land-records",
      name: "地籍與謄本",
      shortName: "地籍謄本",
      icon: "▦",
      description: "查謄本、地籍圖、土地與建物參考資料"
    },
    {
      id: "price-tax",
      name: "房價與稅務",
      shortName: "房價稅務",
      icon: "％",
      description: "查成交行情、公告地價與稅額試算"
    },
    {
      id: "building",
      name: "建築相關查詢",
      shortName: "建築資訊",
      icon: "▥",
      description: "查綠建築、智慧建築與建築能效資料"
    },
    {
      id: "land-use",
      name: "國土與土地使用",
      shortName: "土地使用",
      icon: "⌖",
      description: "查國土圖資、土地位置與功能分區"
    },
    {
      id: "risk",
      name: "土地風險與環境",
      shortName: "環境風險",
      icon: "◇",
      description: "查液化、污染、山坡地、輻射屋與民間事故屋資訊"
    }
  ],
  tools: [
    {
      id: "land-transcript",
      category: "land-records",
      name: "電子謄本地政服務",
      url: "https://www.land.nat.gov.tw/",
      description: "申領電子謄本、查驗電子謄本及使用地政電傳資訊服務。部分服務需申請帳號或付費。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "電子謄本 地政 電傳 土地 建物 所有權 他項權利"
    },
    {
      id: "cadastral-map",
      category: "land-records",
      name: "地籍圖資網路便民服務系統",
      url: "https://easymap.moi.gov.tw/Home",
      description: "依地號、地址或地圖位置查詢地籍圖資，適合初步確認土地位置與周邊關係。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "地籍圖 地號 地址 定位 圖資 便民"
    },
    {
      id: "property-reference",
      category: "land-records",
      name: "土地、建物參考資訊檔",
      url: "https://moiref.moi.gov.tw/pubref/",
      description: "查詢土地及建物參考資訊；內容屬參考資料，正式產權仍應以地政機關核發謄本為準。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "土地 建物 參考資訊 地號 建號"
    },
    {
      id: "actual-price",
      category: "price-tax",
      name: "不動產交易實價登錄查詢",
      url: "https://lvr.land.moi.gov.tw/",
      description: "查詢房地買賣、租賃及預售屋實價登錄資料，作為區域行情與交易條件的參考。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "實價登錄 成交價 房價 租賃 預售屋 行情"
    },
    {
      id: "announced-land-value",
      category: "price-tax",
      name: "公告土地現值與公告地價",
      url: "https://www.land.moi.gov.tw/chhtml/landvalue/42",
      description: "由內政部地政司入口查詢各縣市公告土地現值與公告地價相關資訊。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "公告土地現值 公告地價 地價查詢"
    },
    {
      id: "land-value-tax",
      category: "price-tax",
      name: "土地增值稅試算",
      url: "https://www.etax.nat.gov.tw/etwmain/etw158w/51",
      description: "輸入相關條件估算土地增值稅。試算結果僅供參考，實際稅額仍以稅捐機關核定為準。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "土地增值稅 稅額 試算 稅務"
    },
    {
      id: "building-efficiency",
      category: "building",
      name: "綠建築、智慧建築與建築能效",
      url: "https://igbs-tabc.org/igbs/BERS.aspx",
      description: "依建築物名稱、地址、地號或行政區，查詢綠建築、智慧建築與建築能效標示資料。",
      sourceType: "professional",
      sourceLabel: "專業平台",
      keywords: "綠建築 智慧建築 建築能效 標章 地號 地址"
    },
    {
      id: "nlsc-map",
      category: "land-use",
      name: "國土測繪圖資服務雲",
      url: "https://maps.nlsc.gov.tw/",
      description: "整合臺灣通用電子地圖、正射影像及多種國土測繪圖層，方便進行位置與環境初查。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "國土測繪 圖資 地圖 正射影像 圖層 位置"
    },
    {
      id: "national-land-zoning",
      category: "land-use",
      name: "國土功能分區查詢系統",
      url: "https://nluz.nlma.gov.tw/ex3s/ExWeb.aspx",
      description: "依地號查詢國土功能分區及其分類資訊；查詢結果仍以主管機關公告內容為準。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "國土功能分區 土地使用 地號 分區 國土計畫"
    },
    {
      id: "soil-liquefaction",
      category: "risk",
      name: "土壤液化潛勢查詢",
      url: "https://www.liquid.net.tw/cgs/Web/Map.aspx",
      description: "透過地圖了解區域土壤液化潛勢，適合作為購屋與基地環境風險的初步參考。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "土壤液化 潛勢 地質 風險 地圖"
    },
    {
      id: "contaminated-sites",
      category: "risk",
      name: "土壤及地下水污染場址",
      url: "https://sgw.moenv.gov.tw/SgwSiteInfo/",
      description: "查詢列管土壤及地下水污染場址，協助初步了解土地及周邊環境紀錄。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "土壤 地下水 污染 場址 列管 環境"
    },
    {
      id: "slope-and-debris-flow",
      category: "risk",
      name: "山坡地與土石流潛勢查詢",
      url: "https://serv.ardswc.gov.tw/",
      description: "查詢山坡地、水土保持及土石流潛勢等資訊，了解土地周邊可能面臨的自然環境風險。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "山坡地 土石流 水土保持 潛勢 自然災害"
    },
    {
      id: "radiation-house",
      category: "risk",
      name: "輻射屋查詢系統",
      url: "https://ramdar.nusc.gov.tw/",
      description: "由核能安全委員會提供 1 毫西弗以上輻射屋地址查詢，供民眾進行初步查核。",
      sourceType: "official",
      sourceLabel: "政府官方",
      keywords: "輻射屋 輻射 地址 核能安全"
    },
    {
      id: "unlucky-house",
      category: "risk",
      name: "台灣凶宅網（民間資料）",
      url: "https://unluckyhouse.com/?styleid=1",
      description: "民間論壇彙整的事故屋相關資訊，內容可能不完整或未經官方認證，僅供交叉查詢，不宜作為唯一判斷依據。",
      sourceType: "community",
      sourceLabel: "民間資料・需複核",
      keywords: "凶宅 事故屋 非自然身故 民間資料 複核"
    }
  ]
};
