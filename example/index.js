/* eslint  no-alert:0 */
import React, {Component, PropTypes} from 'react';
import {render} from 'react-dom';
import axios from 'axios';
import sha1 from 'sha1';
import config from 'config';
import wxApi from './wxConfig';

import './styles/theme.scss';

const {wx, llsWxRecorder: wxRecorder} = window;

const question = {
  type: 'readaloud',
  reftext: 'Hope is a good thing'
};

class Input extends Component {
  static propTypes = {
    attr: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    placeholder: ''
  }

  handleChange = e => {
    this.props.onChange(this.props.attr, e.target.value);
  }

  render() {
    const {attr, placeholder} = this.props;
    return (
      <input
        className="api-test-input"
        placeholder={placeholder || attr}
        onChange={this.handleChange}
        />
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jssdkOk: false,
      reuploadServerId: null
    };
  }

  componentDidMount() {
    if (wx) {
      wxApi.init().then(() => {
        this.setState({
          jssdkOk: true
        });
      })
      .catch(e => alert(JSON.stringify(e)));
    } else {
      this.setState({
        jssdkOk: false
      });
    }
  }

  handleInitApi = () => {
    // Get accessToken
    const timestamp = Math.floor(Date.now() / 1000);
    const array = [config.appId, config.secret, String(timestamp)];
    const signature = sha1(array.sort().join(''));

    axios.get(config.accessTokenApi, {
      params: {
        app_id: config.appId, // eslint-disable-line camelcase
        timestamp,
        signature
      }
    }).then(res => {
      wxRecorder.init({
        appId: this.state.appId,
        accessToken: res.data.access_token,
        secret: this.state.secret
      });
    }).catch(res => alert(res));
  }

  handleStartRecord = () => {
    this.localId = null;
    wxRecorder.startRecord({
      question,
      onGetResult: this.handleGetResult
    });
  }

  handleGetResult = res => {
    alert('rate: ' + JSON.stringify(res));
    const {serverId} = res;
    this.localId = res.localId;

    if (res.status < 0) {
      // Reupload
      this.setState({
        reuploadServerId: serverId
      });
    }

    if (res.success && this.state.reuploadServerId === serverId) {
      this.setState({
        reuploadServerId: null
      });
    }
  }

  handleStopRecord = () => {
    wxRecorder.stopRecord();
  }

  handlePlayVoice = () => {
    if (typeof this.localId === 'string') {
      wx.playVoice({
        localId: this.localId
      });
    } else {
      alert('No audio available!');
    }
  }

  handleReupload = () => {
    wxRecorder.reupload({
      serverId: this.state.reuploadServerId
    });
  }

  handleStateChange = (attr, value) => {
    this.setState({
      [attr]: value
    });
  }

  renderReupload() {
    if (this.state.reuploadServerId) {
      return (
        <button
          className="api-test-btn"
          onClick={this.handleReupload}
          >
          Reupload {this.state.reuploadServerId}
        </button>
      );
    }
  }

  render() {
    return (
      <div className="native-apis-list">
        {this.state.jssdkOk ? 'jssdkOK' : 'jssdk can`t work'}
        <p>{question.reftext}</p>
        <Input
          attr="appId"
          onChange={this.handleStateChange}
          />
        <Input
          attr="secret"
          placeholder="secret(密码)"
          onChange={this.handleStateChange}
          />
        <button
          className="api-test-btn"
          onClick={this.handleInitApi}
          >
          init
        </button>
        <button
          className="api-test-btn"
          onClick={this.handleStartRecord}
          >
          Start Record
        </button>
        <button
          className="api-test-btn"
          onClick={this.handleStopRecord}
          >
          Stop Record
        </button>
        {this.renderReupload()}
        <button
          className="api-test-btn"
          onClick={this.handlePlayVoice}
          >
          Play Voice
        </button>
      </div>
    );
  }
}

render((<App/>), document.getElementById('page'));
