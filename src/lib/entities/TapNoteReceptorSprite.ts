import TapNoteSprite from './TapNoteSprite';
import GameSprite from './GameSprite';
import RESOURCEMAN, { DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME } from '../ResourceManager';
import { TapNoteDirection } from '../NoteTypes';

class TapNoteReceptorSprite extends GameSprite {
    private direction: TapNoteDirection;

    /** Create a new tap note receptor sprite.
     * @param direction the direction the arrow should go in.
     */
    constructor(direction: TapNoteDirection) {
        GameSprite.checkDependencies();
        super(RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME));

        this.direction = direction;

        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
}
export default TapNoteReceptorSprite;
