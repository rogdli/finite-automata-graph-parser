// grammar.js - Parser descendente recursivo para la gramática LL(1)

class GrammarParser {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.current = this.input[0] || null;
    }

    // Avanzar al siguiente símbolo
    advance() {
        this.pos++;
        this.current = this.pos < this.input.length ? this.input[this.pos] : null;
    }

    // Verificar si el símbolo actual coincide
    match(expected) {
        if (this.current === expected) {
            this.advance();
            return true;
        }
        return false;
    }

    // E → T E'
    parseE() {
        console.log(`Parsing E at position ${this.pos}, current: '${this.current}'`);
        const left = this.parseT();
        if (left === null) return null;
        return this.parseEPrime(left);
    }

    // E' → | T E' | ε
    parseEPrime(left) {
        console.log(`Parsing E' at position ${this.pos}, current: '${this.current}'`);
        if (this.current === '|') {
            this.advance(); // consumir '|'
            const right = this.parseT();
            if (right === null) return null;
            // Crear nodo de unión
            const unionNode = { type: 'union', left: left, right: right };
            return this.parseEPrime(unionNode);
        }
        // ε (epsilon) - no hacer nada, retornar left
        return left;
    }

    // T → F T'
    parseT() {
        console.log(`Parsing T at position ${this.pos}, current: '${this.current}'`);
        const left = this.parseF();
        if (left === null) return null;
        return this.parseTPrime(left);
    }

    // T' → . F T' | ε
    parseTPrime(left) {
        console.log(`Parsing T' at position ${this.pos}, current: '${this.current}'`);
        if (this.current === '.') {
            this.advance(); // consumir '.'
            const right = this.parseF();
            if (right === null) return null;
            // Crear nodo de concatenación
            const concatNode = { type: 'concat', left: left, right: right };
            return this.parseTPrime(concatNode);
        }
        // ε (epsilon) - no hacer nada, retornar left
        return left;
    }

    // F → P F'
    parseF() {
        console.log(`Parsing F at position ${this.pos}, current: '${this.current}'`);
        const base = this.parseP();
        if (base === null) return null;
        return this.parseFPrime(base);
    }

    // F' → * | ε
    parseFPrime(base) {
        console.log(`Parsing F' at position ${this.pos}, current: '${this.current}'`);
        if (this.current === '*') {
            this.advance(); // consumir '*'
            // Crear nodo de Kleene
            return { type: 'kleene', operand: base };
        }
        // ε (epsilon) - no hacer nada, retornar base
        return base;
    }

    // P → ( E ) | L
    parseP() {
        console.log(`Parsing P at position ${this.pos}, current: '${this.current}'`);
        if (this.current === '(') {
            this.advance(); // consumir '('
            const expr = this.parseE();
            if (expr === null) return null;
            if (!this.match(')')) {
                console.error(`Error: expected ')' at position ${this.pos}`);
                return null;
            }
            return expr;
        } else {
            return this.parseL();
        }
    }

    // L → a | b | c
    parseL() {
        console.log(`Parsing L at position ${this.pos}, current: '${this.current}'`);
        if (this.current === 'a' || this.current === 'b' || this.current === 'c') {
            const symbol = this.current;
            this.advance();
            return { type: 'symbol', value: symbol };
        }
        console.error(`Error: expected 'a', 'b', or 'c' at position ${this.pos}, found '${this.current}'`);
        return null;
    }

    // Función principal de parsing
    parse() {
        console.log(`Starting parse for: "${this.input}"`);
        const result = this.parseE();
        if (this.current !== null) {
            console.error(`Error: unexpected symbol '${this.current}' at position ${this.pos}`);
            return null;
        }
        return result;
    }
}

// Función para convertir AST a autómata
function astToAutomaton(ast, { unionAFN, concatAFN, kleeneAFN }) {
    if (!ast) return null;

    switch (ast.type) {
        case 'symbol':
            // Crear autómata básico para un símbolo
            return {
                initialState: 'q0',
                finalStates: ['q1'],
                transitions: [{ from: 'q0', to: 'q1', symbol: ast.value }]
            };

        case 'union':
            const leftAFN = astToAutomaton(ast.left, { unionAFN, concatAFN, kleeneAFN });
            const rightAFN = astToAutomaton(ast.right, { unionAFN, concatAFN, kleeneAFN });
            return unionAFN(leftAFN, rightAFN);

        case 'concat':
            const leftConcat = astToAutomaton(ast.left, { unionAFN, concatAFN, kleeneAFN });
            const rightConcat = astToAutomaton(ast.right, { unionAFN, concatAFN, kleeneAFN });
            return concatAFN(leftConcat, rightConcat);

        case 'kleene':
            const operand = astToAutomaton(ast.operand, { unionAFN, concatAFN, kleeneAFN });
            return kleeneAFN(operand);

        default:
            console.error(`Unknown AST node type: ${ast.type}`);
            return null;
    }
}

// Función para mostrar el AST de forma legible
function printAST(ast, indent = 0) {
    if (!ast) return;
    
    const spaces = '  '.repeat(indent);
    switch (ast.type) {
        case 'symbol':
            console.log(`${spaces}Symbol: ${ast.value}`);
            break;
        case 'union':
            console.log(`${spaces}Union:`);
            printAST(ast.left, indent + 1);
            printAST(ast.right, indent + 1);
            break;
        case 'concat':
            console.log(`${spaces}Concat:`);
            printAST(ast.left, indent + 1);
            printAST(ast.right, indent + 1);
            break;
        case 'kleene':
            console.log(`${spaces}Kleene:`);
            printAST(ast.operand, indent + 1);
            break;
    }
}

module.exports = { GrammarParser, astToAutomaton, printAST };