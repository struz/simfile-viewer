import { TapNoteDirection, directionToLaneIndex, DEFAULT_NOTEFIELD_HEIGHT,
    getPosForLaneNumber,
    RECEPTOR_MARGIN_TOP_PX} from './EntitiesConstants';
import RESOURCEMAN, { TAP_MINE_SHEET_NAME } from '../ResourceManager';
import AnimatedGameSprite from './AnimatedGameSprite';
import ArrowEffects from '../ArrowEffects';
import GameSprite from './GameSprite';
import SCREENMAN from '../ScreenManager';

const NOTESKIN = 'USWCelETT';

class TapMineSprite extends AnimatedGameSprite {
    private direction: TapNoteDirection;  // Used for x position
    private noteBeat: number;

    /** Create a new mine sprite.
     * @param direction the direction the arrow should go in.
     * @param noteBeat the beat the mine lands on.
     */
    constructor(direction: TapNoteDirection, noteBeat: number) {
        GameSprite.checkDependencies();
        super(RESOURCEMAN.getSpriteInfo(TAP_MINE_SHEET_NAME), 0);

        this.direction = direction;
        this.noteBeat = noteBeat;

        // Ensure everything is set properly
        this.reset();

        // Ensure it starts animated
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
    public getBeat() { return this.noteBeat; }

    public reset() {
        // Set the scale of the sprite based on the notefield
        const scale = SCREENMAN.getScreenHeight() / DEFAULT_NOTEFIELD_HEIGHT;
        this.sprite.scale.set(scale, scale); // Lock aspect ratio
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

    // TODO: find a way to generalise this beat pos stuff across everything
    // that needs it

    // TODO: mines look silly when they disappear at the arrows - fix this

    private setYPosBasedOnBeat() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        this.sprite.y = ArrowEffects.getYOffset(this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
    }
}
export default TapMineSprite;
