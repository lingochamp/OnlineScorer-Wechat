function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function getResult(meta) {
  try {
    meta.result = eval('(' + b64DecodeUnicode(meta.result) + ')'); // eslint-disable-line no-eval
  } catch (e) {
  }

  if (meta.status === 0) {
    return {
      success: true,
      result: meta.result
    };
  }

  return {
    status: meta.status,
    success: false,
    msg: meta.msg
  };
}

export default getResult;
