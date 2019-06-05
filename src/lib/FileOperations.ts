import axios from 'axios';
import { Howl } from 'howler';

class FileOperations {
    public static loadSmFile(url: string) {
        return axios.get(url, {responseType: 'text'}).then((response) => {
            return response.data;
        }).catch((error) => {
            console.error(`failed to load .sm file at ${url}: ${error}`);
        });
    }

    public static loadOggFile(url: string) {
        let loaded = false;
        let error = '';
        const oggHowl = new Howl({
            src: [url],
            onload: () => {
                loaded = true;
            },
            onloaderror: (_, msg) => {
                error = `error loading .ogg file at ${url}: ${msg}`;
            },
        });

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timeout = 60000; // milliseconds
            const checkLoaded = () => {
                if (loaded) {
                    console.log(`succesfully loaded .ogg file at ${url}`)
                    resolve(oggHowl);
                } else if (error !== '') {
                    reject(error);
                } else if (Date.now() > startTime + timeout) {
                    reject(`timed out after ${timeout}ms while loading .ogg file at ${url}`);
                } else {
                    setTimeout(checkLoaded, 200);
                }
            };
            checkLoaded();
        })
        .then((loadedOgg) => loadedOgg)
        .catch((msg) => {
            console.error(msg);
        });
    }
}
export default FileOperations;
