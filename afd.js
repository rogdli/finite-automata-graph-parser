function getAlphabet(transitions) {
    return [...new Set(transitions.map(t => t.symbol))].filter(s => s !== '_');
}

function move(states, symbol, transitions) {
    const result = new Set();
    transitions.forEach(t => {
        if (states.has(t.from) && t.symbol === symbol) {
            result.add(t.to);
        }
    });
    return result;
}

function epsilonClosure(states, transitions) {
    const closure = new Set(states);
    const stack = [...states];

    while (stack.length > 0) {
        const state = stack.pop();
        transitions.forEach(t => {
            if (t.from === state && t.symbol === '_' && !closure.has(t.to)) {
                closure.add(t.to);
                stack.push(t.to);
            }
        });
    }
    return closure;
}

function afnToAfd(afn) {
    const alphabet = getAlphabet(afn.transitions);
    const stateNameMap = {};
    const visited = new Set();
    const queue = [];
    const afdTransitions = [];

    function setToName(set) {
        const sorted = [...set].sort().join(',');
        if (!stateNameMap[sorted]) {
            stateNameMap[sorted] = 'Q' + Object.keys(stateNameMap).length;
        }
        return stateNameMap[sorted];
    }

    const initialSet = epsilonClosure(new Set([afn.initialState]), afn.transitions);
    queue.push(initialSet);
    visited.add([...initialSet].sort().join(','));

    while (queue.length > 0) {
        const currentSet = queue.shift();
        const currentName = setToName(currentSet);

        for (let symbol of alphabet) {
            const targetSet = move(currentSet, symbol, afn.transitions);
            const closureTarget = epsilonClosure(targetSet, afn.transitions);
            
            if (closureTarget.size === 0) continue;
            
            const key = [...closureTarget].sort().join(',');
            if (!visited.has(key)) {
                queue.push(closureTarget);
                visited.add(key);
            }

            const targetName = setToName(closureTarget);
            afdTransitions.push({ from: currentName, to: targetName, symbol });
        }
    }

    const afdFinals = Object.entries(stateNameMap)
        .filter(([key, name]) => afn.finalStates.some(f => key.split(',').includes(f)))
        .map(([_, name]) => name);

    return {
        type: 'AFD',
        initialState: setToName(initialSet),
        states: Object.values(stateNameMap),
        finalStates: afdFinals,
        transitions: afdTransitions
    };
}

function evaluateString(afd, input) {
    let current = afd.initialState;

    for (let char of input) {
        const t = afd.transitions.find(t => t.from === current && t.symbol === char);
        if (!t) {
            console.log(`Rechazada: no hay transición desde ${current} para '${char}'`);
            return false;
        }
        current = t.to;
    }

    const accepted = afd.finalStates.includes(current);
    console.log(accepted ? `Aceptada: terminó en estado final ${current}` : `Rechazada: terminó en estado no final ${current}`);
    return accepted;
}

module.exports = { afnToAfd, evaluateString, getAlphabet, move };