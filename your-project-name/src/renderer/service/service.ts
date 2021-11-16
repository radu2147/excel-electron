/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable @typescript-eslint/no-extra-non-null-assertion */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/no-named-as-default-member */
import { parse } from 'expression-eval';
import {
  getReferenceFromIndices,
  mapLetterToIndex,
  SIZE,
} from 'renderer/utils/utils';
import Cell from '../domain/Cell';

function mapCellToValue(cell: string, col: number, data: Cell[][]): number {
  const ind = mapLetterToIndex(cell);
  if (col >= data.length || ind >= data[0].length) {
    throw new Error('Cell indices out of range');
  }
  return data[col][ind].value !== null ? +data[col][ind].value!! : 0;
}

function isCellReference(cell: string): boolean {
  try {
    return mapLetterToIndex(cell[0]) < SIZE && +cell.slice(1) < SIZE;
  } catch (e) {
    return false;
  }
}

// function used for highlighting cells when referenced in text pane
function getReferences(comm: string): Map<string, boolean> {
  const map = new Map<string, boolean>();
  let copy = comm;
  while (true) {
    const els = copy.match('[A-Z][0-9]+'); // should match only expressions like A0, B1 etc.
    if (els == null || els?.length === 0) break;
    map.set(els[0]!!, true);
    els.forEach((it) => {
      copy = copy.replace(it, '');
    });
  }
  return map;
}

// function used to calculate sum using a range of cells
// parameters are upper-left corner and bottom-down corner indices and the result is the sum of all cells within that rectangle
function sumCells(
  row1: string,
  col1: number,
  row2: string,
  col2: number,
  data: Cell[][],
  refs: string[]
): number {
  let rez = 0;
  for (let i = mapLetterToIndex(row1); i <= mapLetterToIndex(row2); i += 1) {
    for (let j = col1; j <= col2; j += 1) {
      refs.push(getReferenceFromIndices(i, j));
      if (data[j][i].value !== null) {
        rez += +data[j][i].value!!;
      }
    }
  }
  return rez;
}

// function used to calculate product using a range of cells
// parameters are upper-left corner and bottom-down corner indices and the result is the product of all cells within that rectangle
function productCells(
  row1: string,
  col1: number,
  row2: string,
  col2: number,
  data: Cell[][],
  refs: string[]
): number {
  let rez = 1;
  for (let i = mapLetterToIndex(row1); i <= mapLetterToIndex(row2); i += 1) {
    for (let j = col1; j <= col2; j += 1) {
      refs.push(getReferenceFromIndices(i, j));
      if (data[j][i].value !== null) {
        rez *= +data[j][i].value!!;
      }
    }
  }
  return rez;
}

// function used to parse the expression tree to get compute the value
// used for creation of a new expression for that cells. Keeps track of references for that graph
function parseBinaryTree(
  ast: parse.Expression,
  data: Cell[][],
  refs: string[]
): number {
  if (ast.type === 'Literal') {
    const lit = ast as parse.Literal;
    return lit.value as number;
  }
  if (ast.type === 'Identifier') {
    const lit = ast as parse.Identifier;
    if (!isCellReference(lit.name)) {
      throw new Error('Invalid cell reference format');
    }
    const x = mapCellToValue(lit.name[0], +lit.name[1], data);
    refs.push(lit.name);
    return x;
  }
  if (ast.type === 'CallExpression') {
    const lit = ast as parse.CallExpression;
    const args = lit.arguments;
    const { type } = lit.callee;
    if (type !== 'Identifier') {
      throw new Error('Function name invalid');
    }
    const fun = lit.callee as parse.Identifier;
    if (fun.name === 'sum') {
      if (args.length !== 2) {
        throw new Error('Arguments number is wrong');
      }
      if (args[0].type !== 'Identifier' && args[1].type !== 'Identifier') {
        throw new Error('Arguments should be cell identifiers');
      }
      const arg0 = args[0] as parse.Identifier;
      const arg1 = args[1] as parse.Identifier;
      return sumCells(
        arg0.name[0],
        +arg0.name[1],
        arg1.name[0],
        +arg1.name[1],
        data,
        refs
      );
    }
    if (fun.name === 'prod') {
      if (args.length !== 2) {
        throw new Error('Arguments number is wrong');
      }
      if (args[0].type !== 'Identifier' && args[1].type !== 'Identifier') {
        throw new Error('Arguments should be cell identifiers');
      }
      const arg0 = args[0] as parse.Identifier;
      const arg1 = args[1] as parse.Identifier;
      return productCells(
        arg0.name[0],
        +arg0.name[1],
        arg1.name[0],
        +arg1.name[1],
        data,
        refs
      );
    }
    throw new Error('No supported operation');
  }
  const expr = ast as parse.BinaryExpression;
  let rez = 0;
  switch (expr.operator) {
    case '+': {
      rez =
        parseBinaryTree(expr.left, data, refs) +
        parseBinaryTree(expr.right, data, refs);
      break;
    }
    case '-': {
      rez =
        parseBinaryTree(expr.left, data, refs) -
        parseBinaryTree(expr.right, data, refs);
      break;
    }

    case '*': {
      rez =
        parseBinaryTree(expr.left, data, refs) *
        parseBinaryTree(expr.right, data, refs);
      break;
    }

    case '/': {
      rez =
        parseBinaryTree(expr.left, data, refs) /
        parseBinaryTree(expr.right, data, refs);
      break;
    }
    default:
      throw new Error(`Operator ${expr.operator} not supported`);
  }
  return rez;
}

