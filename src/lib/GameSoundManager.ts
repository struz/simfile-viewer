import GAMESTATE from './GameState';
import NoteHelpers, { ROWS_PER_BEAT } from './NoteTypes';
import TimingData from './TimingData';
import { BPMSegment } from './TimingSegments';
import { EXPECTED_FPS } from './GameConstantsAndTypes';
import { DebugTools } from './Debug';
import SongSound from './SongSound';

/** The amount of time in seconds that is allowable to drift from
 * the playing music.
 */
const MAX_TOLERATED_DRIFT_SECS = (1 / EXPECTED_FPS) * 2; // 2 frames @ 60fps
const DRIFT_SECS_BEFORE_UPDATE = 0.05;

export class MusicPlaying {
    public music: SongSound;
    public timing: TimingData;

    public hasTiming = false;
    public applyMusicRate = false;

    // Anything else we need to sync up things

    constructor(music: Howl, timing: TimingData) {
        this.music = new SongSound(music);
        this.timing = timing;
    }

    public hasMusic() {
        return this.music !== undefined;
    }
}

export class MusicToPlay {
    public hasTiming = false;
    public timing: TimingData | undefined;

    public startSeconds = 0;
    public lengthSeconds = 0;
    public fadeInLengthSeconds = 0;
    public fadeOutLengthSeconds = 0;
    public forceLoop = false;
    public alignBeat = false;
    public applyMusicRate = false;

    // Unlike StepMania we pass in a preloaded, ready-to-play, bit of music
    public music: Howl | undefined;
}

export class GameSoundManager {
    // Singleton
    public static getInstance() {
        if (!GameSoundManager.instance) {
            GameSoundManager.instance = new GameSoundManager();
        }
        return GameSoundManager.instance;
    }
    private static instance: GameSoundManager;

    /** The music we're currently playing, if any. */
    private musicPlaying: MusicPlaying | undefined;
    /** Whether we are currently updating the song timer. When false we can pause / seek without
     * things going wonky.
     */
    private updatingTimer = false;

    /** The last processed beat that was crossed. An integer. */
    private beatLastCrossed = 0;

    /** Tracks the number of seconds we've been out of sync with the song for. If it
     * exceeds a threshold then we will forcibly resync.
     * This is necessary because the song timing updates are not frame-frequent.
     */
    private outOfSyncSecs = 0;

    // Private constructor for singleton pattern
    private constructor() {
        // Nothing to do here
    }

    public pauseMusic() {
        if (this.musicPlaying !== undefined) {
            this.musicPlaying.music.pause();
        }
    }

    public resumeMusic() {
        if (this.musicPlaying !== undefined) {
            this.musicPlaying.music.play();
        }
    }

    public musicSeek(seekTimeSeconds: number) {
        if (this.musicPlaying !== undefined) {
            this.musicPlaying.music.seek(seekTimeSeconds);
        }
    }

    public musicSkipforwards(seekTimeSeconds: number) {
        if (this.musicPlaying !== undefined) {
            const currentTimeSeconds = this.musicPlaying.music.getTimeElapsed();
            this.musicPlaying.music.seek(currentTimeSeconds + seekTimeSeconds);
        }
    }

    public getMusicTimeSeconds() {
        if (this.musicPlaying !== undefined) {
            return this.musicPlaying.music.getTimeElapsed();
        }
        return 0;
    }

    public getMusicTiming() {
        if (this.musicPlaying !== undefined) {
            return this.musicPlaying.timing;
        }
        return new TimingData();
    }

