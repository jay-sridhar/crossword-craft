import React from 'react';
import CrosswordPuzzle from './components/CrosswordPuzzle';
import puzzleData from './data/crosswordPuzzle.json';


function App() {
  return (
    <div className="App">
      <div className="flex justify-center">
        <h1 className="text-center text-2xl py-4">Crossword Puzzle</h1>
      </div>
      <CrosswordPuzzle puzzle={puzzleData} />
    </div>
  );
}
export default App;
