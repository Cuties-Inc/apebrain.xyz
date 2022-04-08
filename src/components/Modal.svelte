<script>
  export let icon; // url/path to icon image
  export let title;
  export let shown = false; // whether or not to show (boolean)
  export let xp0 = false; // 0 x padding
  function hide() {
    shown = false
  }
</script>

  <div class="fillRemaining absolute w-screen z-30 {shown ? '' : 'hidden'} text-zinc-200">

   <!-- foreground card container -->
   <div class="fillRemaining flex">
    <!-- foreground card -->
    <div class="z-50 relative {xp0 ? "px-0" : "px-4"} py-4 bg-zinc-900 opacity-100 flex flex-col p-20 shadow-xl rounded-md mx-auto self-center justify-self-center w-fit select-none">
     <!-- title bar -->
     <div class="flex flex-row items-center mb-2 {xp0 ? "px-4" : ""}">
      {#if icon}
      <div class="flex">{icon}</div>
      {/if}
      {#if title}
      <div class="flex grow text-xl font-bold">{title}</div>
      {/if}
      <!-- <div class="cursor-pointer w-6 ml-4" on:click={hide}>
       <img class="stroke-zinc-200" src="/icons/x.svg" alt="close">
      </div> -->
     </div>

     <!-- content -->
     <div>
      <slot></slot>
     </div>
    </div>
   </div>
  
   <!-- background -->
   <!-- REMOVED on:click={hide} -->
   <div class="z-40 absolute top-0 left-0 fillAll w-screen bg-black opacity-40" ></div>
  
  </div>

<style>
  .fillRemaining {
    height: 100vh;
    width: 100vw;
  }

  .fillAll {
    top: 0px; 
    left: 0px;
    height: 100vh;
    width: 100vw;
  }
</style>