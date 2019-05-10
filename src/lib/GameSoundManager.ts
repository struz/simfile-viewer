import GAMESTATE, { GameState } from './GameState';
import NoteHelpers, { ROWS_PER_BEAT } from './NoteTypes';

export class GameSoundManager {
    // Singleton
    public static getInstance() {
        if (!GameSoundManager.instance) {
            GameSoundManager.instance = new GameSoundManager();
        }
        return GameSoundManager.instance;
    }
    private static instance: GameSoundManager;

    /** The last processed beat that was crossed. */
    private beatLastCrossed = 0;

    // Private constructor for singleton pattern
    private constructor() {
        // Nothing to do here
    }

    // The idea here is to fake the sounds playing for now and just move the song position along
    public update(deltaTime: number) {
        const playbackRate = 1.0;
        // If we have some timing data then we can update the song position
        // TODO: once we're past the end of the song probably stop doing this
        if (GAMESTATE.curSong !== undefined) {
            GAMESTATE.updateSongPosition(GAMESTATE.position.musicSeconds + deltaTime
                    * playbackRate, GAMESTATE.curSong.songTiming);
        }
        // NOTE: the above is fudging and hoping, when actually playing music we *may* need to sync
        // by getting the seconds from the song.

        // Send crossed messages
        if (GAMESTATE.curSong !== undefined) {
            const songBeat = GAMESTATE.position.songBeat;
            let rowNow = NoteHelpers.beatToNoteRowNotRounded(songBeat);
            rowNow = Math.max(0, rowNow);

            const beatNow = rowNow / ROWS_PER_BEAT;

            for (let beat = this.beatLastCrossed + 1; beat <= beatNow; beat++) {
                console.log('crossedbeat');
                // Broadcast "CrossedBeat" message for all beats crossed since the last update
                // Need some kind of message queue system but it's single threaded ...

                // This occurs when a lot of beats have been crossed between updates and allows
                // us to do things like look for all the notes that must have passed.
                // This occurs when we change tabs and change back, for example. -Struz
            }

            this.beatLastCrossed = beatNow;
        }
    }
}
export default GameSoundManager;
export const SOUNDMAN = GameSoundManager.getInstance();
