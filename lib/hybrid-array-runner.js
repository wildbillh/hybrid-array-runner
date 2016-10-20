/**
 * Created by HODGESW on 10/18/2016.
 */

let ArrayRunner = require('./array-runner');
let ParallelArrayRunner = require ('parallel-array-runner');
let SerializedArrayRunner = require ('serialized-array-runner');

/**
 * A class for calling a function or method against an array in both a serial and parallel fashion.
 * The passed array is sliced into buckets based on the value of threads.
 * The elements of each buckets are operated on in parallel, while each bucket
 * is operated on serially.
 * @class
 * @extends ArrayRunner
 */
class HybridArrayRunner extends ArrayRunner {

    /**
     * Create the class and optionaly set the behavior.
     * See <a href="#BehaviorsLink">Behaviors</a> for a list of allowed types.
     * @throws will throw an error if an invalid returnBehavior parameter is passed
     * or threads is not a number or < 1
     * @param {string} [returnBehaviorType]  Optional parameter to set the return behavior.
     * The default value is SerializedArrayRunner.LAST_RETURN.
     * @param {number} threads Optional parameter to set the number of parallel threads.
     * Defaults to 5.
     * @constructor
     */
    constructor (returnBehaviorType = HybridArrayRunner.LAST_RETURN, threads = 5) {
        super(returnBehaviorType);

        // Declare the member variables. Some of these are set in the setter
        this._threads = threads;  // Declare the member variable here
        this._serial_runner = new SerializedArrayRunner(returnBehaviorType);
        this._parallel_runner = new ParallelArrayRunner(returnBehaviorType);

        // Call the setters
        this.numberOfThreads = threads;
        this.behaviorType = returnBehaviorType;
    }

    /**
     * The value used to set the behavior to last return. The data from resolved promises for all
     * but the last call will be discarded.
     * @type {string}
     */
    static get LAST_RETURN() {
        return super.LAST_RETURN;
    }

    /**
     * Used to set the behavior to array return. The data from resolved promises for all
     * will be pushed into an array and returned with the resolved promise.
     * @type {string}
     */
    static get ARRAY_RETURN() {
        return super.ARRAY_RETURN;
    }

    /**
     * Used to set the behavior to concatenated array return. The data from resolved promises for is
     * expected to be an array. Each array returned is concatenated and returned with the resolved promise.
     * @type {string}
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

    /**
     * Getter amd setter for the number of parallel threads to use.
     * Note that the setter will thrown an error if setting the value to
     * not a number or a number < 1
     * @type {number}
     */

    get numberOfThreads () {
        return this._threads;
    }

    //noinspection JSAnnotator
    set numberOfThreads (threads) {
        if ( typeof threads !== 'number' || threads < 1) {
            throw new Error ('Invalid parameter sent for threads');
        }
        this._threads = threads;
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
     *  <tr><td>HybridArrayRunner.LAST_RETURN</td> <td>All but the last resolved data is discarded.</td></tr>
     *  <tr><td>HybridArrayRunner.ARRAY_RETURN</td> <td>Each resolved data returned is pushed to an array and returned</td></tr>
     *  <tr><td>HybridArrayRunner.CONCAT_ARRAY_RETURN</td> <td>The resolved data is an array it's contents are concatenated to the
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

        // If the member variable have been defined, set their behavior.
        // This was needed because the base setter is called in the constructor
        this._serial_runner && (this._serial_runner.behaviorType = returnType);
        this._parallel_runner && (this._parallel_runner.behaviorType = returnType);

    }

    // ------------------------------------------------------------------------------
    /**
     * Slices the given array into an array of buckets of size <= threads.
     * The contents of each bucket is operated on in parallel.
     * Once all of the elements of a bucket have been called and resolved,
     * the next bucket is operated on likewise, until the array is depleted.
     * Returns a promise when the all iterations are complete.
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
        return new Promise((resolve, reject) => {
            if (!Array.isArray(arrayToIterate)) {
                return reject(`Expected type array, but passed ${typeof arrayToIterate}`);
            }
            if (typeof functionToCall !== 'function') {
                return reject(`Expected type function, but passed ${typeof functionToCall}`);
            }

            let numberOfElements = arrayToIterate.length;
            let localArray = [];

            // Slice the array, based on the thread count
            for (let i=0; i<numberOfElements; i += this._threads) {
                localArray.push(arrayToIterate.slice(i, i + this._threads));
            }

            // This is a rather complex call. Basically we've sliced the input into an array of arrays.
            // Each array is at max threads size.
            // The outside array is passed to the serial runner who will then iterate the array and pass
            // each inside array in turn to a parallel runner.
            // The parallel runner will apply the given function to each element in the inside array.
            // When the promise for the parallel runner is resolved, then the serial runner starts the process again
            // on the next element of the outside array, util it is depleted.
            // All results bubble back up based on the behavior.

            this._serial_runner.run(localArray, this._parallel_runner.run, this._parallel_runner, functionToCall, scope, ...args)
                .then ( (results) => {

                    if (this.is_last_return) {
                        return resolve(results)
                    }
                    else if (this.is_array_return) {
                        // Here the user is expecting an array but we get back an array of arrays.
                        let resultsArray = [];
                        results.forEach( (elementArray) => {
                            resultsArray = resultsArray.concat(elementArray);
                        });
                        return resolve(resultsArray);
                    }
                    else {
                        return resolve(results);
                    }
                })
                .catch( (err) => {
                    return reject(err);
                });

        });
    }

}

module.exports = HybridArrayRunner;

