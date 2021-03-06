import { PlayerNumber } from './PlayerNumber';
import TimingData from './TimingData';
import SongPosition from './SongPosition';
import { PlayerState } from './PlayerState';
import Helpers from './GameConstantsAndTypes';
import { GameTimer, gZeroTimer } from './GameTimer';
import { Steps } from './Steps';
import Song from './Song';
import { NotImplementedError } from './Error';
import SOUNDMAN, { MusicToPlay } from './GameSoundManager';


/** Holds all the state about the game. A singleton. */
export class GameState {
    // Global state from Actors.h, might need moving to another place
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

    // The currently playing song, if any
    public curSong: Song | undefined;
    // curSong.songTiming has the timing data we care about

    // Stuff used in gameplay, they mean nothing if curSong is undefined
    public curSteps: Steps[]; // One index per player; A broadcast on change pointer in C++
    public position: SongPosition = new SongPosition();
    public selectedSteps: number;

    public hasteRate: number;

    // Options stuff (mods)
    // public songOptions: SongOptions;

    // PlayerState
    /** Allow access to each player's PlayerState. */
    public playerState: PlayerState[];

    /**
     * Is the game right now using Song timing or Steps timing?
     * Different options are available depending on this setting.
     */
    // Default to the song timing UNLIKE STEPMANIA. This is because
    // we haven't perfected the pass through chain to steps yet. -Struz
    public isUsingStepTiming = false;


    // Timing position corrections
    private lastPositionTimer = new GameTimer();
    private lastPositionSeconds = 0;
    private paused = false;

    private constructor() {
        this.curSteps = [];
        this.selectedSteps = 0;

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

    /** All the logic involved with loading a new song. */
    public loadNextSong(newSong: Song | undefined) {
        this.pause();
        SOUNDMAN.pauseMusic();
        this.resetMusicStatistics();
        if (newSong === undefined) {
            return;
        }

        this.setCurSong(newSong);
        // IMPORTANT: make the primitives and stuff?
        // Screen.setupSong()
        // Sets steps display
    }

    /** Change the current song. */
    public setCurSong(newSong: Song | undefined) {
        if (this.curSong !== undefined) {
            // TODO: release lookup data for the old song
            this.curSong.songTiming.releaseLookup();
        }
        console.log('changed song!');
        this.curSong = newSong;
        // TODO: broadcast song has changed.
        if (this.curSong !== undefined) {
            // TODO: request lookup data for the new song
            this.curSong.songTiming.prepareLookup();
        }
    }

    public play() { SOUNDMAN.handleSongTimer(true); }

    public pause() { SOUNDMAN.handleSongTimer(false); }
    public isPaused() { return !SOUNDMAN.isHandlingSongTimer(); }

    /** Update the game state.
     * @param delta The time that has passed since the last update.
     */
    public update(delta: number) {
        // FOREACH_PlayerNumber
        // TODO: fix this, just p1 for now
        this.playerState[0].update(delta);
    }

    public resetMusicStatistics() {
        this.position.reset();
        this.lastPositionTimer.touch();
        this.lastPositionSeconds = 0;

        this.setBgmTime(0, 0, 0, 0);
        // FOREACH_PlayerNumber
        // TODO: fix
        this.playerState[0].position.reset();
    }

    public getSongPercent(beat: number) {
        throw new NotImplementedError();
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

    public updateSongPosition(positionSeconds: number, timing: TimingData, timestamp: GameTimer = gZeroTimer) {
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

        // If we were paused then positionSeconds will be the same as before, so the following
        // updateSongPosition calls will be a no-op
        this.position.updateSongPosition(positionSeconds, timing, timestamp);

        // TODO: fixme to be a FOREACH_EnabledPlayer
        // Just do p1 for now
        const pn = 0;
        if (this.curSteps.length) {
            this.playerState[pn].position.updateSongPosition(positionSeconds,
                this.curSteps[pn].timingData, timestamp);
            this.setPlayerBgmBeat(pn, this.playerState[pn].position.songBeatVisible,
                this.playerState[pn].position.songBeatNoOffset);
        }
        this.setBgmTime(GAMESTATE.position.musicSecondsVisible,
            this.position.songBeatVisible,
            positionSeconds,
            this.position.songBeatNoOffset);
    }

    /**
     * Takes an already created Song and Howl and sets up the game ready to play them.
     * @param songData the Song to play.
     * @param songMusic the created Howl representing the sound file.
     * @param seek number of seconds to start playing at.
     */
    public loadSong(songData: Song, songMusic: Howl, seek?: number) {
        // TODO: IMPORTANT: write functions to ensure that a Song is loaded before we play the Music
        // See PlayMusic() in C++ for an example.
        this.loadNextSong(songData);

        const toPlay = new MusicToPlay();
        toPlay.music = songMusic;
        toPlay.hasTiming = true;
        toPlay.timing = songData.songTiming;
        if (seek !==  undefined) {
            toPlay.startSeconds = seek;
        }
        GAMESTATE.play();
        // TODO: don't always immediately start the song, have an init function instead
        SOUNDMAN.startMusic(toPlay);
    }
}
const GAMESTATE = GameState.getInstance();
export default GAMESTATE;
