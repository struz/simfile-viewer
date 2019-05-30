import { Howl } from 'howler';
import { debug } from 'util';

// Simple wrapper for a playable song. This is so we can
// extend the functionality if we need to, for example
// by padding silence.
class SongSound {
    /** The actual song sound bytes. */
    protected sound: Howl;

    constructor(sound: Howl) {
        this.sound = sound;
    }

    public play(at?: number) {
        if (at !== undefined) {
            this.seek(at);
        }
        this.sound.play();
    }

    public pause() {
        this.sound.pause();
    }

    public seek(time: number) {
        this.sound.seek(time);
    }

    public getSound() { return this.sound; }
    public getTimeElapsed() {
        const timeElapsed = this.sound.seek() as number;
        return timeElapsed;
    }
}
export default SongSound;
