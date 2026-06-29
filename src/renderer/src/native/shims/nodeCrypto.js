const rotateLeft = (value, shift) => (value << shift) | (value >>> (32 - shift))

const sha1 = (text) => {
  const bytes = new TextEncoder().encode(text)
  const words = []
  for (let i = 0; i < bytes.length; i++) words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8)
  words[bytes.length >> 2] |= 0x80 << (24 - (bytes.length % 4) * 8)
  words[(((bytes.length + 8) >> 6) << 4) + 15] = bytes.length * 8

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16)
    for (let t = 16; t < 80; t++) w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1)

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (b & c) | (~b & d) : t < 40 ? b ^ c ^ d : t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const temp = (rotateLeft(a, 5) + f + e + k + (w[t] >>> 0)) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30) >>> 0
      b = a
      a = temp
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  return [h0, h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, '0')).join('')
}

export const createHash = (type) => {
  let value = ''
  return {
    update(input) {
      value += typeof input === 'string' ? input : new TextDecoder().decode(input)
      return this
    },
    digest(format) {
      if (type !== 'sha1') throw new Error(`Unsupported hash type in Tauri shim: ${type}`)
      const output = sha1(value)
      return format === 'hex' ? output : output
    }
  }
}

export default {
  createHash
}
