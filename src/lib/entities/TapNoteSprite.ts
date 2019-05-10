import { NoteType, TapNoteDirection } from '../NoteTypes';
import RESOURCEMAN, { GameSpriteInfo, DOWN_TAP_NOTE_SHEET_NAME } from '../ResourceManager';
import GameSprite from './GameSprite';

const NOTESKIN = 'USWCelETT';

class TapNoteSprite extends GameSprite {
    private direction: TapNoteDirection;
    private noteType: NoteType;


    /** Create a new tap note sprite.
     * @param direction the direction the arrow should go in.
     * @param noteType the type of note (4th, 16th, etc).
     */
    constructor(direction: TapNoteDirection, noteType: NoteType) {
        GameSprite.checkDependencies();
        super(RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_SHEET_NAME), noteType);

        this.direction = direction;
        this.noteType = noteType;

        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
    public getNoteType() { return this.noteType; }
}
export default TapNoteSprite;
