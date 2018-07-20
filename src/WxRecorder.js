import axios from 'axios';
import getMeta from './getMeta';
import getResult from './getResult';
import config from './config/production';

const STATUS_CODE = {
  STOP_ERROR: -1000,
  UPLOAD_ERROR: -1001,
  RATE_ERROR: -1002
};

const {RATE_HOST} = config;

let wx;

const reuploadableVoices = {};

class WxRecorder {
  constructor({appId, accessToken, secret, rateHost, context = window.wx}) {
    wx = context;
    if (!wx) {
      throw new Error('未引入微信SDK');
    }

    this.appId = appId;
    this.accessToken = accessToken;
    this.secret = secret;
    this.rateHost = rateHost || RATE_HOST;
  }

  startRecord({question, onGetResult, onVoiceUpload}) {
    this.onGetResult = onGetResult;
    if (typeof onVoiceUpload === 'function') {
      this.onVoiceUpload = onVoiceUpload;
    } else {
      this.onVoiceUpload = null;
    }

    this.question = question;

    // 如果录音时间超过一分钟
    wx.onVoiceRecordEnd({
      complete: this.uploadAndRate
    });

    return new Promise((resolve, reject) => {
      wx.startRecord({
        success: resolve,
        fail: reject,
        cancel: reject
      });
    });
  }

  // Stop record, upload voice and rate it
  stopAndRate() {
    let localId;

    return new Promise((success, fail) => {
      wx.stopRecord({
        success,
        fail
      });
    }).then(this.uploadAndRate)
      .catch(e => { // Stop fail
        this.onGetResult({
          localId,
          success: false,
          status: STATUS_CODE.STOP_ERROR,
          msg: e
        });
      });
  }

  uploadAndRate = res => {
    const localId = res.localId;
    // Upload voice
    return new Promise((success, fail) => {
      wx.uploadVoice({
        localId,
        success,
        fail
      });
    }).then(res => {
      if (this.onVoiceUpload) {
        this.onVoiceUpload(res);
      }

      return this.rateVoice({
        serverId: res.serverId,
        localId
      });
    }).catch(e => {
      this.onGetResult({
        localId,
        success: false,
        status: STATUS_CODE.UPLOAD_ERROR,
        msg: e
      });
    });
  }

  rateVoice = voiceInfo => {
    const {serverId} = voiceInfo;
    const reuploadableVoice = reuploadableVoices[serverId];
    let question;
    let onGetResult;
    if (reuploadableVoice) {
      question = reuploadableVoice.question;
      onGetResult = reuploadableVoice.onGetResult;
    } else {
      question = this.question;
      onGetResult = this.onGetResult;
    }

    const meta = getMeta(question, this.secret, this.appId);
    return axios.post(`${this.rateHost}/ratings`, {
      mediaId: serverId,
      accessToken: this.accessToken,
      meta
    }).then(res => {
      const report = getResult(res.data);
      const ret = ({
        ...voiceInfo,
        ...report
      });

      if (report.success) {
        delete reuploadableVoices[serverId];
      } else if (!reuploadableVoice) {
        // Store voice info that can be reuploaded
        reuploadableVoices[serverId] = {
          question,
          onGetResult: this.onGetResult
        };
      }

      onGetResult(ret);
    }).catch(e => {
      onGetResult({
        ...voiceInfo,
        success: false,
        status: STATUS_CODE.RATE_ERROR,
        msg: e
      });
    });
  }

  reupload = config => {
    const {serverId} = config;
    const voice = reuploadableVoices[serverId] || config;

    if (!serverId || !voice.onGetResult || !voice.question) {
      throw new Error('信息不足，无法重新上传音频');
    }

    reuploadableVoices[serverId] = voice;
    return this.rateVoice({serverId});
  }
}

export default WxRecorder;
