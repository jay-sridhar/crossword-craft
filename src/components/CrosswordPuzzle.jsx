import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardContent, Button, Alert, AlertDescription } from './Components';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';


const CrosswordPuzzle = ({ puzzle }) => {
  const [grid, setGrid] = useState([]);
  const [currentClue, setCurrentClue] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState('across');
  const [validationResult, setValidationResult] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(true);
  const [showResultsAlert, setShowResultsAlert] = useState(true);
  const [modifiedClues, setModifiedClues] = useState(new Set());
  const [emptyCells, setEmptyCells] = useState([]);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (puzzle) {
      const { rows, columns } = puzzle;
      setGrid(Array(rows).fill().map(() => Array(columns).fill('')));
      inputRefs.current = Array(rows).fill().map(() => Array(columns));
    }
  }, [puzzle]);


  const handleInputChange = (row, col, value) => {
    if (value.length <= 1) {
      const newGrid = [...grid];
      newGrid[row][col] = value.toUpperCase();
      setGrid(newGrid);

      // Mark affected clues as modified
      const acrossClue = getClueForCell(row, col, 'across');
      const downClue = getClueForCell(row, col, 'down');
      const newModifiedClues = new Set(modifiedClues);
      if (acrossClue) newModifiedClues.add(acrossClue.split('-')[1]);
      if (downClue) newModifiedClues.add(downClue.split('-')[1]);
      setModifiedClues(newModifiedClues);

      if (value.length === 1) {
        moveToNextCell(row, col);
      }
    }
  };

  const moveToNextCell = (row, col) => {
    const nextCell = getNextCell(row, col, selectedDirection);
    if (nextCell) {
      setSelectedCell(nextCell);
      focusCell(nextCell.row, nextCell.col);
    }
  };

  const getNextCell = (row, col, direction) => {
    const delta = direction === 'across' ? { row: 0, col: 1 } : { row: 1, col: 0 };
    let nextRow = row + delta.row;
    let nextCol = col + delta.col;

    while (nextRow < puzzle.rows && nextCol < puzzle.columns) {
      if (!isCellEmpty(nextRow, nextCol)) {
        return { row: nextRow, col: nextCol };
      }
      nextRow += delta.row;
      nextCol += delta.col;
    }

    return null;
  };

  const focusCell = (row, col) => {
    if (inputRefs.current[row] && inputRefs.current[row][col]) {
      inputRefs.current[row][col].focus();
    }
  };

  const getClueNumber = (row, col) => {
    for (const direction of ['across', 'down']) {
      for (const [number, clue] of Object.entries(puzzle.clues[direction])) {
        if (clue.startPosition[0] === row && clue.startPosition[1] === col) {
          return number;
        }
      }
    }
    return null;
  };

  const isWordEnd = (row, col) => {
    for (const direction of ['across', 'down']) {
      for (const clue of Object.values(puzzle.clues[direction])) {
        const [startRow, startCol] = clue.startPosition;
        const endRow = direction === 'down' ? startRow + clue.length - 1 : startRow;
        const endCol = direction === 'across' ? startCol + clue.length - 1 : startCol;
        if (row === endRow && col === endCol) {
          return true;
        }
      }
    }
    return false;
  };

  const isCellEmpty = (row, col) => {
    for (const direction of ['across', 'down']) {
      for (const clue of Object.values(puzzle.clues[direction])) {
        const [startRow, startCol] = clue.startPosition;
        const endRow = direction === 'down' ? startRow + clue.length - 1 : startRow;
        const endCol = direction === 'across' ? startCol + clue.length - 1 : startCol;
        if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (row, col) => {
    if (isCellEmpty(row, col)) return;

    setSelectedCell({ row, col });
    const acrossClue = getClueForCell(row, col, 'across');
    const downClue = getClueForCell(row, col, 'down');

    if (acrossClue && downClue) {
      if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
        setSelectedDirection(prev => prev === 'across' ? 'down' : 'across');
      } else {
        setSelectedDirection('across');
      }
    } else if (acrossClue) {
      setSelectedDirection('across');
    } else if (downClue) {
      setSelectedDirection('down');
    }

    focusCell(row, col);
  };

  const getClueForCell = (row, col, direction) => {
    for (const [number, clue] of Object.entries(puzzle.clues[direction])) {
      const [startRow, startCol] = clue.startPosition;
      const endRow = direction === 'down' ? startRow + clue.length - 1 : startRow;
      const endCol = direction === 'across' ? startCol + clue.length - 1 : startCol;

      if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
        return `${direction}-${number}`;
      }
    }
    return null;
  };

  const handleKeyDown = (e, row, col) => {
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case 'ArrowUp':
        nextRow = row - 1;
        break;
      case 'ArrowDown':
        nextRow = row + 1;
        break;
      case 'ArrowLeft':
        nextCol = col - 1;
        break;
      case 'ArrowRight':
        nextCol = col + 1;
        break;
      default:
        return;
    }

    if (nextRow >= 0 && nextRow < puzzle.rows && nextCol >= 0 && nextCol < puzzle.columns) {
      if (!isCellEmpty(nextRow, nextCol)) {
        e.preventDefault();
        handleCellClick(nextRow, nextCol);
      }
    }
  };

  useEffect(() => {
    if (selectedCell) {
      const clue = getClueForCell(selectedCell.row, selectedCell.col, selectedDirection);
      setCurrentClue(clue);
    }
  }, [selectedCell, selectedDirection]);

  const checkForEmptyCells = () => {
    const emptyClues = new Set();
    let hasEmptyCells = false;

    for (const direction of ['across', 'down']) {
      for (const [number, clue] of Object.entries(puzzle.clues[direction])) {
        const [startRow, startCol] = clue.startPosition;
        for (let i = 0; i < clue.length; i++) {
          const row = direction === 'across' ? startRow : startRow + i;
          const col = direction === 'across' ? startCol + i : startCol;
          if (grid[row][col] === '') {
            emptyClues.add(number);
            hasEmptyCells = true;
          }
        }
      }
    }

    setEmptyCells(Array.from(emptyClues));
    return hasEmptyCells;
  };

  const prepareValidationData = () => {
    const validationData = [];

    for (const direction of ['across', 'down']) {
      for (const [number, clue] of Object.entries(puzzle.clues[direction])) {
        const [startRow, startCol] = clue.startPosition;
        let answer = '';
        for (let i = 0; i < clue.length; i++) {
          if (direction === 'across') {
            answer += grid[startRow][startCol + i];
          } else {
            answer += grid[startRow + i][startCol];
          }
        }
        validationData.push({ clueId: number, answer });
      }
    }

    return validationData;
  };

  const validatePuzzle = () => {
    if (checkForEmptyCells()) {
      setError("Please complete all the clues before submitting.");
      return;
    }
  
    const validationData = prepareValidationData();
    const validationResult = { status: "pass", failedClues: [] };
  
    // Correct answers can be fetched from backend API too.
    const correctAnswers = {
      "2": "SHEEP",
      "3": "DUCK",
      "5": "KANGAROO",
      "7": "CAT",
      "8": "BAT",
      "1": "ELEPHANT",
      "4": "GOAT",
      "6": "RABBIT"
    };
  
    validationData.forEach((clue) => {
      if (clue.answer.toUpperCase() !== correctAnswers[clue.clueId]) {
        validationResult.status = "fail";
        validationResult.failedClues.push(clue.clueId);
      }
    });
  
    setValidationResult(validationResult);
    setError(null);
    setModifiedClues(new Set());
  
    if (validationResult.status === "pass") {
      setShowSuccessAlert(true);
    } else {
      setShowResultsAlert(true);
    }
  
    console.log("Validation Result:", validationResult);
  };

  const renderClueStatus = (direction, number) => {
    if (modifiedClues.has(number)) {
      return null; // Don't show any status for modified clues
    }

    if (emptyCells.includes(number)) {
      return <AlertCircle className="inline-block ml-2 text-yellow-500" size={16} />;
    }

    if (!validationResult) return null;

    if (validationResult.status === "pass") {
      return <CheckCircle className="inline-block ml-2 text-green-500" size={16} />;
    }

    if (validationResult.failedClues.includes(number)) {
      return <XCircle className="inline-block ml-2 text-red-500" size={16} />;
    }

    return <CheckCircle className="inline-block ml-2 text-green-500" size={16} />;
  };


  return (
    <div className="flex flex-col items-center">
      <div 
        className="grid gap-0.5 mb-4" 
        style={{ 
          gridTemplateColumns: `repeat(${puzzle.columns}, minmax(0, 1fr))`,
          width: `${puzzle.columns * 2}rem`
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const clueNumber = getClueNumber(rowIndex, colIndex);
            const wordEnd = isWordEnd(rowIndex, colIndex);
            const isEmpty = isCellEmpty(rowIndex, colIndex);
            return (
              <div 
                key={`${rowIndex}-${colIndex}`} 
                className={`relative w-8 h-8 ${isEmpty ? 'bg-gray-800' : 'bg-white'} border border-gray-300 flex items-center justify-center`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {!isEmpty && (
                  <input
                    ref={el => inputRefs.current[rowIndex][colIndex] = el}
                    className="w-full h-full text-center p-0 outline-none bg-transparent"
                    value={cell}
                    onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    maxLength={1}
                  />
                )}
                {clueNumber && (
                  <span className="absolute top-0 left-0 text-xs font-bold">{clueNumber}</span>
                )}
                {wordEnd && (
                  <span className="absolute bottom-0 right-0 w-1 h-1 bg-black rounded-full"></span>
                )}
              </div>
            );
          })
        ))}
      </div>
      <div className="flex justify-center mb-4">       
      <Button onClick={validatePuzzle} className="p-3 bg-green-600 hover:bg-green-700 text-white">Submit</Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setError(false)}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showSuccessAlert && validationResult && validationResult.status === "pass" && (
        <Alert className="mb-4 bg-green-100 border-green-400 text-green-700" onDismiss={() => setShowSuccessAlert(false)}>
          <AlertDescription>Congratulations! You've solved the puzzle correctly!</AlertDescription>
        </Alert>
      )}
      
      {showResultsAlert && validationResult && validationResult.status === "fail" && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setShowResultsAlert(false)}>
          <AlertDescription>Some clues are incorrect. Please check the marked clues and try again.</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-5 gap-4 w-full max-w-4xl">
        <Card className="bg-white shadow-md col-span-3">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 text-base capitalize">Across</h3>
            {Object.entries(puzzle.clues.across).map(([number, clue]) => (
              <p 
                key={`across-${number}`} 
                className={`mb-2 p-1 text-sm rounded ${
                  currentClue === `across-${number}` ? 'bg-yellow-200' : ''
                } ${emptyCells.includes(number) ? 'bg-yellow-100' : ''}`}
              >
                <span className="font-bold">{number}.</span> {clue.clue} ({clue.length})
                {renderClueStatus('across', number)}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md col-span-2">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 text-base capitalize">Down</h3>
            {Object.entries(puzzle.clues.down).map(([number, clue]) => (
              <p 
                key={`down-${number}`} 
                className={`mb-2 p-1 text-sm rounded ${
                  currentClue === `down-${number}` ? 'bg-yellow-200' : ''
                } ${emptyCells.includes(number) ? 'bg-yellow-100' : ''}`}
              >
                <span className="font-bold">{number}.</span> {clue.clue} ({clue.length})
                {renderClueStatus('down', number)}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default CrosswordPuzzle;
