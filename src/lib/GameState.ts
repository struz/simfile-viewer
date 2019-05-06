import { PlayerNumber } from './PlayerNumber';
import TimingData from './TimingData';
import SongPosition from './SongPosition';
import { PlayerState } from './PlayerState';
import Helpers from './GameConstantsAndTypes';
import { GameTimer } from './GameTimer';
import { Steps } from './Steps';

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
        return GameState.instance;
    }
    private static instance: GameState;

    // Stuff used in gameplay
    public curSteps: Steps[]; // One inde per player; A broadcast on change pointer in C++
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
        this.curSteps = [];

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
        /* It's not uncommon to get a lot of duplicated positions from the sound
         * driver, like so: 13.120953,13.130975,13.130975,13.130975,13.140998,...
         * This causes visual stuttering of the arrows. To compensate, keep a
         * RageTimer since the last change. */
        if (positionSeconds === this.lastPositionSeconds && !this.paused) {
            positionSeconds += this.lastPositionTimer.ago();
        } else {
            this.lastPositionTimer.touch();
            this.lastPositionSeconds = positionSeconds;
        }

        this.position.updateSongPosition(positionSeconds, timing, timestamp);

        // TODO: fixme to be a FOREACH_EnabledPlayer
        // Just do p1 for now
        const pn = 0;
        if (this.curSteps.length) {
            this.playerState[pn].position.updateSongPosition(positionSeconds,
                this.curSteps[pn].timingData, timestamp);
            this.setPlayerBgmBeat(pn, this.playerState[pn].position.songBeatVisible,
                this.playerState[pn].position.songBeatNoteOffset);
        }
        this.setBgmTime(GameState.getInstance().position.musicSecondsVisible,
            GameState.getInstance().position.songBeatVisible,
            positionSeconds,
            GameState.getInstance().position.songBeatNoteOffset);
    }
}
export default GameState;