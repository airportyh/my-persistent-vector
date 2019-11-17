// Based on
// * https://hypirion.com/musings/understanding-persistent-vector-pt-1
// * https://hypirion.com/musings/understanding-persistent-vector-pt-2
const { debug, debug_call, debug_return } = require("./my-debug");

exports.vector = vector;
function vector(options) {
    return {
        fanOut: options && options.fanOut || 10,
        count: 0,
        root: null,
        levels: 0
    };
}

exports.count = count;
function count(vector) {
    return vector.count;
}

exports.push = push;
function push(vector, value) {
    debug_call("push", { vector, value });
    let retval;
    const newLevels = Math.max(1, // max to avoid the level being 0
        Math.ceil(
        Math.log(vector.count + 1) /
        Math.log(vector.fanOut))
    );
    if (vector.root && (newLevels > vector.levels)) {
        // expand new level
        debug("expand new level");
        const newRoot = Array(vector.fanOut).fill(null);;
        newRoot[0] = vector.root;
        const secondChild = _push(
            null, value, 0,
            vector.fanOut, newLevels - 2);
        newRoot[1] = secondChild;
        retval = {
            fanOut: vector.fanOut,
            count: vector.count + 1,
            root: newRoot,
            levels: newLevels
        };
    } else {
        debug("no need to expand new level");
        const newRoot = _push(
            vector.root, value, vector.count,
            vector.fanOut, newLevels - 1);
        retval = {
            fanOut: vector.fanOut,
            count: vector.count + 1,
            root: newRoot,
            levels: newLevels
        };
    }
    debug_return("push", retval);
    return retval;
}

function _push(node, value, index, fanOut, level) {
    debug_call("_push", { node, value, index, level });
    let retval;
    const newNode = node ? node.slice() : Array(fanOut).fill(null);;
    // todo, replace with generic way to calculate thisIndex
    const thisIndex = Math.floor(index / fanOut);
    const childIndex = index % fanOut;
    if (level === 0) {
        newNode[index] = value;
    } else {
        const newChildNode = _push(
            node && node[thisIndex], value, childIndex,
            fanOut, level - 1);
        newNode[childIndex] = newChildNode;
    }
    retval = newNode;
    debug_return("_push", retval);
    return retval;
}

exports.pop = pop;
function pop(vector) {
    let retval;
    debug_call("pop", { vector });
    const newLevels = Math.max(1, // max to avoid the level being 0
        Math.ceil(
        Math.log(vector.count - 1) /
        Math.log(vector.fanOut))
    );
    if (vector.levels !== newLevels) {
        debug("collapse a level");
        retval = {
            fanOut: vector.fanOut,
            count: vector.count - 1,
            root: vector.root[0],
            levels: newLevels
        };
    } else {
        debug("no need to collapse a level");
        const newRoot = _pop(
            vector.root, vector.count - 1,
            vector.fanOut, vector.levels - 1);
        retval = {
            fanOut: vector.fanOut,
            count: vector.count - 1,
            root: newRoot,
            levels: newLevels
        };
    }
    debug_return("pop", retval);
    return retval;
}

exports._pop = _pop;
function _pop(node, index, fanOut, level) {
    debug_call("_pop", { node, index, fanOut, level });
    if (!node) {
        return node;
    }
    const newNode = node.slice();
    const thisIndex = Math.floor(
        index / Math.pow(fanOut, level))
        % fanOut;
    debug("calculated", { index, thisIndex });
    if (level === 0) {
        newNode[thisIndex] = null;
        return newNode;
    } else {
        const newChildNode = _pop(
            node[thisIndex],
            index,
            fanOut,
            level - 1
        );
        newNode[thisIndex] = newChildNode;
    }
    debug_return("_pop", newNode);
    return newNode;
}

exports.get = get;
function get(vector, index) {
    debug_call("get", { vector, index });
    if (!vector.root || index >= vector.count) {
        throw new Error("Index out of bounds");
    }
    const levels = Math.max(1,
        Math.ceil(
        // max to avoid the level being 0
        Math.log(vector.count) /
        Math.log(vector.fanOut))
    );
    const retval = _get(vector.root, index, vector.fanOut, levels - 1);
    debug_return("get", retval);
    return retval;
}

exports._get = _get;
function _get(node, index, fanOut, level) {
    debug_call("_get", { node, index, fanOut, level });
    let retval;
    const thisIndex = Math.floor(
        index / Math.pow(fanOut, level))
        % fanOut;
    const thisNode = node[thisIndex];
    if (level === 0) {
        // this is actually the value
        retval = thisNode;
    } else {
        retval = _get(thisNode, index, fanOut, level - 1);
    }
    debug_return("_get", retval);
    return retval;
}

exports.set = set;
function set(vector, index, value) {
    debug_call("set", { vector, index, value });
    const newRoot = _set(
        vector.root, index, value,
        vector.fanOut, vector.levels - 1);
    let retval = {
        root: newRoot,
        fanOut: vector.fanOut,
        count: vector.count,
        levels: vector.levels
    };
    debug_return("set", retval);
    return retval;
}

function _set(node, index, value, fanOut, level) {
    debug_call("_set", { node, index, fanOut, level });
    let retval;
    const newNode = node ? node.slice() : Array(fanOut).fill(null);
    const thisIndex = Math.floor(
        index / Math.pow(fanOut, level))
        % fanOut;
    if (level === 0) {
        newNode[thisIndex] = value;
    } else {
        const newChildNode = _set(
            node && node[thisIndex],
            index,
            value,
            fanOut,
            level - 1
        );
        newNode[thisIndex] = newChildNode;
    }
    retval = newNode;
    debug_return("_set", retval);
    return retval;
}
