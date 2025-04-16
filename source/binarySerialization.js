class BinarySerializer {
    #encoder
    #tempDataView
    #tempBytes
    #data

    constructor(data = []) {
        this.#encoder = new TextEncoder()
        this.#tempDataView = new DataView(new ArrayBuffer(8))
        this.#tempBytes = new Uint8Array(this.#tempDataView.buffer)
        this.#data = Array.from(data)
    }

    writeUint8(value)    { this.#data.push((value      ) & 0xFF) }
    writeUint16LE(value) { this.#data.push((value      ) & 0xFF)
                           this.#data.push((value >>  8) & 0xFF) }
    writeUint32LE(value) { this.#data.push((value      ) & 0xFF)
                           this.#data.push((value >>  8) & 0xFF)
                           this.#data.push((value >> 16) & 0xFF)
                           this.#data.push((value >> 24) & 0xFF) }
    writeUint64LE(value) { value = BigInt(value)
                           this.#data.push(Number((value       ) & 0xFFn))
                           this.#data.push(Number((value >>  8n) & 0xFFn))
                           this.#data.push(Number((value >> 16n) & 0xFFn))
                           this.#data.push(Number((value >> 24n) & 0xFFn))
                           this.#data.push(Number((value >> 32n) & 0xFFn))
                           this.#data.push(Number((value >> 40n) & 0xFFn))
                           this.#data.push(Number((value >> 48n) & 0xFFn))
                           this.#data.push(Number((value >> 56n) & 0xFFn)) }
    writeUint16BE(value) { this.#data.push((value >>  8) & 0xFF)
                           this.#data.push((value      ) & 0xFF) }
    writeUint32BE(value) { this.#data.push((value >> 24) & 0xFF)
                           this.#data.push((value >> 16) & 0xFF)
                           this.#data.push((value >>  8) & 0xFF)
                           this.#data.push((value      ) & 0xFF) }
    writeUint64BE(value) { value = BigInt(value)
                           this.#data.push(Number((value >> 56n) & 0xFFn))
                           this.#data.push(Number((value >> 48n) & 0xFFn))
                           this.#data.push(Number((value >> 40n) & 0xFFn))
                           this.#data.push(Number((value >> 32n) & 0xFFn))
                           this.#data.push(Number((value >> 24n) & 0xFFn))
                           this.#data.push(Number((value >> 16n) & 0xFFn))
                           this.#data.push(Number((value >>  8n) & 0xFFn))
                           this.#data.push(Number((value       ) & 0xFFn)) }

    writeInt8(value)    { return this.writeUint8(value) }
    writeInt16LE(value) { return this.writeUint16LE(value) }
    writeInt32LE(value) { return this.writeUint32LE(value) }
    writeInt64LE(value) { return this.writeUint64LE(value) }
    writeInt16BE(value) { return this.writeUint16BE(value) }
    writeInt32BE(value) { return this.writeUint32BE(value) }
    writeInt64BE(value) { return this.writeUint64BE(value) }

    writeFloat32LE(value) {
        this.#tempDataView.setFloat32(0, value, true)
        this.#data.push(
            this.#tempBytes[0],
            this.#tempBytes[1],
            this.#tempBytes[2],
            this.#tempBytes[3]
        );
    }

    writeFloat32BE(value) {
        this.#tempDataView.setFloat32(0, value, false)
        this.#data.push(
            this.#tempBytes[0],
            this.#tempBytes[1],
            this.#tempBytes[2],
            this.#tempBytes[3]
        );
    }

    writeFloat64LE(value) {
        this.#tempDataView.setFloat64(0, value, true)
        this.#data.push.apply(this.#data, this.#tempBytes)
    }

    writeFloat64BE(value) {
        this.#tempDataView.setFloat64(0, value, false)
        this.#data.push.apply(this.#data, this.#tempBytes)
    }

    writeUnsignedBytes(bytes) {
        for (const byte of bytes) {
            this.writeUint8(byte)
        }
    }

    writeStringUTF8(string) {
        const buffer = this.#encoder.encode(string)
        this.#data.push.apply(this.#data, buffer)
    }

    data() { return this.#data }
    bytes() { return new Uint8Array(this.#data) }
    arrayBuffer() { return new Uint8Array(this.#data).buffer }
}

class BinaryDeserializer {
    #data
    #bytes
    #offset
    #dataView
    #decoder

    constructor (data = []) {
        this.#data = data
        this.#bytes = new Uint8Array(data)
        this.#dataView = new DataView(this.#bytes.buffer)
        this.#decoder = new TextDecoder()
        this.#offset = 0
    }

    setOffset(offset) { this.#offset = offset }

    readUint8(offset = this.#offset)     { this.#offset = offset + 1; return this.#dataView.getUint8(offset); }
    readUint16LE(offset = this.#offset)  { this.#offset = offset + 2; return this.#dataView.getUint16(offset, true); }
    readUint32LE(offset = this.#offset)  { this.#offset = offset + 4; return this.#dataView.getUint32(offset, true); }
    readUint64LE(offset = this.#offset)  { this.#offset = offset + 8; return this.#dataView.getBigUint64(offset, true); }
    readUint16BE(offset = this.#offset)  { this.#offset = offset + 2; return this.#dataView.getUint16(offset, false); }
    readUint32BE(offset = this.#offset)  { this.#offset = offset + 4; return this.#dataView.getUint32(offset, false); }
    readUint64BE(offset = this.#offset)  { this.#offset = offset + 8; return this.#dataView.getBigUint64(offset, false); }

    readUint8(offset = this.#offset)     { this.#offset = offset + 1; return this.#dataView.getUint8(offset); }
    readUint16LE(offset = this.#offset)  { this.#offset = offset + 2; return this.#dataView.getUint16(offset, true); }
    readUint32LE(offset = this.#offset)  { this.#offset = offset + 4; return this.#dataView.getUint32(offset, true); }
    readUint64LE(offset = this.#offset)  { this.#offset = offset + 8; return this.#dataView.getBigUint64(offset, true); }
    readUint16BE(offset = this.#offset)  { this.#offset = offset + 2; return this.#dataView.getUint16(offset, false); }
    readUint32BE(offset = this.#offset)  { this.#offset = offset + 4; return this.#dataView.getUint32(offset, false); }
    readUint64BE(offset = this.#offset)  { this.#offset = offset + 8; return this.#dataView.getBigUint64(offset, false); }

    readFloat32LE(offset = this.#offset) { this.#offset = offset + 4; return this.#dataView.getFloat32(offset, true) }
    readFloat64LE(offset = this.#offset) { this.#offset = offset + 8; return this.#dataView.getFloat64(offset, true) }
    readFloat32BE(offset = this.#offset) { this.#offset = offset + 4; return this.#dataView.getFloat32(offset, false) }
    readFloat64BE(offset = this.#offset) { this.#offset = offset + 8; return this.#dataView.getFloat64(offset, false) }

    readStringUTF8(length = 0, offset = this.#offset) {
        this.#offset = offset + length
        const buffer = this.#bytes.subarray(offset, offset + length)
        return this.#decoder.decode(buffer)
    }
    
    data() { return this.#data }
    bytes() { return this.#bytes }
    arrayBuffer() { return this.#bytes.buffer }
}