    public startMusic(toPlay: MusicToPlay) {
        // TODO: have a gate at the top that stops us playing the same file twice

        // Loading of music is taken care of elsewhere - it's already in memory
        if (toPlay.music === undefined || toPlay.music.state() !== 'loaded') {
            throw new Error('toPlay.music must be provided and loaded');
        }
        if (toPlay.timing === undefined) { throw new Error('toPlay.timing must be provided'); }
        const newMusic = new MusicPlaying(toPlay.music, toPlay.timing);

        // Omitted loop stuff from StepMania for now - we will need this eventually -Struz
        // Currently stuff like 24h crapyard scent streams won't render

        // If we have an active timer try to start on the next update. Otherwise, start now.
        // TODO ^

        newMusic.hasTiming = toPlay.hasTiming;
        newMusic.music.seek(toPlay.startSeconds);
        // TODO: support toPlay.lengthSeconds somehow
        // TODO: support fade in / fade out
        // TODO: support start times in the future which would be buffered with silence aka not playing.
        //       see RageSoundDriver_Generic_Software.cpp:88
        if (toPlay.forceLoop) {
            newMusic.music.getSound().loop(true);
        }

        newMusic.music.play();
        if (!toPlay.forceLoop) {
            // With loops this would fire on the end of each loop
            newMusic.music.getSound().on('end', () => {
                // When the song has ended, stop wasting processing cycles
                this.handleSongTimer(false);
            });
        }
        this.musicPlaying = newMusic;
    }

    public handleSongTimer(on: boolean) {
        this.updatingTimer = on;
    }
    public isHandlingSongTimer() { return this.updatingTimer; }

    // The idea here is to fake the sounds playing for now and just move the song position along
    public update(deltaTime: number) {
        if (!this.updatingTimer) { return; }

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

            const beatNow = Math.trunc(rowNow / ROWS_PER_BEAT);  // int

            for (let beat = this.beatLastCrossed + 1; beat <= beatNow; beat++) {
                // TODO: Broadcast "CrossedBeat" message for all beats crossed since the last update
                // Need some kind of message queue system but it's single threaded ...
                // Will fire multiple itmes if multiple beats have been crossed due to lag.
            }

            this.beatLastCrossed = beatNow;
        }

        this.resyncSongTimingWithMusicPosition(deltaTime);
    }

    public resyncSongTimingWithMusicPosition(deltaTime: number, updateIfMusicNotPlaying = false) {
        // If we've drifted too far from the song we need to speed up or slow down to meet it.
        // Because nobody is actually playing the song we can just teleport forwards or backwards.
        // If at any point people are actually playing we will need a more elegant method to sync
        // back up.

        // We don't want to do this unless the drift is signifiant or it could cause a lot of
        // teleporting arrows.

        // If we don't have anything to sync, bail out
        if (GAMESTATE.curSong === undefined || this.musicPlaying === undefined) { return; }
        // If the music isn't playing and we don't want to update if it's not playing, bail out
        if (!this.musicPlaying.music.getSound().playing() && !updateIfMusicNotPlaying) { return; }

        // TODO: work out if we should be using visible or regular here. I say regular because
        // we do modifications on that to work out what to show with global offset etc etc -Struz
        const musicPlayingPosSeconds = this.musicPlaying.music.getTimeElapsed();
        const drift = Math.abs(musicPlayingPosSeconds - GAMESTATE.position.musicSeconds);
        if (drift > MAX_TOLERATED_DRIFT_SECS) {
            // console.log(`drifted: ${drift * 1000}ms`);
            this.outOfSyncSecs += drift;

            // If we've been drifted for too long, resync
            if (this.outOfSyncSecs > DRIFT_SECS_BEFORE_UPDATE) {
                this.outOfSyncSecs = 0;
                // Always sync to the music rather than the other way around. It's less jarring.
                GAMESTATE.updateSongPosition(musicPlayingPosSeconds, this.musicPlaying.timing);
                console.log('resynced song to music');
                // DebugTools.PAUSE();
            }
        } else {
            this.outOfSyncSecs = 0;
        }
        // TODO: use averaging across update cycles to get the "real" song timing
        // since the timing reported by media objects is not particularly accurate.
        // We could also use literal timestamps i.e. Date, or resync from the startup
        // GameTimer.
    }
}
const SOUNDMAN = GameSoundManager.getInstance();
export default SOUNDMAN;
