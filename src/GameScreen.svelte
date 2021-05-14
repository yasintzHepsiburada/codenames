<script>
  import { onMount } from 'svelte';

  import { data, getHandler, syncDate } from './data';
  import Game from './Game.svelte';

  onMount(() => {
    function interval() {
      requestAnimationFrame(interval);
      if (Date.now() - syncDate >= 1800) {
        getHandler();
      }
    }

    interval();
  });
</script>

{#if $data}
  <Game data={$data} isKeyScreen={false} />
{:else}
  <h1>Oyunun Yuklenmesi bekleniyor</h1>
{/if}
