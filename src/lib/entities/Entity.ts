import ENTITYMAN from './EntityManager';
import NoteField from './NoteField';

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
