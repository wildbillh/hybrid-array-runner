/**
 * Created by HODGESW on 10/18/2016.
 */

/**
* @file
* @author Bill Hodges
*/

let ArrayRunner = require('./array-runner');

/**
 * A class for calling a asynchronous function (returning a promise) in parallel with array data. For each element in the array,
 * the function is called in parallel. The data from the resolve promises can be captured in a variety of ways,
 * dependent on the behavior used.
 * @class
 * @extends ArrayRunner
 */
class ParallelArrayRunner extends ArrayRunner {

    /**
     * Create the class and optionaly set the behavior.
     * See <a href="#BehaviorsLink">Behaviors</a> for a list of allowed types.
     * @throws will throw an error if an invalid returnBehavior parameter is passed
     * @param {string} [returnBehavior]  Optional parameter to set the return behavior.
     * The default value is SerializedArrayRunner.LAST_RETURN.
     * @constructor
     */
    constructor (returnBehavior = ParallelArrayRunner.LAST_RETURN) {
        super(returnBehavior);
    }


    /**
     * The value used to set the behavior to last return. The data from resolved promises for all
     * but the last call will be discarded.
     * @returns {string}
     */
    static get LAST_RETURN() {
        return super.LAST_RETURN;
    }

    /**
     * Used to set the behavior to array return. The data from resolved promises for all
     * will be pushed into an array and returned with the resolved promise.
     * @return {string}
     */
    static get ARRAY_RETURN() {
        return super.ARRAY_RETURN;
    }

    /**
     * Used to set the behavior to concatenated array return. The data from resolved promises for is
     * expected to be an array. Each array returned is concatenated and returned with the resolved promise.
     * @return {string}
     */
    static get CONCAT_ARRAY_RETURN() {
        return super.CONCAT_ARRAY_RETURN;
    }

    /**
     * Generates an array of valid return types. Used internally for validation of passed parameters.
     * @returns {Array<string>}
     * @private
     */
    static get VALID_RETURN_BEHAVIOR_TYPES () {
        return super.VALID_RETURN_BEHAVIOR_TYPES;
    }


    // ------------------------------------------------------------------------------
    /**
     *  <div id="BehaviorsLink"/>
     *  Getter and setter for the runner return behavior.
     *  Note that the setter will throw an error if the string passed is not one
     *  of the types specified by the static methods. The three types allowed are:
     *  <h5>Behaviors:</h5>
     *  <table>
     *  <thead><tr><th>Behavior Type</th><th>Description</th></tr></thead>
     *  <tr><td>ParallelArrayRunner.LAST_RETURN</td> <td>All but the last resolved data is discarded.</td></tr>
     *  <tr><td>ParallelArrayRunner.ARRAY_RETURN</td> <td>Each resolved data returned is pushed to an array and returned</td></tr>
     *  <tr><td>ParallelArrayRunner.CONCAT_ARRAY_RETURN</td> <td>The resolved data is an array it's contents are concatenated to the
     *  final array for each iteration.</td</tr>
     *  </table>
     * @type {string}
     */

    get behaviorType () {
        return super.behaviorType;
    }

    //noinspection JSAnnotator
    set behaviorType (returnType) {
        super.behaviorType = returnType;
    }




    // ------------------------------------------------------------------------------
    /**
     * Iterates through the array calling the provided function and waits for the
     * resolution before proceeding. Returns a promise when the iteration is complete.
     * The data resolved depends on the supplied function return data and the configured
     * return behavior
     * @param {Array} arrayToIterate The array who's elements are passed to the function.
     * @param {function} functionToCall The function that gets call. It must return a promise.
     * The first parameter is the current array element.
     * @param {object} scope The scope for the function to be called in. Necessary if the
     * function is class method.
     * @param {...*} args Zero or more arguments to send to the function. Note that
     * the first argument here, is the fourth argument to the called function.
     * @returns {Promise} A resolved promise is returned if all function calls resolve.
     */
    run (arrayToIterate, functionToCall, scope, ...args) {
        return new Promise ( (resolve, reject) => {

            if (!Array.isArray(arrayToIterate)) {
                return reject(`Expected type array, but passed ${typeof arrayToIterate}`);
            }
            if (typeof functionToCall !== 'function') {
                return reject(`Expected type function, but passed ${typeof functionToCall}`);
            }

            let resultsArray = [];
            let promiseArray = [];

            // Get an array of promises
            arrayToIterate.forEach( (element) => {
                promiseArray.push(functionToCall.call(scope, element, ...args));
            });

            Promise.all(promiseArray)
                .then( (results) => {
                    // return behavior is last return
                    if (this.is_last_return) {
                        return resolve(results[results.length -1]);
                    }
                    // If the return behavior is array just return results
                    else if (this.is_array_return) {
                        return resolve(results);
                    }
                    // if the return behavior is concatenated array
                    // Concatenate any array returns but push any non array returns
                    else {
                        results.forEach( (element) => {
                            if (Array.isArray(element)) {
                                resultsArray = resultsArray.concat(element);
                            }
                            else {
                                resultsArray.push(element);
                            }
                        });
                        return resolve(resultsArray);

                    }
                }).catch( (err) => {
                // If the promise.all rejects, cascade the rejection
                return reject(err);
            });
        });
    }
}

module.exports = ParallelArrayRunner;
