const crypto = require('crypto');
const ALPHA_NUM = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function newUid(prefix, len = 16) {
    const rnd = crypto.randomBytes(len)
    const value = new Array(len)
    const charsLength = ALPHA_NUM.length

    for (let i = 0; i < len; i++) {
      value[i] = ALPHA_NUM[rnd[i] % charsLength]
    }
    return prefix + '_' + value.join('');
}

module.exports = newUid;
