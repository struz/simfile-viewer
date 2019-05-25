import * as PIXI from 'pixi.js';
import GameSprite, { Drawable } from './GameSprite';
import Entity from './Entity';
import {
    TapNoteDirection, directionToLaneIndex, LANE_MARGIN, TAPNOTE_WIDTH_PX,
    HOLD_BOTTOM_CAP_HEIGHT_PX } from './EntitiesConstants';
import RESOURCEMAN, {
    DOWN_HOLD_BODY_INACTIVE_SHEET_NAME, DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME } from '../ResourceManager';
import ArrowEffects from '../ArrowEffects';
import { RECEPTOR_MARGIN_TOP_PX } from './TapNoteReceptorSprite';

// Represents the tail portion of a hold note. The head is still a TapNote.
// It is an entity of its own, with sub-entities that are sprites.
class HoldTailSprite extends Entity implements Drawable {
    /** The direction of the arrow at the head of the hold. */
    protected direction: TapNoteDirection;
    /** The beat the head of this hold lands on. */
    protected noteBeat: number;
    /** The duration of this hold in beats. */
    protected duration: number;

    /** The sprite showing the body of the hold. */
    protected bodySprite: GameSprite;
    /** The sprite showing the bottom of the hold. */
    protected bottomCapSprite: GameSprite;

    /** Are we a candidate for rendering? */
    private onStage: boolean;
    /** The Y height of the hold. */
    private height: number;

    /**
     * @param direction the direction of the arrow at the head of the hold.
     * @param noteBeat the beat the head of this hold tail lands on.
     * @param duration the duration of the hold in beats.
     */
    public constructor(direction: TapNoteDirection, noteBeat: number, duration: number) {
        super();
        this.direction = direction;
        this.noteBeat = noteBeat;
        this.duration = duration;
        this.onStage = false;

        const bodySpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BODY_INACTIVE_SHEET_NAME);
        const bodySprite = new PIXI.TilingSprite(bodySpriteInfo.textures[0][0],
            bodySpriteInfo.width, bodySpriteInfo.height);
        this.bodySprite = new GameSprite(bodySprite);

        const capSpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME);
        const bottomCapSprite = new PIXI.Sprite(capSpriteInfo.textures[0][0]);
        this.bottomCapSprite = new GameSprite(bottomCapSprite);

        // Configure the sprite positions after creating the game sprites in case the constructor
        // changes placement at all.
        // Set the x based on the note track
        const laneIndex = directionToLaneIndex(this.direction);
        const laneX = LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex);
        bodySprite.x = laneX;
        bottomCapSprite.x = laneX;

        // Anchor to the top of the body sprite so we can position it properly
        // no matter how tall it is.
        bodySprite.anchor.y = 0;

        // Set the height of the hold
        this.height = this.calculateHoldHeight();
        // Because we anchor to the very top of the hold body as it can be of arbitrary length,
        // we need to take this into account to make sure it lines up with the hold cap
        // which is anchored in the middle (not the top).
        bodySprite.height = this.height - (HOLD_BOTTOM_CAP_HEIGHT_PX / 2);
        // TODO: my guess is that the code makes sure that the light portion at the end
        // of the repeating hold body texture always lines up with the light ending.
        // It probably repeats as necessary then squishes part of it so it'll always fit.
        // Investigate so that we can have nice looking holds.
        // Line 792 in NoteDisplay.cpp maybe? - yeah it uses a SCALE() call and shrinks the
        // texture Y before tiling it so that it looks nice.

        this.updateSprites();
    }

    public destroy() {
        this.removeFromStage();
        super.destroy();
    }

    public isOnStage() { return this.onStage; }
    public addToStage() {
        if (this.onStage) { return this; }

        this.onStage = true;
        // It is very important that the bottom cap is added first
        // If Z indexing is disabled this is the only way to ensure it draws below.
        this.bottomCapSprite.addToStage();
        this.bodySprite.addToStage();
        return this;
    }
    public removeFromStage() {
        if (!this.onStage) { return this; }

        this.onStage = false;
        this.bottomCapSprite.removeFromStage();
        this.bodySprite.removeFromStage();
        return this;
    }

    public update(deltaTime: number): this {
        this.updateSprites();
        return this;
    }

    private calculateHoldHeight() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        const headYPos = ArrowEffects.getYOffset(
            this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
        const capYPos = ArrowEffects.getYOffset(
            this.noteBeat + this.duration,
            peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
        return capYPos - headYPos;
    }

    private updateSprites() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        const headYPos = ArrowEffects.getYOffset(
            this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
        this.bodySprite.getSprite().y = headYPos;
        this.bottomCapSprite.setPosY(headYPos + this.height);
    }
}
export default HoldTailSprite;
