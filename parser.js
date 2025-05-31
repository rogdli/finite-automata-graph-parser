const fs = require('fs');

function parseDotFile(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');

    let initialState = null;
    let finalStates = new Set();
    let transitions = [];

    lines.forEach(line => {
        line = line.trim();

        const initMatch = line.match(/^inic\s*->\s*(\w+);/);
        if (initMatch) initialState = initMatch[1];

        const finalMatch = line.match(/^(\w+)\s*\[shape=doublecircle]/);
        if (finalMatch) finalStates.add(finalMatch[1]);

        const transMatch = line.match(/^(\w+)\s*->\s*(\w+)\s*\[label="(.+?)"]/);
        if (transMatch) {
            const [_, source, destination, symbolsRaw] = transMatch;
            const symbols = symbolsRaw.split(',').map(s => s.trim());
            symbols.forEach(symbol => {
                transitions.push({ from: source, to: destination, symbol });
            });
        }
    });

    return {
        initialState: initialState,
        finalStates: Array.from(finalStates),
        transitions
    };
}

module.exports = { parseDotFile };