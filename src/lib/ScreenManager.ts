import * as PIXI from 'pixi.js-legacy';

import RESOURCEMAN from './ResourceManager';
import TapNoteReceptorSprite from './entities/TapNoteReceptorSprite';
import { TapNoteDirection, TAPNOTE_WIDTH_PX, LANE_MARGIN } from './entities/EntitiesConstants';
import NoteField from './entities/NoteField';

interface ScreenManagerOptions {
    renderCanvas: HTMLCanvasElement;
    width: number;
    height: number;
}

/** Responsible for drawing to the screen.
 * We only allow one ScreenManager and it gets initialised with
 * a canvas and PIXI hook later.
 */
export class ScreenManager {
    /** Get the desired FPS of the application. */
    public static desiredFps() { return 60; }

    // Singleton
    public static getInstance() {
        if (!ScreenManager.instance) {
            ScreenManager.instance = new ScreenManager();
        }
        return ScreenManager.instance;
    }
    private static instance: ScreenManager;

    /** The Aplication object used to interact with PIXI */
    private pixiApp: PIXI.Application | null = null;

    private receptorsVisible = false;
    private receptorSprites: TapNoteReceptorSprite[] = [];

    private noteField: NoteField | undefined;

    // Private constructor for singleton
    private constructor() {}

    public initPixi(options: ScreenManagerOptions) {
        console.log('initpixi');
        // Create a new PIXI app.
        this.pixiApp = new PIXI.Application({
            width: options.width,
            height: options.height,
            view: options.renderCanvas,
            backgroundColor: 0x000000,
            forceCanvas: true,
        });
        if (this.pixiApp.renderer instanceof PIXI.CanvasRenderer) {
            console.log('its canvas');
        }
        // TODO: switch this to using pixi-display for performance
        // Uncomment next line to reverse Z ordering if desired
        // this.pixiApp.stage.sortableChildren = true;
        // Tell the resource manager it can load things now
        RESOURCEMAN.loadSprites();
        // Start the tick loop for animations and other such things
        this.pixiApp.ticker.maxFPS = ScreenManager.desiredFps();
        this.pixiApp.ticker.start();
    }

    public isInit() { return this.pixiApp !== null; }
    public isReadyToDraw() { return this.isInit() && RESOURCEMAN.isDoneLoading(); }
    public getPixiApp() {
        if (this.pixiApp === null) {
            throw new Error('Tried to get null pixiApp. Use isInit() first to ensure it exists.');
        }
        return this.pixiApp;
    }

    public setBgColor(color: number) { this.getPixiApp().renderer.backgroundColor = color; }

    // TODO: move receptors into NoteField
    /** Draw the receptors to the screen. If they're already there do nothing. */
    public showReceptors() {
        // TODO: loop over numTracks
        if (this.receptorsVisible) { return; }
        if (this.receptorSprites.length === 0) {
            // Initialise them in arrow order <- v ^ ->
            const initOrder = [
                TapNoteDirection.LEFT,
                TapNoteDirection.DOWN,
                TapNoteDirection.UP,
                TapNoteDirection.RIGHT,
            ];
            for (const direction of initOrder) {
                this.receptorSprites.push(
                    new TapNoteReceptorSprite(direction)
                    .addToStage());
            }
        }
        for (const receptor of this.receptorSprites) {
            receptor.getSprite().visible = true;
        }

        this.noteField = new NoteField();
        this.receptorsVisible = true;
    }

    /** Hide the receptors from the screen. */
    public hideReceptors() {
        if (!this.receptorsVisible || this.receptorSprites.length === 0) { return; }
        for (const receptor of this.receptorSprites) {
            receptor.getSprite().visible = false;
        }
        this.receptorsVisible = false;
    }
}
const SCREENMAN = ScreenManager.getInstance();
export default SCREENMAN;
