import md5 from 'md5';
const HEX_CHARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'];

function randomHexStr(length) {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += HEX_CHARS[Math.floor(Math.random() * 16)];
  }

  return str;
}

function getMeta(item, secret, appId) {
  const salt = `${Math.floor(Date.now() / 1000)}:${randomHexStr(8)}`;
  const metaObj = {
    item: {
      ...item,
      quality: -1 // PCM
    },
    appID: appId,
    salt
  };

  const metaPrefix = JSON.stringify(metaObj);
  const hash = md5(`${appId}+${metaPrefix}+${salt}+${secret}`);
  return btoa(`${metaPrefix};hash=${hash}`);
}

export default getMeta;
