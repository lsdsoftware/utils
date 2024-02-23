"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeLineReader = void 0;
const stream_1 = require("stream");
const string_decoder_1 = require("string_decoder");
function makeLineReader(lineCallback) {
    // Buffer for the part of the chunk that doesn't form a complete line.
    let remainder = '';
    const decoder = new string_decoder_1.StringDecoder();
    return new stream_1.Writable({
        //prevent auto-decoding string to Buffer, so processed chunk could be either string or Buffer
        decodeStrings: false,
        write(chunk, encoding, callback) {
            // encoding param here is irrelevant because it applies only to string chunks
            const chunkStr = remainder + decoder.write(chunk);
            const lines = chunkStr.split('\n');
            // Keep the last line in remainder if it doesn't end with a newline character.
            remainder = lines.pop();
            // Push each complete line.
            for (const line of lines)
                lineCallback(line);
            callback();
        },
        final(callback) {
            // When the stream is ending, push any remainder as a line if it's not empty.
            if (remainder)
                lineCallback(remainder);
            callback();
        }
    });
}
exports.makeLineReader = makeLineReader;
