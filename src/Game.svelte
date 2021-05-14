<script>
  import { WORD_TYPES } from './utils';

  export let data;
  export let isKeyScreen;
  export let onWordClick = () => 0;
</script>

<div class="game" class:border={isKeyScreen} class:red={data.isRed}>
  {#each data.words as word}
    <div
      class="word {word.type}"
      class:opened={word.opened}
      class:hidden={word.type !== WORD_TYPES.SNIPER && data.isGameOver}
      class:detail={isKeyScreen}
      on:click={() => onWordClick(word)}
    >
      {word.text}
    </div>
  {/each}
</div>

<style>
  .game {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
  .game.border {
    border: 5px solid rgb(41, 120, 181);
    border-radius: 8px;
  }
  .game.border.red {
    border-color: rgba(232, 69, 69);
  }

  .word {
    user-select: none;
    width: calc(20% - 16px);
    height: calc(20% - 16px);
    margin: 8px;
    border: 2px solid #fcdab7;
    color: #fcdab7;
    border-radius: 4px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 2.6vw;
    cursor: pointer;
  }

  /* DETAIL */
  .sniper.detail {
    background-color: rgba(29, 26, 26, 0.25);
    border-color: rgba(29, 26, 26, 1);
  }

  .red.detail {
    background-color: rgba(232, 69, 69, 0.25);
  }
  .blue.detail {
    background-color: rgba(41, 120, 181, 0.25);
  }

  .red.opened {
    background-color: rgb(232, 69, 69);
  }
  .blue.opened {
    background-color: rgb(41, 120, 181);
  }

  .neutral.opened {
    background-color: #fcd9b78a;
  }

  .sniper.opened {
    background-color: black;
  }
  .word.hidden {
    opacity: 0.3;
  }
</style>
