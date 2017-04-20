import axios from 'axios';

const jsApiList = [
  'startRecord',
  'stopRecord',
  'onVoiceRecordEnd',
  'uploadVoice',
  'playVoice',
  'stopVoice'
];

const wx = window.wx;
const wxApi = {};
let wxReady = false;

function wxconfig() {
  return axios.get('http://staging-telis.llsapp.com:8028/wxconfig', {
    params: {
      url: location.href.split('#')[0]
    }
  }).then(res => {
    if (wx) {
      const data = res.data;
      data.appId = data.appId || data.appid;
      data.nonceStr = data.nonceStr || data.noncestr;
      data.jsApiList = jsApiList;

      wx.config(data);
      return new Promise((resolve, reject) => {
        const readyFunc = () => {
          wxReady = true;
          resolve.apply(wx, arguments);
        };
        wx.ready(readyFunc);
        wx.error(reject);
      });
    }
  });
}

jsApiList.forEach(apiName => {
  wxApi[apiName] = () => {
    const apiArgs = arguments;
    callApi(() => {
      wx[apiName].apply(wx, apiArgs);
    });
  };
});

function callApi(apiCall) {
  if (wxReady) {
    apiCall();
  } else {
    wxconfig().then(apiCall);
  }
}

wxApi.init = wxconfig;

export default wxApi;
