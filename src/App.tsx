import { useEffect, useRef, useState } from 'react'
import './style.css'

type Photo = { id: string; file: File; url: string; width: number; height: number }
type Preset = 'high' | 'balanced' | 'small'
const fmt = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
const supported = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|avif|heic|heif)$/i.test(f.name)

async function dimensions(file: File) {
  try { const bitmap = await createImageBitmap(file); const d = { width: bitmap.width, height: bitmap.height }; bitmap.close(); return d }
  catch { return await new Promise<{width:number;height:number}>((resolve,reject)=>{ const img = new Image(); const url = URL.createObjectURL(file); img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight});URL.revokeObjectURL(url)}; img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('This image could not be decoded. HEIC/HEIF support depends on your browser; try JPG or PNG.'))}; img.src=url }) }
}

function App() {
  const input = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const photosRef = useRef(photos); photosRef.current = photos
  const pdfUrlRef = useRef('')
  const [message, setMessage] = useState('')
  const [preset, setPreset] = useState<Preset>('balanced')
  const [pageSize, setPageSize] = useState('a4')
  const [margin, setMargin] = useState(24)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfBytes, setPdfBytes] = useState<Uint8Array>()
  const [moveId, setMoveId] = useState<string>()
  const [destination, setDestination] = useState('')
  const [preview, setPreview] = useState(false)
  const [done, setDone] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const totalBytes = photos.reduce((sum,p)=>sum+p.file.size,0)

  useEffect(() => { return () => { photosRef.current.forEach(p=>URL.revokeObjectURL(p.url)); if(pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current) } }, [])
  useEffect(() => { const onCancel = () => { setMessage(photos.length ? 'Selection cancelled. Your existing photos and page order are unchanged.' : 'No photos selected. Tap Select Images to try again.'); setCancelled(true) }; const el=input.current; el?.addEventListener('cancel',onCancel); return ()=>el?.removeEventListener('cancel',onCancel) }, [photos.length])

  const selectPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setMessage(''); setCancelled(false)
    const batch = Array.from(files), accepted = batch.filter(supported), rejected = batch.filter(f=>!supported(f))
    if(rejected.length) setMessage(`${rejected.length} file${rejected.length===1?' was':'s were'} skipped. Choose image files your browser can open.`)
    const fresh: Photo[]=[]
    for (const file of accepted) {
      try { const dim=await dimensions(file); fresh.push({id:crypto.randomUUID(),file,url:URL.createObjectURL(file),...dim}) }
      catch { setMessage(`${file.name} couldn't be opened. It may be corrupt or unsupported in this browser.`) }
    }
    if(fresh.length) { setPhotos(old=>[...old,...fresh]); setDone(false); setPdfBytes(undefined); if(pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrlRef.current=''; setPdfUrl('') }
    if(!fresh.length && !rejected.length) setMessage('No photos were added. Try selecting image files again.')
    if(!window.File || !URL.createObjectURL) setMessage('This browser does not support local photo selection. Update your browser to continue.')
    if(input.current) input.current.value=''
  }
  const movePhoto = () => { const from=photos.findIndex(p=>p.id===moveId), to=Number(destination)-1; if(from<0||!Number.isInteger(to)||to<0||to>=photos.length){setMessage(`Choose a page from 1 to ${photos.length}.`);return} const next=[...photos], [item]=next.splice(from,1); next.splice(to,0,item); setPhotos(next); setMoveId(undefined); setMessage('Page order updated.'); setPdfBytes(undefined); setPdfUrl('') }
  const shiftPage = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    setPhotos(next)
    setDone(false)
    setPdfBytes(undefined)
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    pdfUrlRef.current = ''
    setPdfUrl('')
  }  const removePhoto = (id:string) => {const p=photos.find(x=>x.id===id); if(p)URL.revokeObjectURL(p.url);setPhotos(xs=>xs.filter(x=>x.id!==id));setPdfBytes(undefined);setPdfUrl('')}
  const generate = async () => {
    if(!photos.length)return
    setBusy(true);setProgress(0);setMessage('')
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdf=await PDFDocument.create(); pdf.setTitle('SnapPDF document'); pdf.setCreator('SnapPDF — processed locally')
      const quality=preset==='high'?0.92:preset==='small'?0.64:0.82, maxPx=preset==='high'?3200:preset==='small'?1500:2200
      for(let i=0;i<photos.length;i++){
        const photo=photos[i], bitmap=await createImageBitmap(photo.file)
        const scale=Math.min(1,maxPx/Math.max(bitmap.width,bitmap.height)), canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Could not prepare this photo on your device.')
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close()
        const png=photo.file.type==='image/png';let bytes:Uint8Array
        if(png){bytes=new Uint8Array(await new Promise<ArrayBuffer>((resolve,reject)=>canvas.toBlob(b=>b?b.arrayBuffer().then(resolve):reject(Error('Image encoding failed')),'image/png')))}else{bytes=new Uint8Array(await new Promise<ArrayBuffer>((resolve,reject)=>canvas.toBlob(b=>b?b.arrayBuffer().then(resolve):reject(Error('Image encoding failed')),'image/jpeg',quality)))}
        const embedded=png?await pdf.embedPng(bytes):await pdf.embedJpg(bytes)
        let size:[number,number]
        if(pageSize==='original') { const scalePt=72/96; size=[canvas.width*scalePt,canvas.height*scalePt] }
        else size=pageSize==='letter'?[612,792]:[595.28,841.89]
        if(pageSize!=='original' && ((size[0]>size[1]) !== (canvas.width>canvas.height))) size=[size[1],size[0]]
        const page=pdf.addPage(size), pad=margin, factor=Math.min((size[0]-pad*2)/embedded.width,(size[1]-pad*2)/embedded.height), w=embedded.width*factor,h=embedded.height*factor
        page.drawImage(embedded,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h}); setProgress(Math.round((i+1)/photos.length*100)); await new Promise(r=>setTimeout(r,0))
      }
      const bytes=await pdf.save({useObjectStreams:true}), blob=new Blob([bytes as BlobPart],{type:'application/pdf'}), url=URL.createObjectURL(blob)
      if(pdfUrl)URL.revokeObjectURL(pdfUrl);setPdfUrl(url);pdfUrlRef.current=url;setPdfBytes(bytes);setDone(true);setPreview(true)
    } catch(e) { setMessage(`PDF creation failed: ${e instanceof Error?e.message:'Your device may be low on memory. Try fewer or smaller photos.'}`) }
    finally{setBusy(false)}
  }
  const download = () => { if(!pdfUrl)return;const a=document.createElement('a');a.href=pdfUrl;a.download='snappdf-document.pdf';a.click() }
  const startOver=()=>{photos.forEach(p=>URL.revokeObjectURL(p.url));if(pdfUrl)URL.revokeObjectURL(pdfUrl);setPhotos([]);setDone(false);setPreview(false);setPdfUrl('');pdfUrlRef.current='';setPdfBytes(undefined);setMessage('')}

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">S</span><span>Snap<span className="brand-accent">PDF</span></span></a><span className="private-pill"><i/> Processed on your device</span></header>
    <section className="hero"><div className="eyebrow"><span>✦</span> YOUR PHOTOS, BEAUTIFULLY BOUND</div><h1>Every photo.<br/><em>One polished PDF.</em></h1><p>Arrange your images, choose your finish, and make a PDF that’s ready to share. Your files stay on this device.</p></section>
    {!photos.length ? <section className="empty-card"><div className="upload-art"><div className="photo-stack"><span>▧</span><span>▧</span><span>▧</span></div><b>＋</b></div><h2>Start with your photos</h2><p>Select several images in one go, then arrange them into the perfect order.</p><button className="primary select-main" onClick={()=>input.current?.click()}><span>＋</span> Select Images</button><div className="supported"><span>JPG</span><span>PNG</span><span>WEBP</span><span>GIF</span><span>More formats may work if your browser can decode them</span></div><div className="picker-note"><span>▦</span> Android Chrome chooses the photo screen. If it opens Files, the browser controls that choice; SnapPDF cannot force Gallery. If access is denied, check Android browser permissions.</div></section> : <>
      <section className="workspace-head"><div><div className="eyebrow">YOUR DOCUMENT</div><h2>Arrange your pages<span className="count-badge">{photos.length}</span></h2><p>{photos.length} photos <span>·</span> {fmt(totalBytes)} original size</p></div><button className="secondary add-btn" onClick={()=>input.current?.click()}><span>＋</span> Add More Photos</button></section>
      <section className="editor-grid"><div className="pages-panel"><div className="panel-heading"><div><h3>Page order</h3><p>Move pages into exactly the right spot.</p></div><span className="tiny-label">{photos.length} PAGES</span></div><div className="photo-grid">{photos.map((photo,i)=><article className="photo-card" key={photo.id}><div className="photo-img"><img src={photo.url} alt={`Page ${i+1}: ${photo.file.name}`} loading="lazy"/><span className="page-number">{String(i+1).padStart(2,'0')}</span><button className="remove" aria-label={`Remove ${photo.file.name}`} onClick={()=>removePhoto(photo.id)}>×</button></div><div className="photo-info"><strong title={photo.file.name}>{photo.file.name}</strong><span>{photo.width} × {photo.height} <i>·</i> {fmt(photo.file.size)}</span></div><div className="page-actions"><button className="step-arrow" aria-label={`Move page ${i+1} to previous page`} title="Move to previous page" disabled={i===0} onClick={()=>shiftPage(i,-1)}>↑</button><button className="move-link" onClick={()=>{setMoveId(photo.id);setDestination(String(i+1))}}>↕ Move to page</button><button className="step-arrow" aria-label={`Move page ${i+1} to next page`} title="Move to next page" disabled={i===photos.length-1} onClick={()=>shiftPage(i,1)}>↓</button></div></article>)}</div></div>
      <aside className="settings-panel"><div className="panel-heading"><div><h3>PDF finish</h3><p>Pick your document settings.</p></div><span className="sparkle">✦</span></div><label className="field-label">COMPRESSION</label><div className="presets">{([['high','High quality','Crisp detail'],['balanced','Balanced','Recommended'],['small','Small file','Smaller size']] as const).map(([id,title,sub])=><button key={id} className={`preset ${preset===id?'chosen':''}`} onClick={()=>setPreset(id)}><span className="radio"/><span><b>{title}</b><small>{sub}</small></span>{id==='balanced'&&<i>BEST</i>}</button>)}</div><label className="field-label settings-label" htmlFor="size">PAGE SIZE</label><select id="size" className="select" value={pageSize} onChange={e=>setPageSize(e.target.value)}><option value="a4">A4</option><option value="letter">US Letter</option><option value="original">Match each photo</option></select><label className="field-label settings-label" htmlFor="margin">PAGE MARGIN <span>{margin} pt</span></label><input id="margin" className="range" type="range" min="0" max="72" value={margin} onChange={e=>setMargin(Number(e.target.value))}/><div className="range-label"><span>Edge to edge</span><span>Roomy</span></div>
        <div className="privacy-card"><span>♧</span><div><b>Private by design</b><small>Photos are processed locally in this browser.</small></div></div><button className="primary generate" disabled={busy||!photos.length} onClick={generate}>{busy?<><span className="spinner"/> Preparing PDF · {progress}%</>:<>Create PDF <span>→</span></>}</button>{busy&&<div className="progress-track"><i style={{width:`${progress}%`}}/></div>}{pdfBytes&&<div className="file-result"><div><b>Your PDF is ready</b><small>{photos.length} pages <i>·</i> {fmt(pdfBytes.byteLength)}</small></div><button className="download-mini" onClick={download}>↓</button></div>}{pdfBytes&&<button className="preview-link" onClick={()=>setPreview(true)}>▤ Preview PDF</button>}</aside></section>
      </>}
    {message&&<div className={`notice ${cancelled?'subtle':''}`} role="status"><span>{cancelled?'↩':'!'}</span>{message}<button aria-label="Dismiss" onClick={()=>setMessage('')}>×</button></div>}
    {!photos.length&&<div className="trust-row"><span>◈ No uploads</span><span>⌁ No account needed</span><span>◎ Files stay yours</span></div>}
    <footer>Made for the moments worth keeping <span>✦</span></footer>
    <input ref={input} className="hidden-input" type="file" accept="image/*" multiple onChange={e=>void selectPhotos(e.target.files)} aria-label="Select multiple photos" />
    {moveId&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setMoveId(undefined)}}><div className="dialog"><button className="dialog-close" onClick={()=>setMoveId(undefined)}>×</button><div className="dialog-icon">↕</div><h3>Move this page</h3><p>Choose a new position from 1 to {photos.length}. The other pages will shift to make room.</p><label htmlFor="destination">New page number</label><input id="destination" type="number" min="1" max={photos.length} value={destination} onChange={e=>setDestination(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')movePhoto()}}/><div className="dialog-actions"><button className="secondary" onClick={()=>setMoveId(undefined)}>Cancel</button><button className="primary" onClick={movePhoto}>Move page</button></div></div></div>}
    {preview&&pdfUrl&&<div className="preview-overlay"><div className="preview-top"><div><span className="brand-mark">S</span><b>PDF Preview</b><small>{photos.length} pages · {fmt(pdfBytes?.byteLength||0)}</small></div><div><button className="secondary" onClick={download}>↓ Download</button><button className="preview-close" onClick={()=>setPreview(false)} aria-label="Return to editor">×</button></div></div><iframe title="Generated PDF preview" src={pdfUrl}/></div>}
    {done&&<div className="toast" role="status">✓ Your {photos.length}-page PDF is ready <button onClick={()=>setDone(false)}>×</button><button className="toast-download" onClick={download}>Download PDF →</button><button className="toast-download" onClick={startOver}>Start over</button></div>}
  </main>
}
export default App