// utility function to detect cycles in a directed graph
function checkCycleRec(
  data: Cell[][],
  indRow: number,
  indCol: number,
  visited: Map<Cell, boolean>,
  st: Map<Cell, boolean>
): boolean {
  if (st.has(data[indRow][indCol]) && st.get(data[indRow][indCol])) {
    return true;
  }

  if (visited.has(data[indRow][indCol])) {
    return false;
  }

  visited.set(data[indRow][indCol], true);
  st.set(data[indRow][indCol], true);

  for (let i = 0; i < data[indRow][indCol].references.length; i += 1) {
    if (
      checkCycleRec(
        data,
        +data[indRow][indCol].references[i].slice(1),
        mapLetterToIndex(data[indRow][indCol].references[i][0]),
        visited,
        st
      )
    ) {
      return true;
    }
  }

  st.set(data[indRow][indCol], false);
  return false;
}

// main function that uses utility function to check if there is a cycle in the graph
function checkCycles(data: Cell[][], indRow: number, indCol: number): boolean {
  const visited = new Map<Cell, boolean>();
  const inPath = new Map<Cell, boolean>();
  return checkCycleRec(data, indRow, indCol, visited, inPath);
}

// evaluates a string expression.
function evalFormula(data: Cell[][], formula: string): string {
  const ast = parse(formula);
  return parseBinaryTree(ast, data, []).toString();
}

// main function that interacts with frontend.
// it parses the expressions, manages references graph and checks for cycle detection using additional functions
function parseCommand(
  comm: string,
  data: Cell[][],
  indRow: number,
  indCol: number
): Cell {
  const ast = parse(comm);
  const refs: string[] = [];
  const val = parseBinaryTree(ast, data, refs).toString();
  for (let i = 0; i < data.length; i += 1) {
    for (let j = 0; j < data[0].length; j += 1) {
      data[i][j].references = data[i][j].references.filter(
        (it) => it !== getReferenceFromIndices(indCol, indRow)
      );
    }
  }
  refs.forEach((it) => {
    data[+it.slice(1)][mapLetterToIndex(it[0])].references.push(
      getReferenceFromIndices(indCol, indRow)
    );
  });
  if (checkCycles(data, indRow, indCol)) {
    refs.forEach((it) => {
      data[+it.slice(1)][mapLetterToIndex(it[0])].references.pop();
    });
    throw new Error('Cycle detected');
  }
  return {
    value: val,
    formula: comm,
    references: data[indRow][indCol].references,
  };
}

// used to rerender sheet after an expression of a cell changes
// basically a graph traversal with dfs
function renderSheet(data: Cell[][], indRow: number, indCol: number) {
  let currentCell = data[indRow][indCol];
  const stack: Cell[] = [currentCell];
  while (stack.length > 0) {
    currentCell = stack.pop()!!;
    currentCell.references.forEach((it) =>
      stack.push(data[+it.slice(1)][mapLetterToIndex(it[0])])
    );
    currentCell.value = evalFormula(data, currentCell.formula!!);
  }
}

export { parseCommand, renderSheet, getReferences };
