<script>
  export let shown = false;
</script>

<div class="fillAll absolute flex z-50 bg-zinc-900 text-2xl underline text-zinc-200 {shown ? '' : 'hidden'}">
  <div class="flex m-auto">
    <slot/>
  </div>
</div>

<style>
  .fillAll {
    top: 0px; 
    left: 0px;
    height: 100vh;
    width: 100vw;
  } 
</style>