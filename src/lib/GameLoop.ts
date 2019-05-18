import GameTimer from './GameTimer';
import SOUNDMAN from './GameSoundManager';
import GAMESTATE from './GameState';
import RhythmAssist from './RhythmAssist';
import SCREENMAN from './ScreenManager';
import ENTITYMAN from './entities/EntityManager';

export const gGameplayTimer = new GameTimer();

/** Main rendering and update loop. */
class GameLoop {
    public static drawnArrow = false;
    public static drawnFrames = 0;
    public static totalTime = 0;
    public static gameLoop(outsideDeltaTime: number) {
        // TODO: do some comparisons to work out which is better
        // Seems like our deltaTime is more realistic. Theirs caps at 6 (100ms) due to minFPS?
        // We don't actually have a minFPS - will this be a problem? -Struz
        // For sound stuff our clock is better as it will give the real time elapsed (or closer to).
        GameLoop.drawnFrames++;
        const deltaTime = gGameplayTimer.getDeltaTime();
        GameLoop.totalTime += deltaTime;
        if (GameLoop.totalTime > 1) {
            GameLoop.totalTime = 0;
            GameLoop.drawnFrames = 0;
        }

        // Update SOUNDMAN early (before any RageSound::GetPosition calls), to flush position data.
        SOUNDMAN.update(deltaTime);

        GAMESTATE.update(deltaTime);
        RhythmAssist.playTicks();

        if (SCREENMAN.isReadyToDraw() && !this.drawnArrow) {
            // TODO: not sure where to put this
            SCREENMAN.showReceptors();

            this.drawnArrow = true;
        }

        ENTITYMAN.update(deltaTime);

        // TODO: process input if we get that far
        // TODO: draw screen based on state
    }
}
export default GameLoop;
