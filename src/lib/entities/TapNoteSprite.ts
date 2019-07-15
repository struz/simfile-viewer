import NoteHelpers, { NoteType } from '../NoteTypes';
import { TapNoteDirection, directionToLaneIndex, DEFAULT_NOTEFIELD_HEIGHT,
    getPosForLaneNumber,
    RECEPTOR_MARGIN_TOP_PX} from './EntitiesConstants';
import RESOURCEMAN, { DOWN_TAP_NOTE_SHEET_NAME } from '../ResourceManager';
import AnimatedGameSprite from './AnimatedGameSprite';
import ArrowEffects from '../ArrowEffects';
import GameSprite from './GameSprite';
import SCREENMAN from '../ScreenManager';

const NOTESKIN = 'USWCelETT';

class TapNoteSprite extends AnimatedGameSprite {
    private direction: TapNoteDirection;
    private noteType: NoteType;
    private noteBeat: number;


    /** Create a new tap note sprite.
     * @param direction the direction the arrow should go in.
     * @param noteBeat the beat the note lands on.
     */
    constructor(direction: TapNoteDirection, noteBeat: number) {
        GameSprite.checkDependencies();
        let noteType = NoteHelpers.beatToNoteType(noteBeat);
        if (noteType === NoteType.N_192ND) {
            // 192nd notes use the same sprite as 64th notes anyway
            noteType = NoteType.N_64TH;
        }
        super(RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_SHEET_NAME), noteType);

        this.direction = direction;
        this.noteType = noteType;
        this.noteBeat = noteBeat;

        // Ensure everything is set properly
        this.reset();

        // Ensure it starts animated
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
    public getNoteType() { return this.noteType; }
    public getBeat() { return this.noteBeat; }

    public reset() {
        // Set the scale of the sprite based on the notefield
        const scale = SCREENMAN.getScreenHeight() / DEFAULT_NOTEFIELD_HEIGHT;
        this.sprite.scale.set(scale, scale); // Lock aspect ratio
        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);
        // Set the x based on the note track
        this.sprite.x = getPosForLaneNumber(directionToLaneIndex(this.direction), scale);
        this.setYPosBasedOnBeat();

        return this;
    }

    public update(deltaTime: number) {
        // // 1 / 60 = 0.016 is when we move 3 px per frame. More than this and we move more, less and we move less.
        // // Multiply by FPS (60) to get the amount to move (more or less).
        // const movement = 3 * (deltaTime * 60);
        // this.sprite.y += movement;
        // this.sprite.y = 400; // TODO: base this off the beat the note is on so we can just create notes @ beats
        this.setYPosBasedOnBeat();
        return this;
    }

    private setYPosBasedOnBeat() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        this.sprite.y = ArrowEffects.getYOffset(this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
    }
}
export default TapNoteSprite;
