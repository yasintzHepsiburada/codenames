<script>
  import { setData, data, openWord } from './data';
  import Game from './Game.svelte';
  import settingsIconBase64 from './settings-icon';
  import { generateRandomGame } from './utils';

  let showSettings = false;

  function toggleSettings() {
    showSettings = !showSettings;
  }
  function generateNewGame() {
    setData(generateRandomGame());
    toggleSettings();
  }
  function handleWordClick({ index }) {
    openWord(index);
  }
</script>

{#if $data}
  <Game data={$data} isKeyScreen={true} onWordClick={handleWordClick} />
  <img
    on:click={toggleSettings}
    src={settingsIconBase64}
    alt="settings icon"
    class="settings"
  />

  <div class:hidden={!showSettings} class="settings">
    <div>
      <button on:click={generateNewGame}>Yeni Oyun Baslat</button>
      <button on:click={toggleSettings}>Kapat</button>
    </div>
  </div>
{:else}
  <h1>Oyunun Yuklenmesi bekleniyor</h1>
{/if}

<style>
  img.settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 8px;
    right: 8px;
    cursor: pointer;
  }
  div.settings {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  div.settings.hidden {
    display: none;
  }

  div.settings div {
    width: 80%;
    height: 80%;
    border-radius: 8px;
    background-color: white;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  div.settings div button {
    font-size: 2vw;
    min-width: 25%;
    margin-bottom: 8px;
  }
</style>
