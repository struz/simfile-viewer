import ENTITYMAN from './EntityManager';
import RESOURCEMAN from '../ResourceManager';

// For entity subclasses that need to load resources
export function checkGameDependencies() {
    // We can't do anything if the resource manager isn't initialised
    if (!RESOURCEMAN.isDoneLoading()) { throw new Error('RESOURCEMAN has not finished loading'); }
}

// The base class for all game entities
abstract class Entity {
    constructor() {
        ENTITYMAN.registerEntity(this);
    }

    /** All entities must implement an update loop, even if it does nothing. */
    public abstract update(deltaTime: number): this;

    /** Destroys the current entity and unregisters it. */
    public destroy() {
        // TODO: look into what is necessary to recursively destroy a JS object
        ENTITYMAN.deregisterEntity(this);
    }
}
export default Entity;
