import * as PIXI from 'pixi.js';
import { NoteType } from './NoteTypes';
import RESOURCEMAN, { GameSprite, DOWN_TAP_NOTE_SHEET_NAME } from './ResourceManager';

const NOTESKIN = 'USWCelETT';
export const TAPNOTE_WIDTH_PX = 64;
export const TAPNOTE_HEIGHT_PX = 64;

export enum TapNoteDirection {
    DOWN,
    LEFT,
    UP,
    RIGHT,
}

class TapNoteSprite {
    private direction: TapNoteDirection;
    private noteType: NoteType;
    private sprite: PIXI.AnimatedSprite;
    private spriteDef: GameSprite;


    /** Create a new tap note sprite.
     * @param direction the direction the arrow should go in.
     * @param noteType the type of note (4th, 16th, etc).
     */
    constructor(direction: TapNoteDirection, noteType: NoteType) {
        // We can't do anything if the resource manager isn't initialised
        if (!RESOURCEMAN.isDoneLoading()) { throw new Error('RESOURCEMAN has not finished loading'); }

        this.direction = direction;
        this.noteType = noteType;

        this.spriteDef = RESOURCEMAN.getSpriteInfo(DOWN_TAP_NOTE_SHEET_NAME);
        this.sprite = new PIXI.AnimatedSprite(this.spriteDef.textures[noteType]);
        this.sprite.loop = true;
        // Translate frames of animation into an animation speed modifier
        this.sprite.animationSpeed = 1 / this.spriteDef.animLength;

        // Anchor rotation around the center point
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        // // Set the rotation based on the direction
        this.sprite.rotation = (90 * this.direction) * (Math.PI / 180);
        // // switch (this.direction) {
        // //     case TapNoteDirection.DOWN:
        // //     case TapNoteDirection.LEFT:
        // //     case TapNoteDirection.RIGHT:
        // //     case TapNoteDirection.UP:
        // // }
        // this.sprite.x = 300;
        // this.sprite.y = 300;
        this.sprite.play();
    }

    public getDirection() { return this.direction; }
    public getType() { return this.noteType; }
    public getSprite() { return this.sprite; }
}
export default TapNoteSprite;
