import * as PIXI from 'pixi.js';
import { TAPNOTE_WIDTH_PX, TAPNOTE_HEIGHT_PX } from './entities/EntitiesConstants';
import SCREENMAN from './ScreenManager';

// Images used for sprites
// Tap notes
import DownReceptor from '@/assets/noteskins/USWCelETT/_Down_Receptor_Go_4x1.png';
import DownTapNote from '@/assets/noteskins/USWCelETT/_Down_Tap_Note_16x8.png';
import TapMine from '@/assets/noteskins/common/Fallback_Tap_Mine_8x1.png';
// Holds
import DownHoldBodyActive from '@/assets/noteskins/USWCelETT/Down_Hold_Body_Active.png';
import DownHoldBodyInactive from '@/assets/noteskins/USWCelETT/Down_Hold_Body_Inactive.png';
import DownHoldBottomCapActive from '@/assets/noteskins/USWCelETT/Down_Hold_BottomCap_active.png';
import DownHoldBottomCapInactive from '@/assets/noteskins/USWCelETT/Down_Hold_BottomCap_inactive.png';
// Rolls
import DownRollBodyActive from '@/assets/noteskins/USWCelETT/_Down_Roll_Body_active_4x1.png';
import DownRollBodyInactive from '@/assets/noteskins/USWCelETT/Down_Roll_Body_Inactive.png';
import DownRollBottomCapActive from '@/assets/noteskins/USWCelETT/_Down_Roll_BottomCap_active_4x1.png';
import DownRollBottomCapInactive from '@/assets/noteskins/USWCelETT/Down_Roll_BottomCap_Inactive.png';

interface LoadSpriteInfo {
    name: string;
    textureUrl: string;
    width: number;
    height: number;
    numSprites: number;
    numAnimFrames: number;
    animLength: number; // number of frames before advancing to the next anim sprite
    animLoop: boolean;
}

export interface GameSpriteInfo {
    name: string;
    width: number;
    height: number;
    animLength: number;
    animLoop: boolean;
    textures: PIXI.Texture[][]; // sprites can have sub-sprites (i.e. all the arrow colours)
}

// Tap note resources
export const DOWN_TAP_NOTE_SHEET_NAME = 'DownTapNoteSheet';
export const DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME = 'DownReceptorSheet';
export const TAP_MINE_SHEET_NAME = 'TapMineSheet';

// Hold note resources
export const DOWN_HOLD_BODY_ACTIVE_SHEET_NAME = 'DownHoldBodyActiveSheet';
export const DOWN_HOLD_BODY_INACTIVE_SHEET_NAME = 'DownHoldBodyInactiveSheet';
export const DOWN_HOLD_BOTTOM_CAP_ACTIVE_SHEET_NAME = 'DownHoldBottomCapActiveSheet';
export const DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME = 'DownHoldBottomCapInactiveSheet';

/** List of all the textures we need to load. */
const SPRITE_DEFINITIONS: LoadSpriteInfo[] = [
    // Tap notes
    {
        name: DOWN_TAP_NOTE_SHEET_NAME,
        textureUrl: DownTapNote,
        width: TAPNOTE_WIDTH_PX,
        height: TAPNOTE_HEIGHT_PX,
        numSprites: 8,
        numAnimFrames: 16,
        animLength: 2,
        animLoop: true,
    },
    {
        name: DOWN_TAP_NOTE_RECEPTOR_SHEET_NAME,
        textureUrl: DownReceptor,
        width: TAPNOTE_WIDTH_PX,
        height: TAPNOTE_HEIGHT_PX,
        numSprites: 1,
        numAnimFrames: 4,
        animLength: 30,
        animLoop: true,
    },
    {
        name: TAP_MINE_SHEET_NAME,
        textureUrl: TapMine,
        width: TAPNOTE_WIDTH_PX,
        height: TAPNOTE_HEIGHT_PX,
        numSprites: 1,
        numAnimFrames: 8,
        animLength: 3,
        animLoop: true,
    },
    // Holds
    {
        name: DOWN_HOLD_BODY_ACTIVE_SHEET_NAME,
        textureUrl: DownHoldBodyActive,
        width: TAPNOTE_WIDTH_PX,
        height: 128,
        numSprites: 1,
        numAnimFrames: 1,
        animLength: 1,
        animLoop: false,
    },
    {
        name: DOWN_HOLD_BODY_INACTIVE_SHEET_NAME,
        textureUrl: DownHoldBodyInactive,
        width: TAPNOTE_WIDTH_PX,
        height: 128,
        numSprites: 1,
        numAnimFrames: 1,
        animLength: 1,
        animLoop: false,
    },
    {
        name: DOWN_HOLD_BOTTOM_CAP_ACTIVE_SHEET_NAME,
        textureUrl: DownHoldBottomCapActive,
        width: TAPNOTE_WIDTH_PX,
        height: 32,
        numSprites: 1,
        numAnimFrames: 1,
        animLength: 1,
        animLoop: false,
    },
    {
        name: DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME,
        textureUrl: DownHoldBottomCapInactive,
        width: TAPNOTE_WIDTH_PX,
        height: 32,
        numSprites: 1,
        numAnimFrames: 1,
        animLength: 1,
        animLoop: false,
    },
];

