<script lang="ts">
  import qrcode from 'qrcode-generator';
  let { url }: { url: string } = $props();
  const image = $derived.by(() => { const qr = qrcode(0, 'M'); qr.addData(url); qr.make(); return qr.createDataURL(5, 20); });
</script>
<img src={image} alt="Scan this invitation to join the remote room" width="156" height="156" />
<style>img { display:block; width:156px; height:156px; image-rendering:pixelated; border:8px solid #fff; border-radius:6px; }</style>
