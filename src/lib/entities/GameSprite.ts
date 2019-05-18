import * as PIXI from 'pixi.js';
import { GameSpriteInfo } from '../ResourceManager';
import SCREENMAN from '../ScreenManager';
import Entity, { checkGameDependencies } from './Entity';
import Drawable from './Drawable';

// Base class to parent all sprite subsets
// Is not an abstract class so that we can use it for basic drawing functionality
// and in GameSpriteGroup.
// TODO: make one level of abstraction up that is still abstract.
class GameSprite extends Entity implements Drawable {
    protected sprite: PIXI.AnimatedSprite;
    protected spriteDef: GameSpriteInfo;
    protected onStage: boolean;

    public constructor(spriteInfo: GameSpriteInfo, spriteIndex = 0) {
        checkGameDependencies();
        super();

        this.spriteDef = spriteInfo;
        this.sprite = new PIXI.AnimatedSprite(this.spriteDef.textures[spriteIndex]);
        this.onStage = false;

        // Anchor rotation around the center point
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;

        this.sprite.animationSpeed = 1 / this.spriteDef.animLength;
        this.sprite.loop = spriteInfo.animLoop;
        this.sprite.play();
    }

    public destroy() {
        this.removeFromStage();
        super.destroy();
    }

    public isOnStage() { return this.onStage; }
    public setPos(x: number, y: number) {
        this.sprite.x = x;
        this.sprite.y = y;
        return this;
    }
    public setPosX(x: number) {
        this.sprite.x = x;
        return this;
    }
    public setPosY(y: number) {
        this.sprite.y = y;
        return this;
    }
    public getPos(): [number, number] {
        return [this.sprite.x, this.sprite.y];
    }
    public addToStage() {
        if (this.onStage) { return this; }

        this.onStage = true;
        SCREENMAN.getPixiApp().stage.addChild(this.sprite);
        return this;
    }
    public removeFromStage() {
        if (!this.onStage) { return this; }

        this.onStage = false;
        SCREENMAN.getPixiApp().stage.removeChild(this.sprite);
        return this;
    }
    public setVisibility(visible: boolean) {
        this.sprite.visible = visible;
        return this;
    }

    public update(deltaTime: number) {
        // Does nothing, children MUST override this for any unique functionality
        return this;
    }

    public play(): this {
        this.sprite.play();
        return this;
    }
    public stop(): this {
        this.sprite.stop();
        return this;
    }
}
export default GameSprite;
