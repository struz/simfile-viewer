import SongPosition from './SongPosition';

/** The player's individual state. */
export class PlayerState {
    // Music statistics:
    public position = new SongPosition();
    // Stores the bpm that was picked for reading the chart if the player is using an mmod.
    public readBPM = 0;
}
export default PlayerState;
