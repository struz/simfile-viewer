import SongPosition from './SongPosition';
import GAMESTATE from './GameState';
import { PlayerNumber } from './PlayerNumber';

/** The player's individual state. */
export class PlayerState {
    public playerNumber = PlayerNumber.PLAYER_1;
    // Music statistics:
    public position = new SongPosition();
    // Stores the bpm that was picked for reading the chart if the player is using an mmod.
    public readBPM = 0;

    /** Update the player state based on the present time.
     * @param delta The current time.
     */
    public update(delta: number) {
        // This is all attack and mods stuff. We don't need it - Struz
    }

    public getDisplayedPosition() {
        if (GAMESTATE.isUsingStepTiming) { return this.position; }
        return GAMESTATE.position;
    }

    public getDisplayedTiming() {
        const steps = GAMESTATE.curSteps[this.playerNumber];
        // C++ code checked for undefined but we don't allow that here
        return steps.timingData;
    }
}
export default PlayerState;
