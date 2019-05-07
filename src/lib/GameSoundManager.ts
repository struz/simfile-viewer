import GAMESTATE, { gPlayingSteps } from './GameState';
import NoteHelpers, { ROWS_PER_BEAT } from './NoteTypes';
import GameLoop from './GameLoop';

// GOOD SONG: Again and again
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
        GAMESTATE.updateSongPosition(GAMESTATE.position.musicSeconds + deltaTime
             * playbackRate, gPlayingSteps);
        // NOTE: the above is fudging, when actually playing music we will need to sync
        // by getting the seconds from the song.
        // return;

        //console.log(`musicSeconds=${GAMESTATE.position.musicSeconds}`);
        if (GameLoop.totalTime + deltaTime > GameLoop.lastSecondPassed + 1) {
            GameLoop.lastSecondPassed = GameLoop.totalTime + deltaTime;
            console.log(`musicSeconds=${GAMESTATE.position.musicSeconds}`);
        }

        // Send crossed messages
        if (GAMESTATE.curSong !== undefined) {
            const songBeat = GAMESTATE.position.songBeat;
            let rowNow = NoteHelpers.beatToNoteRowNotRounded(songBeat);
            rowNow = Math.max(0, rowNow);

            const beatNow = rowNow / ROWS_PER_BEAT;

            for (let beat = this.beatLastCrossed + 1; beat <= beatNow; beat++) {
                // Broadcast "CrossedBeat" message for all beats crossed since the last update
                // Need some kind of message queue system but it's single threaded ...
            }

            this.beatLastCrossed = beatNow;
        }
    }
}
export default GameSoundManager;

export const SOUNDMAN = GameSoundManager.getInstance();
