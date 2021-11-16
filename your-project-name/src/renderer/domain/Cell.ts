/* eslint-disable prettier/prettier */
interface Cell {
  value: string | null;
  formula: string | null;
  references: string[];
}
export default Cell;