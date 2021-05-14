import { derived, writable, get } from 'svelte/store';
import { generateRandomGame, buildGameConfig } from './utils';

const GAME_URL = 'https://api.npoint.io/9aa25654a04bb9f8393e';
const gameId = new URLSearchParams(window.location.search).get('id') || 'main';

let syncDate = Date.now();
const _data = writable({});

const rawData = derived(_data, ($data) => $data[gameId]);
const data = derived(rawData, ($rawData) =>
  $rawData ? buildGameConfig($rawData) : $rawData
);

function setData(newData) {
  syncDate = Date.now();

  _data.update((prev) => {
    fetch(GAME_URL, {
      method: 'POST',
      body: JSON.stringify({
        ...prev,
        [gameId]: newData,
      }),
    });

    return { ...prev, [gameId]: newData };
  });
}
function openWord(index) {
  const prev = get(rawData);
  setData({
    ...prev,
    openedIndex: [...prev.openedIndex, index].filter(
      (value, index, self) => self.indexOf(value) === index
    ),
  });
}

function getHandler() {
  syncDate = Date.now();
  fetch(GAME_URL)
    .then((j) => j.json())
    .then((json) => {
      _data.set(json);

      if (!json[gameId]) {
        setData(generateRandomGame());
      }
    });
}

getHandler();

export { setData, data, rawData, openWord, getHandler, syncDate };
