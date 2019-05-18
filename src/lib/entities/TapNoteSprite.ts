import { NoteType } from '../NoteTypes';
import { TapNoteDirection, TAPNOTE_WIDTH_PX, LANE_MARGIN, directionToLaneIndex } from './EntitiesConstants';
import RESOURCEMAN, { DOWN_TAP_NOTE_SHEET_NAME } from '../ResourceManager';
import GameSprite from './GameSprite';
import ArrowEffects from '../ArrowEffects';
import { RECEPTOR_MARGIN_TOP_PX } from './TapNoteReceptorSprite';

const NOTESKIN = 'USWCelETT';

class TapNoteSprite extends GameSprite {
    private direction: TapNoteDirection;
    private noteType: NoteType;
    private noteBeat: number;


    /** Create a new tap note sprite.
     * @param direction the direction the arrow should go in.
     * @param noteType the type of note (4th, 16th, etc).
     * @param noteBeat the beat the note falls on.
     */
    constructor(direction: TapNoteDirection, noteType: NoteType, noteBeat: number) {
        super(RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_SHEET_NAME), noteType);

        this.direction = direction;
        this.noteType = noteType;
        this.noteBeat = noteBeat;  // TODO: NoteType can be derived by beat

        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);

        // Set the x based on the note track
        const laneIndex = directionToLaneIndex(this.direction);
        this.sprite.x = LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex);
        this.setYPosBasedOnBeat();

        // Ensure it starts animated
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
    public getNoteType() { return this.noteType; }
    public getBeat() { return this.noteBeat; }

    public setYPosBasedOnBeat() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        this.sprite.y = ArrowEffects.getYOffset(this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
    }

    public update(deltaTime: number) {
        // // 1 / 60 = 0.016 is when we move 3 px per frame. More than this and we move more, less and we move less.
        // // Multiply by FPS (60) to get the amount to move (more or less).
        // const movement = 3 * (deltaTime * 60);
        // this.sprite.y += movement;
        // this.sprite.y = 400; // TODO: base this off the beat the note is on so we can just create notes @ beats
        super.update(deltaTime);
        this.setYPosBasedOnBeat();
        return this;
    }
}
export default TapNoteSprite;
