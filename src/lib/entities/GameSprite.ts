import * as PIXI from 'pixi.js';
import RESOURCEMAN, { GameSpriteInfo } from '../ResourceManager';
import SCREENMAN from '../ScreenManager';
import Entity from './Entity';

/** Interface that describes anything that is drawable, including groups of sprites. */
export interface Drawable {
    addToStage(): this;
    removeFromStage(): this;
    isOnStage(): boolean;
    destroy(): void;
}

// Class to parent all sprite subsets
class GameSprite extends Entity implements Drawable {
    public static checkDependencies() {
        // We can't do anything if the resource manager isn't initialised
        if (!RESOURCEMAN.isDoneLoading()) { throw new Error('RESOURCEMAN has not finished loading'); }
    }

    protected sprite: PIXI.Sprite;
    protected onStage: boolean;

    public constructor(sprite: PIXI.Sprite) {
        super();

        this.sprite = sprite;
        this.onStage = false;

        this.sprite.zIndex = 0;  // be explicit

        // Anchor rotation around the center point
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
    }

    public destroy() {
        this.removeFromStage();
        super.destroy();
    }

    public isOnStage() { return this.onStage; }
    public getSprite() { return this.sprite; }
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

    public setZIndex(z: number) {
        this.sprite.zIndex = z;
        return this;
    }

    public update(deltaTime: number): this {
        // Basic sprite does nothing
        return this;
    }
}
export default GameSprite;
