import axios from 'axios';
import getMeta from './getMeta';
import getResult from './getResult';
import wx from 'wx';

if (!wx) {
  throw new Error('未引入微信SDK');
}

const reuploadableVoices = {};

class WxRecorder {
  constructor({appId, accessToken, secret}) {
    this.appId = appId;
    this.accessToken = accessToken;
    this.secret = secret;
  }

  startRecord({question, onGetResult}) {
    this.onGetResult = onGetResult;

    this.question = question;
    wx.startRecord({
      cancel: () => {
        throw new Error('用户拒绝授权录音');
      }
    });

    // 如果录音时间超过一分钟
    wx.onVoiceRecordEnd({
      complete: this.uploadAndRate
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
    })
    .then(this.uploadAndRate)
    .catch(e => { // Stop fail
      this.onGetResult({
        localId,
        success: false,
        msg: `停止录音失败: ${e}`
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
      return this.rateVoice({
        serverId: res.serverId,
        localId
      });
    }).catch(e => {
      this.onGetResult({
        localId,
        success: false,
        msg: `上传失败: ${e}`
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
    return axios.post('http://wx.llsstaging.com/api/ratings', {
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
        msg: `打分报告获取失败：${e}`
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
