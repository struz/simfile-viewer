import AnimatedGameSprite from './AnimatedGameSprite';
import RESOURCEMAN, { DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME } from '../ResourceManager';
import { TapNoteDirection, directionToLaneIndex, DEFAULT_NOTEFIELD_HEIGHT,
    getPosForLaneNumber,
    RECEPTOR_MARGIN_TOP_PX} from './EntitiesConstants';
import GameSprite from './GameSprite';
import SCREENMAN from '../ScreenManager';

class TapNoteReceptorSprite extends AnimatedGameSprite {
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

        // Ensure everything is set properly
        this.reset();

        // Ensure it starts animated
        this.sprite.play();
    }

    public getDirection() { return this.direction; }

    public reset() {
        // Set the scale of the sprite based on the notefield
        const scale = SCREENMAN.getScreenHeight() / DEFAULT_NOTEFIELD_HEIGHT;
        this.sprite.scale.set(scale, scale); // Lock aspect ratio
        // Set the rotation based on the direction, using the down arrow as a reference
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);
        // Set the x based on the note track
        this.sprite.x = getPosForLaneNumber(directionToLaneIndex(this.direction), scale);

        return this;
    }

    public update(deltaTime: number) {
        return this;
    }
}
export default TapNoteReceptorSprite;
