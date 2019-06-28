import axios from 'axios';
import { Howl } from 'howler';

const OGG_LOAD_TIMEOUT = 60000; // Milliseconds
const OGG_LOAD_POLL    = 200;   // Milliseconds

class FileOperations {
    public static loadTextFile(uri: string) {
        return axios.get(uri, {responseType: 'text'}).then((response) => {
            return response.data;
        });
    }

    /**
     * Load an ogg file as a howl.
     * @param uri The URI of the ogg file.
     * @param stream if true allow streaming the file.
     * @returns a promise which will return a Howl on successful completion.
     */
    public static loadOggFileAsHowl(uri: string, stream = false): Promise<Howl> {
        let loaded = false;
        let error: Error | null = null;
        const oggHowl = new Howl({
            src: [uri],
            html5: stream,
            onload: () => {
                loaded = true;
            },
            onloaderror: (_, msg) => {
                error = new Error(`error loading .ogg file at ${uri}: ${msg}`);
            },
        });

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timeout = OGG_LOAD_TIMEOUT;
            const checkLoaded = () => {
                if (loaded) {
                    console.log(`succesfully loaded .ogg file at ${uri}`);
                    resolve(oggHowl);
                } else if (error !== null) {
                    throw error;
                } else if (Date.now() > startTime + timeout) {
                    throw new Error(`timed out after ${timeout}ms while loading .ogg file at ${uri}`);
                } else {
                    setTimeout(checkLoaded, OGG_LOAD_POLL);
                }
            };
            checkLoaded();
        });
    }
}
export default FileOperations;
