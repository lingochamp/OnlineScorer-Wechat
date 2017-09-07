# 流利说在线录音打分微信版SDK介绍
微信版在线打分 sdk 支持对 readaloud 题型进行打分毕，录音结束后会提供打分报告以及音频localId。
录音结束有两种情况：
1. 调用stopRecord终止录音。
2. 录音时间超过微信语音限制，此时sdk会自动终止录音并返回打分报告。

## DEMO地址
http://hybrid.liulishuo.com/lls-wx-recorder/wx.html
![image](http://wx4.sinaimg.cn/mw690/6875a344ly1fez79mwcmzj207s07st8h.jpg)

## 微信SDK使用方法
### 引入
1. 在需要调用JS接口的页面引入微信SDK以及如下JS文件:  //cdn.llscdn.com/hybrid/lls-wx-recorder/llsWxRecorder-v1.1.1.js。或通过npm
```
  npm i lls-wx-recorder -S
```
2. 通过`wx.config`注入微信权限配置。录音打分SDK需要的权限包括
    - `startRecord`
    - `onVoiceRecordEnd`
    - `uploadVoice`

### 配置SDK
```javascript
  llsWxRecorder.init({
    secret: 'xx', // 必填, 需要提前协商好否则会验证失败
    accessToken: 'xxx', // 必填，公众号accessToken,用于获取录制的音频
    appId: 'xx' // 必填, 需要提前协商好否则会验证失败
  });
```

### 录音

| 参数名       | 类型    |  描述  |
|-------------|--------|--------|
|question|questionParam|不得为空|
|onGetResult|function(resp)|获得打分报告后的回调函数, 不得为空|
|onVoiceUpload|function(resp)|录音上传成功的回调，返回 wx.uploadVoice结果。选填|

#### questionParam
quetion种类：
1. 打分：type: `readaloud`，需提供音频对应的文本 `reftext`
```json
{
    "reftext": "Hope is a good thing",
    "type": "readaloud"
}
```
2. 明星音比对：仅需注明type。type `dubbing` 返回通用结果。
如果想返回定制化的结果请与技术团队沟通新增type，目前的制化type `xinhuashe`。
```json
{
    "type": "dubbing"
}
```

```javascript
  llsWxRecorder.startRecord({
    question: { // 必填，朗读句子内容
      reftext: 'Hope is a good thing'
      type: 'readaloud'
    },
    onGetResult: (resp) => { // 必填，获得打分报告后的回调函数
      var localId = resp.localId; // 音频 localId
      var serverId = resp.serverId; // 音频 serverId
      if (resp.success) {
        var result = resp.result; // 打分报告
      } else {
        // 打分失败，resp.status为错误码，resp.msg为失败原因
      }
    },
    onVoiceUpload: (resp) => {
      // 选填，录音上传成功的回调，返回 wx.uploadVoice结果
    }
  }).then(() => {
    // 录音开始
  });
```

### 停止录音
```javascript
  llsWxRecorder.stopRecord();
```

### 重新上传
打分失败，并且status不是`-20: 认证失败`时可重新上传音频。`serverId`为必填参数。

调用reupload成功的情形有：
- 录制完毕后在未刷新/关闭网页的情况下直接上传，此时会默认用本地记录的该音频对应的题目和获取打分回调
- 提供serverId, question信息以及onGetResult回调

```javascript
  llsWxRecorder.reupload({
      serverId: <serverId>, // 必填
      question: <question>, // 选填。如果不提供会用录制时所传的题目
      onGetResult: function(resp) { // 选填。如果不提供会用录制时所传的回调
        var serverId = resp.serverId; // 音频 serverId
        if (resp.success) {
          var result = resp.result; // 打分报告
        } else {
          // 打分失败，resp.status为失败原因
        }
      }
  });
```

## 打分报告信息
### question type 为 `readaloud`
```json
{
    "fluency": 99,
    "integrity": 100,
    "locale": "en",
    "overall": 100,
    "pronunciation": 100,
    "version": "2.1.0",
    "words": [
        {
            "scores": {
                "pronunciation": 100
            },
            "word": "i"
        },
        ...
    ]
}
```

### question type 为 `dubbing` 明星音比对，返回通用结果
```json
{
  "actors" : [
    {
       "audio" : "https://xxx",
       "role" : {
            "description" : "http://people.mtime.com/931838/",
            "gender" : "M",
            "name" : "Spencer Reid",
            "realname" : "Matthew Gray Gubler",
            "tvname" : "CriminalMinds",
            "url" : "http://img31.mtime.cn/pi/2015/02/07/114451.38663930_1000X1000.jpg"
         },
       "score" : 98.59364318847656
    },
    ...
  ]
}
```

### question type 为 `xinhuashe` 明星音比对，返回App结果
```json
{
  "actors" : [
    {
      "audio": "https://xxx",
      "role": {
      "actor": "小时候的安娜",
        "avatarUrl": "https://cdn.llscdn.com/FmF1YVIcqG21LXzEp2ZvSUXlP1c3",
        "courseId": "56fd4d42636f6e08e70000dd",
        "courseTitle": "《冰雪奇缘》",
        "dialogue": "Do you wanna build a snowman?",
        "movie": "《冰雪奇缘》"
      },
      "score" : 98.59364318847656
    },
    ...
  ]
}
```

## 打分失败原因
```
-1 - 参数有误
-20 - 认证失败
-30 - 请求过于频繁
-31 - 余额不足
-40 - 客户购买的资源已占满，当前请求无法实时处理
-99 - 计算资源不可用
-100 - 未知错误
-1000 - 微信sdk停止录音失败（`wx.stopRecord`抛出的异常）
-1001 - 微信sdk音频上传失败
-1002 - 打分报告获取失败
```
