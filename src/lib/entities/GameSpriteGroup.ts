import Drawable from './Drawable';
import GameSprite from './GameSprite';
import { GameSpriteInfo } from '../ResourceManager';
import Entity, { checkGameDependencies } from './Entity';

// Parameters for creating a GameSpriteGroup
export interface GameSpriteGroupDef {
    x: number;  // x of sprite relative to top left of the group
    y: number;  // y of sprite relative to top left of the group
    spriteInfo: GameSpriteInfo;
    spriteNum: number;
}

// Class to parent all sprite group subsets
class GameSpriteGroup extends Entity implements Drawable {
    protected sprites: GameSprite[];
    protected onStage: boolean;
    protected x: number;
    protected y: number;

    constructor(spriteDefs: GameSpriteGroupDef[]) {
        checkGameDependencies();
        super();
        this.sprites = [];
        this.onStage = false;
        this.x = 0;
        this.y = 0;
        // Create the sprites according to the given definitions
        for (const spriteDef of spriteDefs) {
            const sprite = new GameSprite(spriteDef.spriteInfo, spriteDef.spriteNum);
            sprite.setPosX(spriteDef.x);
            sprite.setPosY(spriteDef.y);
            sprite.play(); // play by default
            this.sprites.push(sprite);
        }
    }

    public isOnStage(): boolean {
        return this.onStage;
    }
    public removeFromStage(): this {
        if (!this.onStage) { return this; }
        this.sprites.forEach((sprite) => sprite.removeFromStage());
        return this;
    }
    public addToStage(): this {
        if (this.onStage) { return this; }
        this.sprites.forEach((sprite) => sprite.addToStage());
        return this;
    }
    public setVisibility(visible: boolean): this {
        this.sprites.forEach((sprite) => sprite.setVisibility(visible));
        return this;
    }

    public setPosX(x: number): this {
        const diff = this.x - x;
        this.x = x;
        // Move each sprite by the amount we've just moved to keep the positions
        this.sprites.forEach((sprite) => {
            const pos = sprite.getPos();
            sprite.setPosX(pos[0] + diff);
        });
        return this;
    }
    public setPosY(y: number): this {
        const diff = this.y - y;
        this.y = y;
        // Move each sprite by the amount we've just moved to keep the positions
        this.sprites.forEach((sprite) => {
            const pos = sprite.getPos();
            sprite.setPosY(pos[1] + diff);
        });
        return this;
    }
    public setPos(x: number, y: number): this {
        this.setPosX(x);
        this.setPosY(y);
        return this;
    }
    public getPos(): [number, number] {
        return [this.x, this.y];
    }

    public play(): this {
        this.sprites.forEach((sprite) => sprite.play());
        return this;
    }
    public stop(): this {
        this.sprites.forEach((sprite) => sprite.stop());
        return this;
    }

    public update(deltaTime: number): this {
        // Does nothing, children MUST override this for any unique functionality
        return this;
    }
}
export default GameSpriteGroup;
