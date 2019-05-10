import GameTimer from './GameTimer';
import { SOUNDMAN } from './GameSoundManager';
import GAMESTATE from './GameState';
import RhythmAssist from './RhythmAssist';
import SCREENMAN from './ScreenManager';
import TapNoteSprite, { TapNoteDirection } from './TapNoteSprite';
import { NoteType } from './NoteTypes';

export const gGameplayTimer = new GameTimer();

/** Main rendering and update loop. */
class GameLoop {
    public static drawnArrow = false;
    public static gameLoop() {
        const deltaTime = gGameplayTimer.getDeltaTime();
        // Update SOUNDMAN early (before any RageSound::GetPosition calls), to flush position data.
        SOUNDMAN.update(deltaTime);

        GAMESTATE.update(deltaTime);
        RhythmAssist.playTicks();

        if (SCREENMAN.isReadyToDraw() && !this.drawnArrow) {
            const sprite = new TapNoteSprite(TapNoteDirection.UP, NoteType.N_8TH);
            sprite.getSprite().x = 200;
            sprite.getSprite().y = 32;
            SCREENMAN.getPixiApp().stage.addChild(sprite.getSprite());
            this.drawnArrow = true;
        }

        // TODO: process input if we get that far
        // TODO: draw screen based on state
    }
}
export default GameLoop;
