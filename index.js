// Trabajo Práctico Obligatorio 2 - Teoría de la Computación
// Alumnos: Gonzalo Barroso, Facundo García Brunetti, Benjamín Velasco, Rodrigo Villegas

const readline = require('readline');
const fs = require('fs');
const { parseDotFile } = require('./parser');
const { afnToAfd } = require('./afd');
const { unionAFN, concatAFN, kleeneAFN } = require('./operations');
const { minimizeAFD } = require('./minimize');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Generar archivo DOT
function generateDotOutput(automaton, filename) {
    let content = 'digraph {\n    rankdir=LR;\n    inic [shape=point];\n';
    content += `    inic -> ${automaton.initialState};\n`;
    
    // Obtener todos los estados
    const allStates = automaton.states || [
        ...new Set([
            automaton.initialState,
            ...automaton.finalStates,
            ...automaton.transitions.flatMap(t => [t.from, t.to])
        ])
    ];
    
    // Crear estados
    allStates.forEach(state => {
        const shape = automaton.finalStates.includes(state) ? 'doublecircle' : 'circle';
        content += `    ${state} [shape=${shape}];\n`;
    });
    
    // Agrupar y crear transiciones
    const transitions = {};
    automaton.transitions.forEach(t => {
        const key = `${t.from}->${t.to}`;
        transitions[key] = transitions[key] || [];
        transitions[key].push(t.symbol);
    });
    
    Object.entries(transitions).forEach(([path, symbols]) => {
        const [from, to] = path.split('->');
        content += `    ${from} -> ${to} [label="${symbols.join(', ')}"];\n`;
    });
    
    content += '}';
    fs.writeFileSync(filename, content);
    console.log(`Archivo DOT generado: ${filename}`);
}

console.log('¿Qué operación quiere realizar?');
console.log('1. Unión (A y B)\n2. Concatenación (A y B)\n3. Clausura de Kleene (A)');
console.log('4. Convertir a AFD\n5. Minimizar AFD');

rl.question('Ingrese el número de la opción: ', (option) => {
    const afnA = parseDotFile('inputA.dot');
    const afnB = parseDotFile('inputB.dot');
    let result, outputFile;

    switch (option) {
        case '1': result = unionAFN(afnA, afnB); outputFile = 'union_output.dot'; break;
        case '2': result = concatAFN(afnA, afnB); outputFile = 'concat_output.dot'; break;
        case '3': result = kleeneAFN(afnA); outputFile = 'kleene_output.dot'; break;
        case '4': result = afnToAfd(afnA); outputFile = 'afd_output.dot'; break;
        case '5': result = minimizeAFD(afnToAfd(afnA)); outputFile = 'minimized_output.dot'; break;
        default: console.log('Opción no válida.'); rl.close(); return;
    }

    if (result) {
        generateDotOutput(result, outputFile);
        
        // Mostrar información
        console.log(`\n--- ${result.type === 'AFD' ? 'AFD' : 'AFN'} generado ---`);
        console.log('Estado inicial:', result.initialState);
        console.log('Estados finales:', result.finalStates);
        console.log('Transiciones:');
        console.table(result.transitions);

        // Evaluar cadena si es AFD
        if (result.type === 'AFD') {
            rl.question('\nIngrese una cadena para evaluar (Enter para terminar): ', input => {
                if (input.trim()) {
                    let currentState = result.initialState;
                    let valid = true;
                    
                    for (let symbol of input) {
                        const transition = result.transitions.find(t => 
                            t.from === currentState && t.symbol === symbol
                        );
                        if (!transition) {
                            console.log(`Rechazada: no hay transición desde ${currentState} para '${symbol}'`);
                            valid = false;
                            break;
                        }
                        currentState = transition.to;
                    }
                    
                    if (valid) {
                        const message = result.finalStates.includes(currentState) 
                            ? `Aceptada: terminó en estado final ${currentState}`
                            : `Rechazada: terminó en estado no final ${currentState}`;
                        console.log(message);
                    }
                }
                rl.close();
            });
        } else {
            rl.close();
        }
    }
});
