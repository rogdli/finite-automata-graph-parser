function renameAutomaton(afn, prefix) {
    return {
        initialState: `${prefix}_${afn.initialState}`,
        finalStates: afn.finalStates.map(f => `${prefix}_${f}`),
        transitions: afn.transitions.map(t => ({
            from: `${prefix}_${t.from}`,
            to: `${prefix}_${t.to}`,
            symbol: t.symbol
        }))
    };
}

// Unión
function unionAFN(a, b) {
    const A = renameAutomaton(a, 'A');
    const B = renameAutomaton(b, 'B');

    return {
        initialState: 'newInit',
        finalStates: [...A.finalStates, ...B.finalStates], // Estados finales originales
        transitions: [
            { from: 'newInit', to: A.initialState, symbol: '_' },
            { from: 'newInit', to: B.initialState, symbol: '_' },
            ...A.transitions,
            ...B.transitions
            // NO agregamos transiciones a newFinal
        ]
    };
}

// Concatenación
function concatAFN(a, b) {
    const A = renameAutomaton(a, 'A');
    const B = renameAutomaton(b, 'B');

    return {
        initialState: A.initialState,
        finalStates: B.finalStates,
        transitions: [
            ...A.transitions,
            ...B.transitions,
            ...A.finalStates.map(f => ({ from: f, to: B.initialState, symbol: '_' })) // Cambiado de '.' a '_'
        ]
    };
}

// Kleene
function kleeneAFN(a) {
    const A = renameAutomaton(a, 'A');

    return {
        initialState: 'newInit',
        finalStates: ['newFinal'],
        transitions: [
            { from: 'newInit', to: A.initialState, symbol: '_' }, // Cambiado de '.' a '_'
            { from: 'newInit', to: 'newFinal', symbol: '_' }, // Cambiado de '.' a '_'
            ...A.transitions,
            ...A.finalStates.map(f => ({ from: f, to: A.initialState, symbol: '_' })), // Cambiado de '.' a '_'
            ...A.finalStates.map(f => ({ from: f, to: 'newFinal', symbol: '_' })) // Cambiado de '.' a '_'
        ]
    };
}

module.exports = { unionAFN, concatAFN, kleeneAFN };
