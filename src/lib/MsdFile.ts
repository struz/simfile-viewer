// The class that reads the various .SSC and .SM files

export class MsdFile {
    // Each value has multiple parameters
    private values: string[][] = [];

    constructor(data: string) {
        this.readBuffer(data, true);
    }

    // Get a param by index
    public getParam(valueIndex: number, paramIndex: number): string {
        return this.values[valueIndex][paramIndex];
    }

    // Get a value by index
    public getValue(valueIndex: number) {
        return this.values[valueIndex];
    }

    public getNumValues() {
        return this.values.length;
    }

    public getNumParams(valueIndex: number) {
        return this.values[valueIndex].length;
    }

    // Transcribed from StepMania source code to ensure it was done right
    // This could definitely be done in a more "JavaScript-ey" way
    private readBuffer(buf: string, unescape: boolean): void {
        let readingValue: boolean = false;
        let i: number = 0;
        let currentParam: string[] = [];

// tslint:disable-next-line: prefer-for-of
        while (i < buf.length) {
            // Detect and skip comments - from // onwards in a line
            if (i + 1 < buf.length && buf[i] === '/' && buf[i + 1] === '//') {
                do {
                    i++;
                }
                while (i < buf.length && buf[i] !== '\n');
                continue;
            }

            // Start reading a new value
            if (!readingValue && buf[i] === '#') {
                this.addValue();
                readingValue = true;
            }

            if (!readingValue) {
                if (unescape && buf[i] === '\\') {
                    i += 2;
                } else {
                    ++i;
                }
                continue; // Nothing else is meaningful outside of a value
            }

            // : and ; end the current param, if any
            if (currentParam.length > 0 && (buf[i] === ':' || buf[i] === ';')) {
                this.addParam(currentParam);
            }

            // # and : begin new params
            if (buf[i] === '#' || buf[i] === ':') {
                ++i;
                currentParam = [];
                continue;
            }

            // ; ends the current value
            if (buf[i] === ';') {
                readingValue = false;
                ++i;
                continue;
            }

            // We've gone through all the control characters.
            // All that is left is either an escaped character,
            // ie \#, \\, \:, etc., or a regular character.
            if (unescape && i < buf.length && buf[i] === '\\') {
                ++i;
            }
            if (i < buf.length) {
                currentParam.push(buf[i++]);
            }
        }

        // Add any unterminated value at the end
        if (readingValue) {
            this.addParam(currentParam);
        }
    }

    // Add a parameter to the last added value
    private addParam(param: string[]): void {
        this.values[this.values.length - 1].push( param.join('').trim() );
    }

    // Add a new value
    private addValue(): void {
        this.values.push([]);
    }
}
export default MsdFile;
