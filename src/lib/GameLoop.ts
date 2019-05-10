import GameTimer from './GameTimer';
import { SOUNDMAN } from './GameSoundManager';
import GAMESTATE from './GameState';
import RhythmAssist from './RhythmAssist';

export const gGameplayTimer = new GameTimer();

/** Main rendering and update loop. */
class GameLoop {
    public static gameLoop() {
        const deltaTime = gGameplayTimer.getDeltaTime();
        // Update SOUNDMAN early (before any RageSound::GetPosition calls), to flush position data.
        SOUNDMAN.update(deltaTime);

        GAMESTATE.update(deltaTime);
        RhythmAssist.playTicks();

        // TODO: process input if we get that far
        // TODO: draw screen based on state
    }
}
export default GameLoop;
