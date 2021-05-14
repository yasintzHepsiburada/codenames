<script>
  import { data } from './data';
  import Game from './Game.svelte';
</script>

{#if $data}
  <Game data={$data} isKeyScreen={false} />
{:else}
  <h1>Oyunun Yuklenmesi bekleniyor</h1>
{/if}
