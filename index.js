// Trabajo Práctico Obligatorio - Teoría de la Computación
// Alumnos: Gonzalo Barroso, Facundo García Brunetti, Benjamín Velasco, Rodrigo Villegas

const readline = require('readline');
const fs = require('fs');
const { parseDotFile } = require('./parser');
const { afnToAfd } = require('./afd');
const { unionAFN, concatAFN, kleeneAFN } = require('./operations');
const { GrammarParser, astToAutomaton, printAST } = require('./grammar');

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

function showMenu() {
    console.log('\n=== MENÚ PRINCIPAL ===');
    console.log('--- Operaciones con Autómatas (archivos .dot) ---');
    console.log('1. Unión (A y B)');
    console.log('2. Concatenación (A y B)');
    console.log('3. Clausura de Kleene (A)');
    console.log('4. Convertir a AFD (A)');

    console.log('--- Operaciones con Gramáticas ---');
    console.log('5. Parsear expresión regular con gramática LL(1)');
    console.log('6. Convertir expresión regular a autómata');
    console.log('7. Mostrar gramática LL(1)');
    console.log('0. Salir');
}

function showGrammar() {
    console.log('\n=== GRAMÁTICA LL(1) PARA EXPRESIONES REGULARES ===');
    console.log('E  → T E\'');
    console.log('E\' → | T E\' | ε');
    console.log('T  → F T\'');
    console.log('T\' → . F T\' | ε');
    console.log('F  → P F\'');
    console.log('F\' → * | ε');
    console.log('P  → ( E ) | L');
    console.log('L  → a | b | c');
    console.log('\nOperadores (precedencia de mayor a menor):');
    console.log('* : Clausura de Kleene');
    console.log('. : Concatenación');
    console.log('| : Unión');
    console.log('\nEjemplos válidos: a, a|b, a.b, a*, (a|b)*');
}

function handleAutomatonOperations(option) {
    const afnA = parseDotFile('inputA.dot');
    const afnB = parseDotFile('inputB.dot');
    let result, outputFile;

    switch (option) {
        case '1': result = unionAFN(afnA, afnB); outputFile = 'union_output.dot'; break;
        case '2': result = concatAFN(afnA, afnB); outputFile = 'concat_output.dot'; break;
        case '3': result = kleeneAFN(afnA); outputFile = 'kleene_output.dot'; break;
        case '4': result = afnToAfd(afnA); outputFile = 'afd_output.dot'; break;
        default: return null;
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
            rl.question('\nIngrese una cadena para evaluar (Enter para continuar): ', input => {
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
                mainLoop();
            });
        } else {
            mainLoop();
        }
    } else {
        mainLoop();
    }
}

function handleGrammarOperations(option) {
    switch (option) {
        case '5':
            rl.question('Ingrese una expresión regular (ej: a|b, a.b*, (a|b)*): ', input => {
                if (input.trim()) {
                    const parser = new GrammarParser(input.trim());
                    const ast = parser.parse();
                    
                    if (ast) {
                        console.log('\n✓ Expresión válida según la gramática LL(1)');
                        console.log('\n--- Árbol Sintáctico Abstracto (AST) ---');
                        printAST(ast);
                    } else {
                        console.log('\n✗ Expresión inválida según la gramática LL(1)');
                    }
                }
                mainLoop();
            });
            break;

        case '6':
            rl.question('Ingrese una expresión regular para convertir: ', input => {
                if (input.trim()) {
                    const parser = new GrammarParser(input.trim());
                    const ast = parser.parse();
                    
                    if (ast) {
                        console.log('\n✓ Expresión válida, convirtiendo a autómata...');
                        
                        const automaton = astToAutomaton(ast, { unionAFN, concatAFN, kleeneAFN });
                        
                        if (automaton) {
                            const outputFile = 'grammar_to_automaton.dot';
                            generateDotOutput(automaton, outputFile);
                            
                            console.log('\n--- AFN generado desde la gramática ---');
                            console.log('Estado inicial:', automaton.initialState);
                            console.log('Estados finales:', automaton.finalStates);
                            console.log('Transiciones:');
                            console.table(automaton.transitions);
                            
                            // Preguntar si quiere convertir a AFD
                            rl.question('\n¿Convertir a AFD? (s/n): ', answer => {
                                if (answer.toLowerCase() === 's') {
                                    const afd = afnToAfd(automaton);
                                    generateDotOutput(afd, 'grammar_to_afd.dot');
                                    console.log('\n--- AFD generado ---');
                                    console.log('Estado inicial:', afd.initialState);
                                    console.log('Estados finales:', afd.finalStates);
                                    console.table(afd.transitions);
                                }
                                mainLoop();
                            });
                        } else {
                            console.log('Error al convertir a autómata');
                            mainLoop();
                        }
                    } else {
                        console.log('\n✗ Expresión inválida según la gramática LL(1)');
                        mainLoop();
                    }
                } else {
                    mainLoop();
                }
            });
            break;

        case '7':
            showGrammar();
            mainLoop();
            break;

        default:
            mainLoop();
    }
}

function mainLoop() {
    showMenu();
    rl.question('\nIngrese el número de la opción: ', (option) => {
        switch (option) {
            case '0':
                console.log('¡Hasta luego!');
                rl.close();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            
                handleAutomatonOperations(option);
                break;
            case '5':
            case '6':
            case '7':
                handleGrammarOperations(option);
                break;
            default:
                console.log('Opción no válida.');
                mainLoop();
        }
    });
}

// Iniciar el programa
console.log('=== ANALIZADOR DE AUTÓMATAS Y GRAMÁTICAS ===');
console.log('Trabajo Práctico - Teoría de la Computación');
mainLoop();