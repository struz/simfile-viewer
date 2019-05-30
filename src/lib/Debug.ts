import GAMESTATE from './GameState';
import SOUNDMAN from './GameSoundManager';
import { EXPECTED_FPS } from './GameConstantsAndTypes';

// Debug helpers

// Ideally we find a way to completely compile this out in certain builds
export function DEBUG_ASSERT(cond: boolean) {
    if (!cond) {
// tslint:disable-next-line: no-debugger
        debugger;
        console.debug('Debug assert failed.');
        console.trace();
    }
}

export function ASSERT(cond: boolean, message: string) {
    if (!cond) {
        throw new Error(message);
    }
}

// How to use the debug tools:
// 1. Put a DebugTools.PAUSE() call where you would normally want a breakpoint.
// 2. Use window.debugTools.FRAME_ADVANCE() to move forwards as you wish.
// 3. Use breakpoints via the debugger to place a breakpoint before advancing.
export class DebugTools {
    public static PAUSE() {
        GAMESTATE.pause();
        SOUNDMAN.pauseMusic();
// tslint:disable-next-line: no-debugger
        debugger;
    }
    public static PLAY() {
        GAMESTATE.play();
        SOUNDMAN.resumeMusic();
    }
    public static FRAME_ADVANCE(numFrames = 1) {
        const timeAdvanceSeconds = numFrames * (1 / EXPECTED_FPS);
        SOUNDMAN.musicSkipforwards(timeAdvanceSeconds);
        GAMESTATE.updateSongPosition(SOUNDMAN.getMusicTimeSeconds(), SOUNDMAN.getMusicTiming());
// tslint:disable-next-line: no-debugger
        debugger;
    }
}
