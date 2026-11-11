// NexCC's automata lab, bundled for the browser so the demo on this page runs the project's own code.
// Source: github.com/Jitheswar/nexcc, src/automata/ at commit 3aac424 (MIT). The files below are unmodified;
// only the wrapper that stands in for Node's require() is added.
window.NexCCAutomata = (function () {
  var mods = {}, cache = {};
  function req(name) {
    if (cache[name]) return cache[name].exports;
    var module = cache[name] = { exports: {} };
    mods[name](module, module.exports, req);
    return module.exports;
  }
  mods['./regex-parser'] = function (module, exports, require) {
'use strict';

/**
 * @module regex-parser
 * @description Recursive descent parser for regular expressions.
 * Converts a regex string into an AST with proper operator precedence:
 *   alternation < concatenation < postfix (*, +, ?)
 *
 * Supported syntax:
 *   - Literals, dot `.`, escape sequences `\n \t \\ \| \. \[ \] \( \) \* \+ \?`
 *   - Alternation `|`
 *   - Concatenation (implicit juxtaposition)
 *   - Kleene star `*`, plus `+`, optional `?`
 *   - Grouping `()`
 *   - Character classes `[a-z]`, `[^a-z]` (negated)
 */

// ─── AST Node Constructors ──────────────────────────────────────────────────

/**
 * @typedef {Object} ASTNode
 * @property {string} type - One of: Literal, Concat, Alt, Star, Plus, Optional,
 *                           CharClass, Dot, Empty
 */

/**
 * Create a Literal node.
 * @param {string} ch - The literal character.
 * @returns {ASTNode}
 */
function Literal(ch) {
  return { type: 'Literal', value: ch };
}

/**
 * Create a Concat node.
 * @param {ASTNode} left
 * @param {ASTNode} right
 * @returns {ASTNode}
 */
function Concat(left, right) {
  return { type: 'Concat', left, right };
}

/**
 * Create an Alt (alternation / union) node.
 * @param {ASTNode} left
 * @param {ASTNode} right
 * @returns {ASTNode}
 */
function Alt(left, right) {
  return { type: 'Alt', left, right };
}

/**
 * Create a Star (Kleene star) node.
 * @param {ASTNode} child
 * @returns {ASTNode}
 */
function Star(child) {
  return { type: 'Star', child };
}

/**
 * Create a Plus (one-or-more) node.
 * @param {ASTNode} child
 * @returns {ASTNode}
 */
function Plus(child) {
  return { type: 'Plus', child };
}

/**
 * Create an Optional node.
 * @param {ASTNode} child
 * @returns {ASTNode}
 */
function Optional(child) {
  return { type: 'Optional', child };
}

/**
 * Create a CharClass node.
 * @param {Array<{from: string, to: string}>} ranges - Character ranges.
 * @param {boolean} negated - Whether the class is negated `[^...]`.
 * @returns {ASTNode}
 */
function CharClass(ranges, negated) {
  return { type: 'CharClass', ranges, negated };
}

/** Dot node — matches any character except newline. */
function Dot() {
  return { type: 'Dot' };
}

/** Empty node — matches the empty string ε. */
function Empty() {
  return { type: 'Empty' };
}

// ─── Escape Handling ─────────────────────────────────────────────────────────

const ESCAPE_MAP = {
  'n': '\n',
  't': '\t',
  'r': '\r',
  'f': '\f',
  'v': '\v',
  '0': '\0',
};

/**
 * Resolve an escape character.  `\\n` → `\n`, `\\|` → `|`, etc.
 * @param {string} ch - Character after the backslash.
 * @returns {string}
 */
function resolveEscape(ch) {
  if (ESCAPE_MAP[ch] !== undefined) return ESCAPE_MAP[ch];
  // Any other char is returned literally (handles \\, \|, \., \[, \], \(, \), \*, \+, \?)
  return ch;
}

// ─── Recursive-Descent Parser ────────────────────────────────────────────────

/**
 * Parse a regular expression string into an AST.
 * @param {string} pattern - The regex pattern string.
 * @returns {ASTNode} The root of the AST.
 */
function parseRegex(pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('parseRegex expects a string');
  }
  if (pattern.length === 0) {
    return Empty();
  }

  let pos = 0;

  /** Peek at the current character (or null at end). */
  function peek() {
    return pos < pattern.length ? pattern[pos] : null;
  }

  /** Advance and return the current character. */
  function advance() {
    return pattern[pos++];
  }

  /** Expect a specific character or throw. */
  function expect(ch) {
    if (peek() !== ch) {
      throw new SyntaxError(
        `Regex parse error at position ${pos}: expected '${ch}', got '${peek() || 'EOF'}'`
      );
    }
    advance();
  }

  // ── Grammar ──────────────────────────────────────────────
  // expr     → concat ( '|' concat )*
  // concat   → postfix+
  // postfix  → atom ( '*' | '+' | '?' )*
  // atom     → '(' expr ')' | '[' charclass ']' | '.' | escape | literal

  /**
   * Parse alternation (lowest precedence).
   * @returns {ASTNode}
   */
  function parseExpr() {
    let node = parseConcat();
    while (peek() === '|') {
      advance(); // consume '|'
      const right = parseConcat();
      node = Alt(node, right);
    }
    return node;
  }

  /**
   * Parse concatenation (middle precedence).
   * @returns {ASTNode}
   */
  function parseConcat() {
    // Collect a sequence of postfix atoms.  Stop on '|', ')', or EOF.
    let node = null;
    while (peek() !== null && peek() !== '|' && peek() !== ')') {
      const next = parsePostfix();
      node = node === null ? next : Concat(node, next);
    }
    // An empty alternative (e.g. "a|" or "|b") produces Empty.
    return node !== null ? node : Empty();
  }

  /**
   * Parse postfix operators (highest precedence among binary/unary).
   * @returns {ASTNode}
   */
  function parsePostfix() {
    let node = parseAtom();
    while (peek() === '*' || peek() === '+' || peek() === '?') {
      const op = advance();
      if (op === '*') node = Star(node);
      else if (op === '+') node = Plus(node);
      else node = Optional(node);
    }
    return node;
  }

  /**
   * Parse an atom: group, char class, dot, escape, or literal.
   * @returns {ASTNode}
   */
  function parseAtom() {
    const ch = peek();

    if (ch === '(') {
      advance(); // consume '('
      const node = parseExpr();
      expect(')');
      return node;
    }

    if (ch === '[') {
      return parseCharClass();
    }

    if (ch === '.') {
      advance();
      return Dot();
    }

    if (ch === '\\') {
      advance(); // consume '\\'
      const escaped = advance();
      if (escaped === undefined) {
        throw new SyntaxError('Regex parse error: trailing backslash');
      }
      return Literal(resolveEscape(escaped));
    }

    // Regular literal
    if (ch === null) {
      throw new SyntaxError('Regex parse error: unexpected end of input');
    }
    if (ch === '*' || ch === '+' || ch === '?') {
      throw new SyntaxError(
        `Regex parse error at position ${pos}: unexpected quantifier '${ch}'`
      );
    }
    advance();
    return Literal(ch);
  }

  /**
   * Parse a character class `[...]` or `[^...]`.
   * Inside a class: `a-z` denotes a range; `]` at start is literal;
   * backslash escapes work.
   * @returns {ASTNode}
   */
  function parseCharClass() {
    expect('[');

    let negated = false;
    if (peek() === '^') {
      negated = true;
      advance();
    }

    const ranges = [];

    // Handle `]` as first char (literal `]`).
    if (peek() === ']') {
      const ch = advance();
      if (peek() === '-' && pos + 1 < pattern.length && pattern[pos + 1] !== ']') {
        advance(); // consume '-'
        const end = parseClassChar();
        ranges.push({ from: ch, to: end });
      } else {
        ranges.push({ from: ch, to: ch });
      }
    }

    while (peek() !== null && peek() !== ']') {
      const startChar = parseClassChar();
      if (peek() === '-' && pos + 1 < pattern.length && pattern[pos + 1] !== ']') {
        advance(); // consume '-'
        const endChar = parseClassChar();
        if (startChar.charCodeAt(0) > endChar.charCodeAt(0)) {
          throw new SyntaxError(
            `Regex parse error: invalid character class range '${startChar}-${endChar}'`
          );
        }
        ranges.push({ from: startChar, to: endChar });
      } else {
        ranges.push({ from: startChar, to: startChar });
      }
    }

    expect(']');

    if (ranges.length === 0) {
      throw new SyntaxError('Regex parse error: empty character class');
    }

    return CharClass(ranges, negated);
  }

  /**
   * Parse a single character inside a character class (handles escapes).
   * @returns {string}
   */
  function parseClassChar() {
    if (peek() === '\\') {
      advance();
      const ch = advance();
      if (ch === undefined) {
        throw new SyntaxError('Regex parse error: trailing backslash in character class');
      }
      return resolveEscape(ch);
    }
    return advance();
  }

  // ── Run the parser ─────────────────────────────────────────

  const ast = parseExpr();

  if (pos !== pattern.length) {
    throw new SyntaxError(
      `Regex parse error at position ${pos}: unexpected character '${pattern[pos]}'`
    );
  }

  return ast;
}

// ─── Utility: expand a CharClass node into the set of matching chars ─────────

/**
 * Expand a CharClass AST node into an array of individual characters.
 * For negated classes, expands against printable ASCII (codes 32-126)
 * excluding newline.
 * @param {ASTNode} node - A CharClass node.
 * @returns {string[]} Array of matching characters.
 */
function expandCharClass(node) {
  if (node.type !== 'CharClass') {
    throw new TypeError('expandCharClass expects a CharClass node');
  }
  const included = new Set();
  for (const range of node.ranges) {
    const lo = range.from.charCodeAt(0);
    const hi = range.to.charCodeAt(0);
    for (let c = lo; c <= hi; c++) {
      included.add(String.fromCharCode(c));
    }
  }
  if (!node.negated) {
    return Array.from(included);
  }
  // Negated: all printable ASCII except newline, minus included chars.
  const result = [];
  for (let c = 32; c <= 126; c++) {
    const ch = String.fromCharCode(c);
    if (!included.has(ch)) {
      result.push(ch);
    }
  }
  return result;
}

module.exports = {
  parseRegex,
  expandCharClass,
  // AST constructors (useful for programmatic AST building)
  Literal,
  Concat,
  Alt,
  Star,
  Plus,
  Optional,
  CharClass,
  Dot,
  Empty,
};

  };
  mods['./nfa'] = function (module, exports, require) {
'use strict';

/**
 * @module nfa
 * @description Thompson's Construction — convert a regex AST into an NFA.
 *
 * Each NFA is a fragment with a single start state and a single accept state.
 * Transitions are either on a character (symbol) or on epsilon (ε).
 */

const { expandCharClass } = require('./regex-parser');

// ─── State ID Generator ─────────────────────────────────────────────────────

let _nextStateId = 0;

/** Reset the global state counter (useful for tests). */
function resetStateCounter() {
  _nextStateId = 0;
}

/** Allocate the next unique state id. */
function nextId() {
  return _nextStateId++;
}

// ─── NFAState ────────────────────────────────────────────────────────────────

/**
 * A single state in an NFA.
 * @class
 */
class NFAState {
  /**
   * @param {number} id - Unique identifier for this state.
   */
  constructor(id) {
    /** @type {number} */
    this.id = id;
    /**
     * Transitions on symbols.  Maps character → Set<NFAState>.
     * @type {Map<string, Set<NFAState>>}
     */
    this.transitions = new Map();
    /**
     * Epsilon transitions.
     * @type {Set<NFAState>}
     */
    this.epsilonTransitions = new Set();
  }

  /**
   * Add a transition on a symbol.
   * @param {string} symbol - The input character.
   * @param {NFAState} state - Target state.
   */
  addTransition(symbol, state) {
    if (!this.transitions.has(symbol)) {
      this.transitions.set(symbol, new Set());
    }
    this.transitions.get(symbol).add(state);
  }

  /**
   * Add an epsilon (ε) transition.
   * @param {NFAState} state - Target state.
   */
  addEpsilonTransition(state) {
    this.epsilonTransitions.add(state);
  }
}

// ─── NFA ─────────────────────────────────────────────────────────────────────

/**
 * Non-deterministic Finite Automaton.
 * @class
 */
class NFA {
  /**
   * @param {NFAState} start  - The start state.
   * @param {NFAState} accept - The single accept state.
   */
  constructor(start, accept) {
    /** @type {NFAState} */
    this.start = start;
    /** @type {NFAState} */
    this.accept = accept;
  }

  // ── Epsilon Closure ──────────────────────────────────────────

  /**
   * Compute the epsilon closure of a set of states.
   * @param {Set<NFAState>|NFAState[]} states
   * @returns {Set<NFAState>}
   */
  static epsilonClosure(states) {
    const closure = new Set(states);
    const stack = Array.from(states);
    while (stack.length > 0) {
      const state = stack.pop();
      for (const next of state.epsilonTransitions) {
        if (!closure.has(next)) {
          closure.add(next);
          stack.push(next);
        }
      }
    }
    return closure;
  }

  /**
   * Compute the set of states reachable from `states` on `symbol`,
   * followed by epsilon closure.
   * @param {Set<NFAState>} states
   * @param {string} symbol
   * @returns {Set<NFAState>}
   */
  static move(states, symbol) {
    const reached = new Set();
    for (const s of states) {
      const targets = s.transitions.get(symbol);
      if (targets) {
        for (const t of targets) {
          reached.add(t);
        }
      }
    }
    return NFA.epsilonClosure(reached);
  }

  // ── Simulation ───────────────────────────────────────────────

  /**
   * Simulate the NFA on an input string.
   * @param {string} input - The input string.
   * @returns {boolean} True if the NFA accepts the input.
   */
  simulate(input) {
    let current = NFA.epsilonClosure([this.start]);
    for (let i = 0; i < input.length; i++) {
      current = NFA.move(current, input[i]);
      if (current.size === 0) return false;
    }
    return current.has(this.accept);
  }

  // ── Introspection ────────────────────────────────────────────

  /**
   * Collect all reachable states via BFS.
   * @returns {NFAState[]}
   */
  getStates() {
    const visited = new Set();
    const queue = [this.start];
    visited.add(this.start);
    while (queue.length > 0) {
      const s = queue.shift();
      for (const targets of s.transitions.values()) {
        for (const t of targets) {
          if (!visited.has(t)) {
            visited.add(t);
            queue.push(t);
          }
        }
      }
      for (const t of s.epsilonTransitions) {
        if (!visited.has(t)) {
          visited.add(t);
          queue.push(t);
        }
      }
    }
    return Array.from(visited);
  }

  /**
   * Derive the input alphabet from all transitions (excluding ε).
   * @returns {string[]} Sorted array of symbols.
   */
  getAlphabet() {
    const symbols = new Set();
    for (const state of this.getStates()) {
      for (const sym of state.transitions.keys()) {
        symbols.add(sym);
      }
    }
    return Array.from(symbols).sort();
  }

  /**
   * Serializable JSON representation for visualization.
   * @returns {Object}
   */
  toJSON() {
    const states = this.getStates();
    const stateList = states.map(s => s.id);
    const transitions = [];
    for (const s of states) {
      for (const [sym, targets] of s.transitions) {
        for (const t of targets) {
          transitions.push({ from: s.id, to: t.id, symbol: sym });
        }
      }
      for (const t of s.epsilonTransitions) {
        transitions.push({ from: s.id, to: t.id, symbol: 'ε' });
      }
    }
    return {
      states: stateList,
      start: this.start.id,
      accept: this.accept.id,
      transitions,
      alphabet: this.getAlphabet(),
    };
  }
}

// ─── Thompson's Construction ─────────────────────────────────────────────────

/**
 * Build an NFA from a regex AST using Thompson's Construction.
 * @param {Object} ast - The AST produced by parseRegex.
 * @returns {NFA}
 */
function regexToNFA(ast) {
  resetStateCounter();
  return _build(ast);
}

/**
 * Internal recursive builder.
 * @param {Object} node - AST node.
 * @returns {NFA} An NFA fragment.
 */
function _build(node) {
  switch (node.type) {
    case 'Literal':
      return _buildLiteral(node.value);

    case 'Concat':
      return _buildConcat(node.left, node.right);

    case 'Alt':
      return _buildAlt(node.left, node.right);

    case 'Star':
      return _buildStar(node.child);

    case 'Plus':
      return _buildPlus(node.child);

    case 'Optional':
      return _buildOptional(node.child);

    case 'CharClass':
      return _buildCharClass(node);

    case 'Dot':
      return _buildDot();

    case 'Empty':
      return _buildEmpty();

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

/**
 * Thompson's construction for a single literal character.
 *
 *   (start) --ch--> (accept)
 */
function _buildLiteral(ch) {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  start.addTransition(ch, accept);
  return new NFA(start, accept);
}

/**
 * Thompson's construction for concatenation.
 *
 *   NFA1.start --...--> NFA1.accept --ε--> NFA2.start --...--> NFA2.accept
 */
function _buildConcat(left, right) {
  const nfa1 = _build(left);
  const nfa2 = _build(right);
  nfa1.accept.addEpsilonTransition(nfa2.start);
  return new NFA(nfa1.start, nfa2.accept);
}

/**
 * Thompson's construction for alternation.
 *
 *          ε──> NFA1 ──ε
 *         /               \
 *   start                  accept
 *         \               /
 *          ε──> NFA2 ──ε
 */
function _buildAlt(left, right) {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  const nfa1 = _build(left);
  const nfa2 = _build(right);

  start.addEpsilonTransition(nfa1.start);
  start.addEpsilonTransition(nfa2.start);
  nfa1.accept.addEpsilonTransition(accept);
  nfa2.accept.addEpsilonTransition(accept);

  return new NFA(start, accept);
}

/**
 * Thompson's construction for Kleene star.
 *
 *          ε────────────────ε
 *         /                   \
 *   start ──ε──> NFA ──ε──> accept
 *                  \    ε    /
 *                   \──────/
 */
function _buildStar(child) {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  const nfa = _build(child);

  start.addEpsilonTransition(nfa.start);
  start.addEpsilonTransition(accept);       // skip (zero occurrences)
  nfa.accept.addEpsilonTransition(nfa.start); // loop back
  nfa.accept.addEpsilonTransition(accept);    // exit

  return new NFA(start, accept);
}

/**
 * Thompson's construction for plus (one-or-more).
 *
 *   start ──ε──> NFA ──ε──> accept
 *                  \    ε    /
 *                   \──────/  (loop back)
 *
 * (no skip from start to accept — must go through NFA at least once)
 */
function _buildPlus(child) {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  const nfa = _build(child);

  start.addEpsilonTransition(nfa.start);
  nfa.accept.addEpsilonTransition(nfa.start); // loop back
  nfa.accept.addEpsilonTransition(accept);    // exit

  return new NFA(start, accept);
}

/**
 * Thompson's construction for optional (zero-or-one).
 *
 *          ε────────────────ε
 *         /                   \
 *   start ──ε──> NFA ──ε──> accept
 *
 * (skip allowed, but no loop back)
 */
function _buildOptional(child) {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  const nfa = _build(child);

  start.addEpsilonTransition(nfa.start);
  start.addEpsilonTransition(accept);      // skip
  nfa.accept.addEpsilonTransition(accept); // exit

  return new NFA(start, accept);
}

/**
 * Build an NFA for a character class.
 * Expands the ranges and creates an alternation of literals.
 *
 *          ε──> (--c1-->) ──ε
 *         /                   \
 *   start ──ε──> (--c2-->) ──ε──> accept
 *         \                   /
 *          ε──> (--c3-->) ──ε
 */
function _buildCharClass(node) {
  const chars = expandCharClass(node);
  if (chars.length === 0) {
    // Degenerate: no chars match — build a dead NFA (never accepts).
    const start = new NFAState(nextId());
    const accept = new NFAState(nextId());
    return new NFA(start, accept); // no transitions at all
  }

  // Optimization: single transition from start to accept for each char.
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  for (const ch of chars) {
    start.addTransition(ch, accept);
  }
  return new NFA(start, accept);
}

/**
 * Build an NFA for the dot metacharacter (any char except newline).
 * Uses printable ASCII range 32-126 plus \t, \r (but not \n).
 */
function _buildDot() {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  // Tab and carriage return
  start.addTransition('\t', accept);
  start.addTransition('\r', accept);
  // Printable ASCII 32–126
  for (let c = 32; c <= 126; c++) {
    start.addTransition(String.fromCharCode(c), accept);
  }
  return new NFA(start, accept);
}

/**
 * Build an NFA for the empty string ε.
 *
 *   start ──ε──> accept
 */
function _buildEmpty() {
  const start = new NFAState(nextId());
  const accept = new NFAState(nextId());
  start.addEpsilonTransition(accept);
  return new NFA(start, accept);
}

module.exports = {
  NFAState,
  NFA,
  regexToNFA,
  resetStateCounter,
};

  };
  mods['./dfa'] = function (module, exports, require) {
'use strict';

/**
 * @module dfa
 * @description Subset (powerset) construction — convert an NFA to a DFA.
 *
 * Each DFA state corresponds to a set of NFA states.  A DFA state is
 * accepting if any of its constituent NFA states is the NFA's accept state.
 */

const { NFA } = require('./nfa');

// ─── DFAState ────────────────────────────────────────────────────────────────

/**
 * A single state in a DFA.
 * @class
 */
class DFAState {
  /**
   * @param {number} id        - Unique identifier.
   * @param {Set<number>} nfaStates - Set of NFA state ids this DFA state represents.
   * @param {boolean} isAccept - Whether this is an accepting state.
   */
  constructor(id, nfaStates, isAccept) {
    /** @type {number} */
    this.id = id;
    /** @type {Set<number>} */
    this.nfaStates = nfaStates;
    /** @type {boolean} */
    this.isAccept = isAccept;
    /**
     * Transitions: symbol → DFAState
     * @type {Map<string, DFAState>}
     */
    this.transitions = new Map();
  }
}

// ─── DFA ─────────────────────────────────────────────────────────────────────

/**
 * Deterministic Finite Automaton.
 * @class
 */
class DFA {
  /**
   * @param {DFAState} start               - The start state.
   * @param {Map<number, DFAState>} states  - id → DFAState map.
   * @param {string[]} alphabet             - Input alphabet.
   */
  constructor(start, states, alphabet) {
    /** @type {DFAState} */
    this.start = start;
    /** @type {Map<number, DFAState>} */
    this.states = states;
    /** @type {string[]} */
    this.alphabet = alphabet;
  }

  /**
   * Simulate the DFA on an input string.
   * @param {string} input
   * @returns {boolean} True if the DFA accepts the input.
   */
  simulate(input) {
    let current = this.start;
    for (let i = 0; i < input.length; i++) {
      const next = current.transitions.get(input[i]);
      if (!next) return false; // no transition → reject (implicit dead state)
      current = next;
    }
    return current.isAccept;
  }

  /**
   * Return a transition table representation.
   * @returns {{headers: string[], rows: Object[]}}
   *   headers: ['State', ...alphabet]
   *   rows: [{state, isAccept, isStart, transitions: {symbol: targetId}}]
   */
  toTransitionTable() {
    const headers = ['State', ...this.alphabet];
    const rows = [];
    for (const [id, state] of this.states) {
      const transObj = {};
      for (const sym of this.alphabet) {
        const target = state.transitions.get(sym);
        transObj[sym] = target ? target.id : null;
      }
      rows.push({
        state: id,
        isAccept: state.isAccept,
        isStart: state === this.start,
        transitions: transObj,
      });
    }
    // Sort rows by state id for deterministic output
    rows.sort((a, b) => a.state - b.state);
    return { headers, rows };
  }

  /**
   * Serializable JSON representation for visualization.
   * @returns {Object}
   */
  toJSON() {
    const stateList = [];
    const transitions = [];
    for (const [id, state] of this.states) {
      stateList.push({
        id,
        isAccept: state.isAccept,
        isStart: state === this.start,
        nfaStates: Array.from(state.nfaStates).sort((a, b) => a - b),
      });
      for (const [sym, target] of state.transitions) {
        transitions.push({ from: id, to: target.id, symbol: sym });
      }
    }
    stateList.sort((a, b) => a.id - b.id);
    return {
      states: stateList,
      start: this.start.id,
      accepting: stateList.filter(s => s.isAccept).map(s => s.id),
      transitions,
      alphabet: this.alphabet,
    };
  }
}

// ─── Subset Construction ─────────────────────────────────────────────────────

/**
 * Convert an NFA to an equivalent DFA via the subset (powerset) construction.
 *
 * @param {import('./nfa').NFA} nfa - The NFA to convert.
 * @returns {DFA} The resulting DFA.
 */
function nfaToDFA(nfa) {
  const alphabet = nfa.getAlphabet();
  const allNFAStates = nfa.getStates();

  // Build an id → NFAState lookup for fast access.
  const nfaStateById = new Map();
  for (const s of allNFAStates) {
    nfaStateById.set(s.id, s);
  }

  // Helper: create a canonical key for a set of NFA state ids.
  function setKey(nfaStateIds) {
    return Array.from(nfaStateIds).sort((a, b) => a - b).join(',');
  }

  // Helper: extract ids from a Set<NFAState>.
  function stateIds(stateSet) {
    const ids = new Set();
    for (const s of stateSet) {
      ids.add(s.id);
    }
    return ids;
  }

  let dfaIdCounter = 0;

  // The initial DFA state is the epsilon closure of the NFA start state.
  const startClosure = NFA.epsilonClosure([nfa.start]);
  const startNfaIds = stateIds(startClosure);
  const startKey = setKey(startNfaIds);
  const startIsAccept = startClosure.has(nfa.accept);
  const startDFAState = new DFAState(dfaIdCounter++, startNfaIds, startIsAccept);

  /** @type {Map<string, DFAState>} canonical key → DFAState */
  const dfaStatesMap = new Map();
  dfaStatesMap.set(startKey, startDFAState);

  /** @type {Map<string, Set<import('./nfa').NFAState>>} key → NFA state set */
  const nfaStateSets = new Map();
  nfaStateSets.set(startKey, startClosure);

  const worklist = [startKey];

  while (worklist.length > 0) {
    const currentKey = worklist.pop();
    const currentDFA = dfaStatesMap.get(currentKey);
    const currentNFASet = nfaStateSets.get(currentKey);

    for (const sym of alphabet) {
      const nextNFASet = NFA.move(currentNFASet, sym);
      if (nextNFASet.size === 0) continue; // goes to dead state — skip

      const nextIds = stateIds(nextNFASet);
      const nextKey = setKey(nextIds);

      if (!dfaStatesMap.has(nextKey)) {
        const isAccept = nextNFASet.has(nfa.accept);
        const newState = new DFAState(dfaIdCounter++, nextIds, isAccept);
        dfaStatesMap.set(nextKey, newState);
        nfaStateSets.set(nextKey, nextNFASet);
        worklist.push(nextKey);
      }

      currentDFA.transitions.set(sym, dfaStatesMap.get(nextKey));
    }
  }

  // Build final states map by id.
  const statesById = new Map();
  for (const state of dfaStatesMap.values()) {
    statesById.set(state.id, state);
  }

  return new DFA(startDFAState, statesById, alphabet);
}

module.exports = {
  DFAState,
  DFA,
  nfaToDFA,
};

  };
  mods['./minimize'] = function (module, exports, require) {
'use strict';

/**
 * @module minimize
 * @description DFA minimization using Hopcroft's partition refinement algorithm.
 * Also provides language equivalence checking between two DFAs.
 */

const { DFA, DFAState } = require('./dfa');

/**
 * Minimize a deterministic finite automaton using Hopcroft's algorithm.
 *
 * @param {DFA} dfa - The DFA to minimize.
 * @returns {DFA} A new, minimal DFA accepting the same language.
 */
function minimizeDFA(dfa) {
  const startState = dfa.start || dfa.startState;
  if (!startState) {
    const dummy = new DFAState(0, new Set(), false);
    return new DFA(dummy, new Map([[0, dummy]]), dfa.alphabet || []);
  }

  // 1. Gather reachable states from start state via BFS/DFS
  const reachable = new Set();
  const queue = [startState];
  reachable.add(startState.id);

  while (queue.length > 0) {
    const curr = queue.shift();
    for (const [, nextState] of curr.transitions) {
      if (nextState && !reachable.has(nextState.id)) {
        reachable.add(nextState.id);
        queue.push(nextState);
      }
    }
  }

  // Filter to only reachable states
  const states = [];
  for (const [id, state] of dfa.states) {
    if (reachable.has(id)) {
      states.push(state);
    }
  }

  if (states.length === 0) {
    const dummy = new DFAState(0, new Set(), false);
    return new DFA(dummy, new Map([[0, dummy]]), dfa.alphabet);
  }

  // 2. Initial partition: F (accepting) and Q \ F (non-accepting)
  const accepting = new Set();
  const nonAccepting = new Set();
  for (const s of states) {
    if (s.isAccept) {
      accepting.add(s.id);
    } else {
      nonAccepting.add(s.id);
    }
  }

  /** @type {Array<Set<number>>} */
  let P = [];
  if (accepting.size > 0) P.push(accepting);
  if (nonAccepting.size > 0) P.push(nonAccepting);

  // Worklist W initialized to P
  /** @type {Array<Set<number>>} */
  let W = [];
  if (accepting.size > 0 && nonAccepting.size > 0) {
    // Choose the smaller set for efficiency
    if (accepting.size <= nonAccepting.size) {
      W.push(new Set(accepting));
    } else {
      W.push(new Set(nonAccepting));
    }
  } else if (P.length > 0) {
    W.push(new Set(P[0]));
  }

  const alphabet = Array.from(dfa.alphabet).sort();

  // Helper map: id -> DFAState
  const stateMap = new Map();
  for (const s of states) {
    stateMap.set(s.id, s);
  }

  // Precompute reverse transitions: symbol -> (targetId -> Set<sourceId>)
  const revTransitions = new Map();
  for (const sym of alphabet) {
    revTransitions.set(sym, new Map());
  }
  for (const s of states) {
    for (const [sym, nextState] of s.transitions) {
      if (!revTransitions.has(sym)) {
        revTransitions.set(sym, new Map());
      }
      const symRev = revTransitions.get(sym);
      if (!symRev.has(nextState.id)) {
        symRev.set(nextState.id, new Set());
      }
      symRev.get(nextState.id).add(s.id);
    }
  }

  // 3. Hopcroft's partition refinement loop
  while (W.length > 0) {
    const A = W.shift();

    for (const c of alphabet) {
      // X = set of states for which transition on c leads to a state in A
      const X = new Set();
      const symRev = revTransitions.get(c);
      if (symRev) {
        for (const targetId of A) {
          const sources = symRev.get(targetId);
          if (sources) {
            for (const srcId of sources) {
              X.add(srcId);
            }
          }
        }
      }

      if (X.size === 0) continue;

      const newP = [];
      for (const Y of P) {
        // Compute intersection X_int_Y and difference Y_minus_X
        const X_int_Y = new Set();
        const Y_minus_X = new Set();
        for (const yId of Y) {
          if (X.has(yId)) {
            X_int_Y.add(yId);
          } else {
            Y_minus_X.add(yId);
          }
        }

        if (X_int_Y.size > 0 && Y_minus_X.size > 0) {
          newP.push(X_int_Y);
          newP.push(Y_minus_X);

          // Update worklist W
          const indexInW = W.findIndex(wSet => setsEqual(wSet, Y));
          if (indexInW !== -1) {
            W.splice(indexInW, 1, X_int_Y, Y_minus_X);
          } else {
            if (X_int_Y.size <= Y_minus_X.size) {
              W.push(X_int_Y);
            } else {
              W.push(Y_minus_X);
            }
          }
        } else {
          newP.push(Y);
        }
      }
      P = newP;
    }
  }

  // Helper: check set equality
  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  // 4. Construct minimized DFA from partition P
  // Map old state id -> block index
  const stateToBlock = new Map();
  for (let i = 0; i < P.length; i++) {
    for (const id of P[i]) {
      stateToBlock.set(id, i);
    }
  }

  // Find which block contains the start state
  const startBlockIdx = stateToBlock.get(startState.id);

  // Create new DFA states
  const newStates = new Map();
  for (let i = 0; i < P.length; i++) {
    const block = P[i];
    // Block is accept if any state in it is accept
    let isAccept = false;
    const combinedNfaStates = new Set();
    for (const id of block) {
      const orig = stateMap.get(id);
      if (orig) {
        if (orig.isAccept) isAccept = true;
        for (const nid of orig.nfaStates) combinedNfaStates.add(nid);
      }
    }
    newStates.set(i, new DFAState(i, combinedNfaStates, isAccept));
  }

  // Connect transitions
  for (let i = 0; i < P.length; i++) {
    const block = P[i];
    const repId = block.values().next().value;
    const repState = stateMap.get(repId);
    const newBlockState = newStates.get(i);

    if (repState) {
      for (const [sym, targetState] of repState.transitions) {
        const targetBlock = stateToBlock.get(targetState.id);
        if (targetBlock !== undefined) {
          newBlockState.transitions.set(sym, newStates.get(targetBlock));
        }
      }
    }
  }

  const newStartState = newStates.get(startBlockIdx);
  return new DFA(newStartState, newStates, dfa.alphabet);
}

/**
 * Determine if two DFAs recognize the exact same formal language.
 * Uses minimization and canonical isomorphism check.
 *
 * @param {DFA} dfa1
 * @param {DFA} dfa2
 * @returns {boolean} True if equivalent.
 */
function areEquivalent(dfa1, dfa2) {
  // A standard way is product automaton (symmetric difference)
  // or testing if (L1 \ L2) == ∅ and (L2 \ L1) == ∅.
  // BFS on pairs of states (s1, s2).
  const combinedAlphabet = new Set([...dfa1.alphabet, ...dfa2.alphabet]);
  const visited = new Set();
  const s1Start = dfa1.start || dfa1.startState;
  const s2Start = dfa2.start || dfa2.startState;
  const queue = [{ s1: s1Start, s2: s2Start }];

  function key(s1, s2) {
    const id1 = s1 ? s1.id : 'null';
    const id2 = s2 ? s2.id : 'null';
    return `${id1},${id2}`;
  }

  visited.add(key(s1Start, s2Start));

  while (queue.length > 0) {
    const { s1, s2 } = queue.shift();

    const accept1 = s1 ? s1.isAccept : false;
    const accept2 = s2 ? s2.isAccept : false;

    // If one accepts and the other does not, languages differ
    if (accept1 !== accept2) {
      return false;
    }

    for (const sym of combinedAlphabet) {
      const next1 = s1 ? s1.transitions.get(sym) || null : null;
      const next2 = s2 ? s2.transitions.get(sym) || null : null;

      const k = key(next1, next2);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ s1: next1, s2: next2 });
      }
    }
  }

  return true;
}

module.exports = {
  minimizeDFA,
  areEquivalent,
};

  };
  mods['./index'] = function (module, exports, require) {
'use strict';

/**
 * @module automata
 * @description Educational and production Automata module for NexCC:
 *   Regex AST -> NFA (Thompson's) -> DFA (Subset construction) -> Minimized DFA (Hopcroft's)
 */

const { parseRegex, expandCharClass } = require('./regex-parser');
const { NFA, NFAState, regexToNFA, resetStateCounter } = require('./nfa');
const { DFA, DFAState, nfaToDFA } = require('./dfa');
const { minimizeDFA, areEquivalent } = require('./minimize');

/**
 * Convenience pipeline helper: compile regex string all the way to minimized DFA.
 * @param {string} pattern
 * @returns {{ ast: object, nfa: NFA, dfa: DFA, minDfa: DFA }}
 */
function compileRegexPipeline(pattern) {
  const ast = parseRegex(pattern);
  const nfa = regexToNFA(ast);
  const dfa = nfaToDFA(nfa);
  const minDfa = minimizeDFA(dfa);
  return { ast, nfa, dfa, minDfa };
}

module.exports = {
  parseRegex,
  expandCharClass,
  NFA,
  NFAState,
  regexToNFA,
  resetStateCounter,
  DFA,
  DFAState,
  nfaToDFA,
  minimizeDFA,
  areEquivalent,
  compileRegexPipeline,
};

  };
  return req('./index');
})();
