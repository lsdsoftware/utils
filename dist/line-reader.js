import { Writable } from "stream";
import { StringDecoder } from "string_decoder";
export function makeLineReader(lineCallback) {
    // Buffer for the part of the chunk that doesn't form a complete line.
    let remainder = '';
    const decoder = new StringDecoder();
    return new Writable({
        write(chunk, encoding, callback) {
            const chunkStr = remainder + decoder.write(chunk);
            const lines = chunkStr.split(/\r?\n/);
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
