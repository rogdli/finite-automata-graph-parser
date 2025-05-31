function minimizeAFD(afd) {
    // Algoritmo de minimización por particiones
    let partitions = [
        afd.finalStates.slice(), // Estados finales
        afd.states.filter(s => !afd.finalStates.includes(s)) // Estados no finales
    ].filter(p => p.length > 0); // Remover particiones vacías

    const alphabet = [...new Set(afd.transitions.map(t => t.symbol))];
    let changed = true;

    while (changed) {
        changed = false;
        const newPartitions = [];

        for (let partition of partitions) {
            const subPartitions = {};

            for (let state of partition) {
                const signature = alphabet.map(symbol => {
                    const transition = afd.transitions.find(t => t.from === state && t.symbol === symbol);
                    if (!transition) return 'NONE';
                    
                    // Encontrar en qué partición está el estado destino
                    for (let i = 0; i < partitions.length; i++) {
                        if (partitions[i].includes(transition.to)) {
                            return i;
                        }
                    }
                    return 'NONE';
                }).join(',');

                if (!subPartitions[signature]) {
                    subPartitions[signature] = [];
                }
                subPartitions[signature].push(state);
            }

            const subs = Object.values(subPartitions);
            if (subs.length > 1) {
                changed = true;
            }
            newPartitions.push(...subs);
        }

        partitions = newPartitions;
    }

    // Construir el AFD minimizado
    const stateMap = {};
    partitions.forEach((partition, index) => {
        const newStateName = `M${index}`;
        partition.forEach(state => {
            stateMap[state] = newStateName;
        });
    });

    const minimizedStates = partitions.map((_, index) => `M${index}`);
    const minimizedInitial = stateMap[afd.initialState];
    const minimizedFinals = [...new Set(afd.finalStates.map(f => stateMap[f]))];

    // Crear transiciones minimizadas (sin duplicados)
    const transitionSet = new Set();
    afd.transitions.forEach(t => {
        const from = stateMap[t.from];
        const to = stateMap[t.to];
        transitionSet.add(`${from}->${to}:${t.symbol}`);
    });

    const minimizedTransitions = Array.from(transitionSet).map(trans => {
        const [fromTo, symbol] = trans.split(':');
        const [from, to] = fromTo.split('->');
        return { from, to, symbol };
    });

    return {
        type: 'AFD',
        initialState: minimizedInitial,
        states: minimizedStates,
        finalStates: minimizedFinals,
        transitions: minimizedTransitions
    };
}

module.exports = { minimizeAFD };