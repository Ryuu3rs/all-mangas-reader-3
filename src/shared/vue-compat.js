/**
 * Vue 3 compatibility utilities
 * In Vue 3, reactivity is Proxy-based, so direct assignment/deletion works
 */

/**
 * Set a reactive property on an object
 * In Vue 3: Direct assignment works due to Proxy-based reactivity
 * @param {Object} target - The target object
 * @param {string|number} key - The property key
 * @param {*} value - The value to set
 */
export function reactiveSet(target, key, value) {
    target[key] = value
}

/**
 * Delete a reactive property from an object
 * In Vue 3: Direct delete works due to Proxy-based reactivity
 * @param {Object} target - The target object
 * @param {string|number} key - The property key to delete
 */
export function reactiveDelete(target, key) {
    delete target[key]
}
