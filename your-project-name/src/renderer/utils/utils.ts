/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import { useState } from 'react';
import Cell from '../domain/Cell';

const SIZE = 10;

function mapSizeToLetters(size: number): Array<string> {
  if (size > 25) {
    throw new Error('Size too big');
  }
  const arr = 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,R,S,T,U,V,W,X,Y,Z';
  const headers = arr.split(',');
  return headers.slice(0, size);
}

function mapLetterToIndex(comm: string): number {
  const arr = 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,R,S,T,U,V,W,X,Y,Z';
  const headers = arr.split(',');
  for (let index = 0; index < headers.length; index += 1) {
    if (comm === headers[index]) {
      return index;
    }
  }
  return -1;
}

function mapIndexToLetter(index: number): string {
  const arr = 'ABCDEFGHIJKLMNOPQRRSTUVWXYZ';
  return arr[index];
}
function useInitState(
  size: number
): [Cell[][], React.Dispatch<React.SetStateAction<Cell[][]>>] {
  if (size > 25) {
    throw new Error('Size too big');
  }
  const data = [];
  for (let i = 0; i < size; i += 1) {
    const arr = [];
    for (let j = 0; j < size; j += 1) {
      arr.push({ value: null, formula: null, references: [] });
    }
    data.push(arr);
  }
  return useState<Cell[][]>(data);
}

function getReferenceFromIndices(indCol: number, indRow: number) {
  return `${mapIndexToLetter(indCol)}${indRow}`;
}

export {
  mapSizeToLetters,
  useInitState,
  mapLetterToIndex,
  mapIndexToLetter,
  getReferenceFromIndices,
  SIZE,
};
