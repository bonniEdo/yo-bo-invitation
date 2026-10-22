// 公開設定檔：不要放密碼、金鑰或賓客名單。
window.WEDDING_CONFIG = {
  INVITATION: {
    isSample: false,
    coupleNames: '鑫佑 & 宛瑩',
    englishNames: 'Walker & Bonnie',
    date: '2027-06-19',
    welcomeTime: '12:00', // 入座
    banquetTime: '12:30', // 午宴開席
    endTime: '15:00',
    replyBy: '2027-04-30', // 原稿截止日期，請確認
    venueName: '晶宴・御豐館',
    venueRoom: '',
    venueAddress: '300新竹市東區光復里公道五路三段1號2樓',
    venueNote: '點選導航，從你的位置出發。',
    mapsUrl: 'https://maps.app.goo.gl/zR6kXYtcgetRcxKTA?g_st=ic', // 新人提供的場地定位
    mapsQuery: '晶宴會館御豐館 300新竹市東區光復里公道五路三段1號2樓',
    // 圖片順序：封面、故事照片 1、2、3。
    photos: ['assets/walker-bonnie.jpg', 'assets/story-confetti.png', 'assets/story-champagne-upright.png', 'assets/story-courtyard.png'],
    lineOfficialUrl: '', // 填入 LINE 官方帳號的加入好友連結（https://lin.ee/…）後顯示
    rsvpEndpoint: '', // 綁定 Google 表單的 Apps Script 網頁應用程式 /exec 網址；空白時背景送出但無法確認存檔
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdkKuTSGS_u79FWXt1khwJmPGU2kSHNyYj_vrZDTjfjGS4UZg/viewform',
  },
};
