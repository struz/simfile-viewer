import TapNoteSprite from './TapNoteSprite';
import GameSprite from './GameSprite';
import RESOURCEMAN, { DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME } from '../ResourceManager';
import { TapNoteDirection, directionToLaneIndex, LANE_MARGIN, TAPNOTE_WIDTH_PX } from './EntitiesConstants';

export const RECEPTOR_MARGIN_TOP_PX = 32;

class TapNoteReceptorSprite extends GameSprite {
    private direction: TapNoteDirection;

    /** Create a new tap note receptor sprite.
     * @param direction the direction the arrow should go in.
     */
    constructor(direction: TapNoteDirection) {
        GameSprite.checkDependencies();
        super(RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME));

        this.direction = direction;
        this.sprite.alpha = 0.75;
        this.sprite.y = RECEPTOR_MARGIN_TOP_PX;

        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);

        // Set the x based on the note track
        const laneIndex = directionToLaneIndex(this.direction);
        this.sprite.x = LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex);

        this.sprite.play();
    }

    public getDirection() { return this.direction; }

    public update(deltaTime: number) {
        return this;
    }
}
export default TapNoteReceptorSprite;
