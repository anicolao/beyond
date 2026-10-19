<script lang="ts">
  let { id }: { id:string } = $props();
  const hash=$derived([...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0));
  const hue=$derived(hash%360);
  const prefix=$props.id();
</script>
<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <radialGradient id={`${prefix}-space`}><stop stop-color="#2e555a"/><stop offset="1" stop-color="#07191f"/></radialGradient>
    <radialGradient id={`${prefix}-planet`} cx="30%" cy="24%"><stop stop-color={`hsl(${hue} 35% 78%)`}/><stop offset=".45" stop-color={`hsl(${hue} 30% 40%)`}/><stop offset="1" stop-color="#06171d"/></radialGradient>
    <linearGradient id={`${prefix}-metal`}><stop stop-color="#f5e4ae"/><stop offset=".45" stop-color="#9b7438"/><stop offset=".7" stop-color="#e1c587"/><stop offset="1" stop-color="#534126"/></linearGradient>
    <clipPath id={`${prefix}-disc`}><circle cx="340" cy="156" r="105"/></clipPath>
  </defs>
  <path fill={`url(#${prefix}-space)`} d="M0 0h600v300H0z"/>
  {#each Array.from({length:44},(_,i)=>i) as i}<circle cx={(i*137+hash)%600} cy={(i*79+hash%127)%300} r={i%5===0?1.6:.65} fill="#f6e6bc" opacity={.25+(i%4)*.15}/>{/each}
    <ellipse cx="340" cy="156" rx="162" ry="47" fill="none" stroke="#c8ad73" opacity=".35" transform="rotate(-25 340 156)"/>
    <circle cx="340" cy="156" r="105" fill={`url(#${prefix}-planet)`} stroke="#c9b884" stroke-width="1"/>
    <g clip-path={`url(#${prefix}-disc)`} opacity=".32" fill={`hsl(${(hue+85)%360} 30% 73%)`}>
      {#each Array.from({length:7},(_,i)=>i) as i}<path d={`M205 ${90+i*24}q${65+hash%55} -40 130 0t140 0v9q-90 26-140 0t-130 0Z`}/>{/each}
    </g>
    <circle cx="128" cy="78" r="21" fill={`url(#${prefix}-planet)`}/>

  <path d="M20 20h40m-40 0v40m560-40h-40m40 0v40M20 280h40m-40 0v-40m560 40h-40m40 0v-40" fill="none" stroke="#b5985d" opacity=".5"/>
</svg>
<style>svg{width:100%;height:100%;display:block}</style>
