/**
 * Created by HODGESW on 10/18/2016.
 */

/**
 * Base class for the different ArrayRunner sub-classes. This class is not meant
 * to be instantiated.
 */
class ArrayRunner {

    /**
     * Create the class and optionaly set the behavior.
     * See <a href="#BehaviorsLink">Behaviors</a> for a list of allowed types.
     * @throws will throw an error if an invalid returnBehavior parameter is passed
     * @param {string} [returnBehavior]  Optional parameter to set the return behavior.
     * The default value is SerializedArrayRunner.LAST_RETURN.
     * @constructor
     *
     */
    constructor (returnBehavior = ArrayRunner.LAST_RETURN) {
        this.returnBehavior = null;
        this.behaviorType = returnBehavior;
    }

    // ------------------------------------------------------------------------------
    /**
     *Retrieve the value of the current return behavior
     * @returns {string}
     */
    get behaviorType () {
        return this.returnBehavior;
    }

    /**
     *  <div id="BehaviorsLink"/>
     *  Set a new runner return behavior. The three types allowed are:
     *  <h5>Behaviors:</h5>
     *  <table>
     *  <thead><tr><th>Behavior Type</th><th>Description</th></tr></thead>
     *  <tr><td>ArrayRunner.LAST_RETURN</td> <td>All but the last resolved data is discarded.</td></tr>
     *  <tr><td>ArrayRunner.ARRAY_RETURN</td> <td>Each resolved data returned is pushed to an array and returned</td></tr>
     *  <tr><td>ArrayRunner.CONCAT_ARRAY_RETURN</td> <td>The resolved data is an array it's contents are concatenated to the
     *  final array for each iteration.</td</tr>
     *  </table>
     *
     * @param {string} returnType
     */


    set behaviorType (returnType) {
        if (!ArrayRunner.VALID_RETURN_BEHAVIOR_TYPES.includes(returnType)) {
            throw new Error('Invalid Return Behavior. Use one of the defined types');
        }
        this.returnBehavior = returnType;
        switch (this.returnBehavior) {
            case ArrayRunner.LAST_RETURN:
                this.is_last_return = true;
                this.is_array_return = false;
                this.is_concat_array_return = false;
                break;
            case ArrayRunner.ARRAY_RETURN:
                this.is_last_return = false;
                this.is_array_return = true;
                this.is_concat_array_return = false;
                break;
            case ArrayRunner.CONCAT_ARRAY_RETURN:
                this.is_last_return = false;
                this.is_array_return = false;
                this.is_concat_array_return = true;
                break;
        }
    }

    /**
     * The value used to set the behavior to last return. The data from resolved promises for all
     * but the last call will be discarded.
     * @returns {string}
     */
    static get LAST_RETURN() {
        return 'LAST_RETURN';
    }

    /**
     * he value used to set the behavior to array return. The data from resolved promises for all
     * will be pushed into an array and returned with the resolved promise.
     * @return {string}
     */
    static get ARRAY_RETURN() {
        return 'ARRAY_RETURN';
    }

    /**
     * he value used to set the behavior to concatenated array return. The data from resolved promises for is
     * expected to be an array. Each array returned is concatenated and returned with the resolved promise.
     * @return {string}
     */
    static get CONCAT_ARRAY_RETURN() {
        return 'CONCAT_ARRAY_RETURN';
    }

    /**
     * Generates an array of valid return types. Used internally for validation of passed parameters.
     * @returns {Array<string>}
     */
    static get VALID_RETURN_BEHAVIOR_TYPES () {
        return [
            ArrayRunner.LAST_RETURN,
            ArrayRunner.ARRAY_RETURN,
            ArrayRunner.CONCAT_ARRAY_RETURN
        ];
    }

    /**
     * The run method must be implemented by a subclass
     * @abstract
     */
    run () {
        throw new Error ('must be implemented by a subclass');
    }
}

module.exports = ArrayRunner;