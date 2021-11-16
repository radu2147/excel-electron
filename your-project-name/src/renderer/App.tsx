/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/no-named-as-default-member */


import { useState } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import { renderSheet, parseCommand, getReferences } from './service/service';
import * as utils from './utils/utils';
import './App.css';
import { SIZE } from './utils/utils';

const Hello = () => {
  const headers = utils.mapSizeToLetters(SIZE);
  const [data, setData] = utils.useInitState(SIZE); // main state of the app
  const [command, setCommand] = useState<string>('');
  const [error, setError] = useState<string>(''); // used for errors
  const [highlights, setHighlights] = useState<Map<string, boolean>>(); // used for highlighting cells when referenced in a text pane
  const [selectedCell, setSelectedCell] = useState<{
    indRow: number;
    indCol: number;
  }>({ indRow: -1, indCol: -1 }); // reference to current seleccted cell

  const buttonAction = () => {
    try{
      setHighlights(new Map<string, boolean>()); // reset highlighted cells
      if (selectedCell.indRow !== -1) {
        const cell = parseCommand(command, data, selectedCell.indRow, selectedCell.indCol);
        data[selectedCell.indRow][selectedCell.indCol] = cell; // update cell with formula and value
        renderSheet(data, selectedCell.indRow, selectedCell.indCol); // update other cells
        setData(data);
        setError('');
      } else {
        setError('Must have selected a cell before');
        
      }
    }
    catch(e){
      if(e instanceof Error){
        setError(e.message);
      }
      else{
        console.log(e);
      }
    }
    finally{
      setSelectedCell({ indRow: -1, indCol: -1 });
      setCommand('');
    }
  }

  return (
    <>
      <h1>Hello world!</h1>
      <h4>
        This apps aims to be a smaller-scale copy of Excel or Google sheets.<br/> 
        The text pane below is used to manipulate cells value. You must select a cell before hitting the submit button. Selected cell would abe bordered with a black line<br/>
        The text pane accepts an expression with basic mathematical operators(*, /, +, -), and terms being either a cell reference, number, or function call <br/>
        There are two supported functions: sum and product. Arguments must be 2 cell references where the first cell would be the upper-left corner and the other would be bottom-right corner. The functions would compute the sum or product of all cells contained in the rectangle defined by the two cells.<br/>
        Cycle detection is present, so it is not possible to have a cycle of references
      </h4>
      <input value={command} onChange={(e) => {setCommand(e.target.value); setHighlights(getReferences(e.target.value)); }} />
      <button
        onClick={buttonAction}
      >
        Submit value
      </button>
      {error !== '' ? <h6>{error}</h6> : <></>}
      <div className="Spreadsheet">
        <table className="Spreadsheet__table">
          <colgroup>
            <col />
            <col />
          </colgroup>
          {/* Creating the main table from app state */}
          <tbody>
            <tr>
              <th className="header" />
              {headers.map((e) => (
                <th className="header">{e}</th>
              ))}
            </tr>
            {data.map((it, index) =>(
              <tr>
                <th key={index} className="header">{index}</th>
                {it.map((el, ind) => (
                  <td className="cell">
                    {index === selectedCell.indRow &&
                      ind === selectedCell.indCol ? 
                      <input
                        readOnly
                        type="text"
                        className="borderedInput"
                        value={el.value ?? ''}
                      />
                      :
                      <input
                        readOnly
                        type="text"
                        className={ highlights?.has(utils.getReferenceFromIndices(ind, index)) ? "highlightedInput" : ""}
                        onClick={(_) =>{
                          setSelectedCell({ indRow: index, indCol: ind });
                          setCommand(el.formula ?? '');
                        }
                        }
                        value={el.value ?? ''}
                      />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
