import words from './words';

function shuffle(array) {
  const temp = Array.from(array);
  var currentIndex = temp.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = temp[currentIndex];
    temp[currentIndex] = temp[randomIndex];
    temp[randomIndex] = temporaryValue;
  }

  return temp;
}

const wordIndexes = words.map((w, i) => i);

function generateRandomGame() {
  const isRed = Math.random() > 0.5;
  const wordIndexesList = shuffle(
    shuffle(wordIndexes)
      .slice(0, 25)
      .map((index, position) => `${index},${position}`)
  );

  return {
    words: wordIndexesList,
    isRed,
    openedIndex: [],
  };
}

const WORD_TYPES = {
  RED: 'red',
  BLUE: 'blue',
  SNIPER: 'sniper',
  NEUTRAL: 'neutral',
};

function getWordTypeByPosition(position, isRed) {
  if (position === 0) {
    return WORD_TYPES.SNIPER;
  }

  if (position < 10) {
    return isRed ? WORD_TYPES.RED : WORD_TYPES.BLUE;
  }
  if (position < 18) {
    return !isRed ? WORD_TYPES.RED : WORD_TYPES.BLUE;
  }
  return WORD_TYPES.NEUTRAL;
}

function buildGameConfig({ isRed, words: wordList, openedIndex }) {
  const _words = wordList
    .map((i) => i.split(',').map((i) => parseInt(i, 10)))
    .map(([index, position]) => ({
      text: words[index],
      opened: openedIndex.indexOf(index) > -1,
      type: getWordTypeByPosition(position, isRed),
      index,
      position,
    }));

  const isGameOver = _words.find(
    (w) => w.type === WORD_TYPES.SNIPER && w.opened
  );

  return {
    isRed,
    isGameOver,
    words: _words,
  };
}

export { shuffle, generateRandomGame, buildGameConfig, WORD_TYPES };
