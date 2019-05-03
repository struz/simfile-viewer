import { PlayerNumber } from './PlayerNumber';
import TimingData from './TimingData';
import SongPosition from './SongPosition';
import { PlayerState } from './PlayerState';
import Helpers from './GameConstantsAndTypes';
import { GameTimer } from './GameTimer';

/** Holds all the state about the game. A singleton. */
export class GameState {
    // Global state from Actors, might need moving to another place
    public static currentBgmTime = 0;
    public static currentBgmBeat = 0;

    public static currentBgmTimeNoOffset = 0;
    public static currentBgmBeatNoOffset = 0;

    public static currentBgmBeatPlayer: number[] = []; // Max entries is PlayerNumber.NUM
    public static currentBgmBeatPlayerNoOffset: number[] = []; // Max entries is PlayerNumber.NUM
    // End global state from Actors

    // public static MUSIC_SECONDS_INVALID = -5000;

    // Singleton
    public static getInstance() {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
    }
    private static instance: GameState;

    // Stuff used in gameplay
    // public curSteps: steps[]; // A broadcast on change pointer in C++
    public position: SongPosition = new SongPosition();

    public hasteRate: number;

    // Options stuff (mods)
    // public songOptions: SongOptions;

    // PlayerState
    /** Allow access to each player's PlayerState. */
    public playerState: PlayerState[];

    /**
     * Is the game right now using Song timing or Steps timing?
     *
     * Different options are available depending on this setting.
     */
    public isUsingStepTiming = true;


    // Timing position corrections
    private lastPositionTimer = new GameTimer();
    private lastPositionSeconds = 0;
    private paused = false;

    private constructor() {
        this.playerState = [];
        for (const pn of Helpers.forEachEnum(PlayerNumber)) {
            this.playerState[pn] = new PlayerState();
            // this.playerState[pn].setPlayerNumber(pn);
        }
        this.hasteRate = 1.0;

        this.reset();
    }

    /** Reset the game state. */
    public reset() {
        this.paused = false;
    }

    public setBgmTime(time: number, beat: number, timeNoOffset: number, beatNoOffset: number) {
        GameState.currentBgmTime = time;
        GameState.currentBgmBeat = beat;

        /* This timer is generally only used for effects tied to the background music
         * when GameSoundManager is aligning music beats.  Alignment doesn't handle
         * g_fVisualDelaySeconds. */
        GameState.currentBgmTimeNoOffset = timeNoOffset;
        GameState.currentBgmBeatNoOffset = beatNoOffset;
    }

    public setPlayerBgmBeat(pn: PlayerNumber, beat: number, beatNoOffset: number) {
        GameState.currentBgmBeatPlayer[pn] = beat;
        GameState.currentBgmBeatPlayerNoOffset[pn] = beatNoOffset;
    }

    public updateSongPosition(positionSeconds: number, timing: TimingData, timestamp: GameTimer) {
        //
    }
}
export default GameState;
