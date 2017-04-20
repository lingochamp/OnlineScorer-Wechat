function getResult(meta) {
  try {
    meta.result = eval('(' + atob(meta.result) + ')'); // eslint-disable-line no-eval
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