/** Handles loading the resources we need to make things happen. */
class ResourceManager {
    // Singleton
    public static getInstance() {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }
    private static instance: ResourceManager;

    /** Stores all the textures we load, indexed by their identifiers.
     * The textures are animated if there is more than one texture in the list.
     * Stores other sprite metadata for convenience.
     */
    private spriteInfo: Map<string, GameSpriteInfo> = new Map();

    /** Have we finished loading everything? */
    private doneLoading = false;

    // Private constructor for singleton pattern
    private constructor() {}

    public isDoneLoading() { return this.doneLoading; }
    public getSpriteInfo(name: string) {
        const spriteTextures = this.spriteInfo.get(name);
        if (spriteTextures === undefined) {
            throw new Error(`Could not find info for unknown sprite ${name}`);
        }
        return spriteTextures;
    }

    public loadSprites() {
        // Load the sprites we'll need
        const loader = SCREENMAN.getPixiApp().loader;
        for (const spriteInfo of SPRITE_DEFINITIONS) {
            loader.add(spriteInfo.name, spriteInfo.textureUrl);
        }
        // TODO: use loader.on.('progress', callbackFunc) to do a loading bar
        loader.load(this.onLoad.bind(this));
    }

    /** Things to do when our textures finish loading. */
    private onLoad() {
        for (const spriteInfo of SPRITE_DEFINITIONS) {
            this.extractTexturesFromSpriteSheet(spriteInfo);
        }

        this.doneLoading = true;
    }

    /** Extract animated textures from a sprite sheet. Add them to the global lookup.
     * @param sprite: information describing how to extract the sprite.
     */
    private extractTexturesFromSpriteSheet(sprite: LoadSpriteInfo) {
        const spriteTexture = SCREENMAN.getPixiApp().loader.resources[sprite.name].texture;

        const sprites: PIXI.Texture[][] = [];
        for (let s = 0; s < sprite.numSprites; s++) {
            const spriteAnimTextures: PIXI.Texture[] = [];
            for (let f = 0; f < sprite.numAnimFrames; f++) {
                // Define a rectangle at the point we want to extract from
                const rectangle = new PIXI.Rectangle(
                    f * sprite.width,
                    s * sprite.height,
                    sprite.width,
                    sprite.height,
                );
                // Clone that rectangle out of the original texture into a new smaller one
                const spriteFrame = new PIXI.Texture(spriteTexture.baseTexture, rectangle);
                spriteAnimTextures.push(spriteFrame);
            }
            // Store the sprite for later use
            sprites.push(spriteAnimTextures);
        }

        this.spriteInfo.set(sprite.name, {
            name: sprite.name,
            width: sprite.width,
            height: sprite.height,
            animLength: sprite.animLength,
            animLoop: sprite.animLoop,
            textures: sprites,
        });
    }
}
const RESOURCEMAN = ResourceManager.getInstance();
export default RESOURCEMAN;
