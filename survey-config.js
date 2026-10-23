window.SURVEY_CONFIG = {
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSchkwGkWyiMbEgX8mKo9tgsprheZJftJVKG8UlztxMXeD_wtw/viewform',
  // IDs verified against the couple's prefilled link; choices also match screenshots.
  googleFields: {
    guestName: 'entry.2128613680',
    attendance: 'entry.357255704',
    guestCount: 'entry.853536165',
    message: 'entry.1949204995',
  },
  checkboxFields: ['attendance'],
  choiceValues: {
    attendance: {
      yes: '肯定去的辣',
      maybe: '我想想歐，可能要喬個時間',
      no: '那天無法到 私約一定到！',
    },
    guestCount: {'0':'0 位','1':'1 位','2':'2 位','3':'3 位','4':'4 位'},
  },
};
