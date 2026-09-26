(()=>{
const DYNAMIC_SKIP="#modal,.toast,.cms-app,[data-cms-ignore]";
let cache=null,applying=false,timer=null;
const pageKey=()=>{const p=location.pathname;if(p==="/"||p.endsWith("/index.html"))return"home";return (p.split("/").pop()||"home").replace(".html","")};
const nth=(el)=>{let n=1,s=el;while((s=s.previousElementSibling))if(s.tagName===el.tagName)n++;return n};
const pathOf=(el)=>{const parts=[];let x=el;while(x&&x.nodeType===1&&x!==document.body){parts.unshift(x.tagName.toLowerCase()+":nth-of-type("+nth(x)+")");x=x.parentElement}return "body>"+parts.join(">")};
const textIndex=(node)=>[...node.parentNode.childNodes].filter(n=>n.nodeType===3).indexOf(node);
const textKey=node=>pathOf(node.parentElement)+"::text("+textIndex(node)+")";
const imageKey=img=>pathOf(img);
const skipNode=node=>{const p=node.parentElement;if(!p||!node.nodeValue.trim())return true;if(["SCRIPT","STYLE","NOSCRIPT","OPTION"].includes(p.tagName))return true;if(p.closest(DYNAMIC_SKIP))return true;return false};
function textNodes(){const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(!skipNode(n))out.push(n);return out}
function images(){return [...document.querySelectorAll("img")].filter(img=>!img.closest(DYNAMIC_SKIP)&&!img.closest(".brand-logo,.cms-brand"))}
function applyGlobal(cms){
 const s=cms?.settings||{};
 document.querySelectorAll(".brand-logo img,.portal-brand img").forEach(img=>{if(s.logo&&img.src!==new URL(s.logo,location.href).href)img.src=s.logo});
 let icon=document.querySelector('link[rel="icon"]');if(icon&&s.logo)icon.href=s.logo;
 document.querySelectorAll(".footer-brand>p").forEach(x=>{if(s.tagline&&x.textContent!==s.tagline)x.textContent=s.tagline});
}
function applyStructured(cms){
 const p=cms?.pages?.[pageKey()]||{};
 const hero=document.querySelector(".page-hero");
 if(hero){
   if(p.heroImage)hero.style.backgroundImage='url("'+String(p.heroImage).replace(/"/g,"")+'")';
   const h=hero.querySelector("h1");if(h&&p.heroTitle&&h.textContent!==p.heroTitle)h.textContent=p.heroTitle;
   const t=hero.querySelector(".page-hero__content>p");if(t&&p.heroText&&t.textContent!==p.heroText)t.textContent=p.heroText;
 }
 if(pageKey()==="home"){
   const h=document.querySelector(".hero h1");if(h&&p.heroTitle&&h.textContent!==p.heroTitle)h.textContent=p.heroTitle;
   const t=document.querySelector(".hero-lead");if(t&&p.heroText&&t.textContent!==p.heroText)t.textContent=p.heroText;
   const img=document.querySelector(".hero-photo--main img");if(img&&p.heroImage&&img.getAttribute("src")!==p.heroImage)img.src=p.heroImage;
 }
 const split=document.querySelector(".feature-split,#about .section-copy")?.closest(".feature-split")||document.querySelector(".feature-split");
 if(split){
   const h=split.querySelector(".page-title");if(h&&p.introTitle&&h.textContent!==p.introTitle)h.textContent=p.introTitle;
   const t=split.querySelector(".section-lead");if(t&&p.introText&&t.textContent!==p.introText)t.textContent=p.introText;
   const img=split.querySelector("img");if(img&&p.introImage&&img.getAttribute("src")!==p.introImage)img.src=p.introImage;
 }
 if(pageKey()==="home"){
   const h=document.querySelector("#about .section-copy h2");if(h&&p.introTitle&&h.textContent!==p.introTitle)h.textContent=p.introTitle;
   const t=document.querySelector("#about .section-lead");if(t&&p.introText&&t.textContent!==p.introText)t.textContent=p.introText;
   const img=document.querySelector("#about .photo-frame--main img");if(img&&p.introImage&&img.getAttribute("src")!==p.introImage)img.src=p.introImage;
 }
}
function applyOverrides(cms){
 const o=cms?.overrides?.[pageKey()]||{},texts=o.texts||{},imgs=o.images||{};
 for(const n of textNodes()){
   const k=textKey(n);if(Object.prototype.hasOwnProperty.call(texts,k)){
     const raw=n.nodeValue,lead=(raw.match(/^\s*/)||[""])[0],trail=(raw.match(/\s*$/)||[""])[0],val=lead+String(texts[k])+trail;
     if(n.nodeValue!==val)n.nodeValue=val;
   }
 }
 for(const img of images()){
   const k=imageKey(img);if(imgs[k]&&img.getAttribute("src")!==imgs[k])img.src=imgs[k];
 }
}
const e=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function applyHiddenSections(cms){
 const p=cms?.pages?.[pageKey()]||{},hidden=new Set(p.hiddenSections||[]);
 document.querySelectorAll("main > section").forEach(sec=>{
   if(sec.id==="cmsCustomBlocks")return;
   const k=pathOf(sec);
   if(hidden.has(k)){sec.style.setProperty("display","none","important");sec.dataset.cmsHidden="1"}
   else if(sec.dataset.cmsHidden){sec.style.removeProperty("display");delete sec.dataset.cmsHidden}
 });
}
function renderCustomBlocks(cms){
 const p=cms?.pages?.[pageKey()]||{},blocks=Array.isArray(p.blocks)?p.blocks:[];
 let wrap=document.getElementById("cmsCustomBlocks");
 if(!wrap){wrap=document.createElement("section");wrap.id="cmsCustomBlocks";wrap.className="cms-custom-blocks";const main=document.querySelector("main");if(main)main.appendChild(wrap)}
 if(!wrap)return;
 const blockHtml=b=>{
   const theme=e(b.theme||"light"),ey=b.eyebrow?'<div class="eyebrow"><span></span>'+e(b.eyebrow)+'</div>':"",title=b.title?'<h2>'+e(b.title)+'</h2>':"",text=b.text?'<p class="cms-block-text">'+e(b.text).replace(/\n/g,"<br>")+'</p>':"",btn=b.buttonLabel?'<a class="btn '+(theme==="blue"?"btn--gold":"btn--navy")+'" href="'+e(b.buttonUrl||"#")+'">'+e(b.buttonLabel)+'</a>':"";
   if(b.type==="image")return '<section class="section cms-added-section cms-theme-'+theme+'"><div class="container"><div class="cms-image-block">'+(b.image?'<img src="'+e(b.image)+'" alt="'+e(b.title||"")+'">':"")+'<div>'+ey+title+text+btn+'</div></div></div></section>';
   if(b.type==="gallery"){const imgs=String(b.images||b.image||"").split(",").map(x=>x.trim()).filter(Boolean);return '<section class="section cms-added-section cms-theme-'+theme+'"><div class="container">'+ey+title+text+'<div class="cms-gallery">'+imgs.map(x=>'<img src="'+e(x)+'" alt="">').join("")+'</div>'+btn+'</div></section>'}
   if(b.type==="cta")return '<section class="section cms-added-section cms-theme-blue"><div class="container"><div class="cms-cta">'+ey+title+text+btn+'</div></div></section>';
   if(b.type==="textImage")return '<section class="section cms-added-section cms-theme-'+theme+'"><div class="container cms-text-image"><div>'+ey+title+text+btn+'</div>'+(b.image?'<img src="'+e(b.image)+'" alt="'+e(b.title||"")+'">':"")+'</div></section>';
   return '<section class="section cms-added-section cms-theme-'+theme+'"><div class="container cms-text-only">'+ey+title+text+btn+'</div></section>';
 };
 wrap.innerHTML=blocks.map(blockHtml).join("");
}
async function load(){if(cache)return cache;const r=await fetch("/api/bootstrap",{cache:"no-store"});cache=await r.json();return cache}
async function run(){if(applying)return;applying=true;try{const d=await load();applyGlobal(d.cms);applyStructured(d.cms);applyOverrides(d.cms);applyHiddenSections(d.cms);renderCustomBlocks(d.cms)}catch(e){console.error("CMS runtime",e)}finally{applying=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(run,120)}
document.addEventListener("DOMContentLoaded",()=>{run();const o=new MutationObserver(()=>{if(!applying)schedule()});o.observe(document.body,{childList:true,subtree:true})});
window.CNJ_CMS={pageKey,pathOf,textKey,imageKey,textNodes,images,refresh:async()=>{cache=null;await run()}};
})();