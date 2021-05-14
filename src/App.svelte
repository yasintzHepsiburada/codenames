<script>
  import GameScreen from './GameScreen.svelte';
  import KeyScreen from './KeyScreen.svelte';

  let page = 'app';

  function gameScreen() {
    page = 'game';
  }

  function keyScreen() {
    page = 'key';
  }
</script>

{#if page === 'app'}
  <div class="container">
    <div on:click={gameScreen}>Oyun Ekrani</div>
    <div on:click={keyScreen}>Anahtar Ekrani</div>
  </div>
{:else if page === 'game'}
  <GameScreen />
{:else if page === 'key'}
  <KeyScreen />
{/if}

<style>
  .container {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .container div {
    width: 26%;
    cursor: pointer;
    user-select: none;
    height: 25%;
    border: 2px solid #fcdab7;
    border-radius: 8px;
    font-size: 4vw;
    color: #fcdab7;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container div:first-child {
    margin-bottom: 24px;
  }
</style>
