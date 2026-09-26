import http from "node:http";
import crypto from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { extname, join, normalize, basename } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8080);
const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const DATA_DIR = fileURLToPath(new URL("./data/", import.meta.url));
const CMS_FILE = join(DATA_DIR, "cms.json");
const UPLOAD_DIR = join(ROOT, "uploads");
const startedAt = new Date().toISOString();
const uid = (p="id") => p+"_"+Date.now().toString(36)+"_"+crypto.randomBytes(4).toString("hex");

await mkdir(DATA_DIR,{recursive:true});
await mkdir(UPLOAD_DIR,{recursive:true});

const provinces=["Bas-Uele","Équateur","Haut-Katanga","Haut-Lomami","Haut-Uele","Ituri","Kasaï","Kasaï-Central","Kasaï-Oriental","Kinshasa","Kongo-Central","Kwango","Kwilu","Lomami","Lualaba","Mai-Ndombe","Maniema","Mongala","Nord-Kivu","Nord-Ubangi","Sankuru","Sud-Kivu","Sud-Ubangi","Tanganyika","Tshopo","Tshuapa"];

const defaultCms={
  settings:{
    siteName:"Conseil National de la Jeunesse",
    shortName:"CNJ-RDC",
    logo:"/assets/cnj-logo-current.svg",
    tagline:"Informer. Connecter. Représenter. Mobiliser. Agir.",
    contactAddress:"5058, Boulevard Sendwe, Q/Immo-Congo, C/Kalamu, Kinshasa, RDC",
    contactEmail:"bureau@cnj-rdc.demo",
    contactPhone:"+243 891 125 769",
    facebook:"#",instagram:"#",x:"#",youtube:"#",linkedin:"#"
  },
  pages:{
    home:{heroTitle:"La jeunesse congolaise au cœur de la transformation nationale.",heroText:"Le portail national pour informer, connecter, représenter, mobiliser et accompagner les jeunes, les organisations et les conseils de jeunesse sur l’ensemble du territoire.",heroImage:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=88",introTitle:"Une interface nationale entre les jeunes, leurs organisations et les pouvoirs publics.",introText:"Le CNJ porte la voix des jeunes et renforce leur participation au développement national.",introImage:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85"},
    about:{heroTitle:"À propos du CNJ-RDC",heroText:"Une institution faîtière de représentation, de coordination, d’accompagnement et d’encadrement de la jeunesse congolaise.",heroImage:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=88",introTitle:"Une interface nationale entre les jeunes, leurs organisations et les pouvoirs publics.",introText:"Le CNJ constitue un cadre national de représentation et de coordination de la jeunesse congolaise.",introImage:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85"},
    programs:{heroTitle:"Des programmes pour une jeunesse actrice du changement.",heroText:"Des axes thématiques reliés à des projets, activités, partenariats, documents et opportunités concrètes.",heroImage:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=88",introTitle:"Une architecture thématique claire et directement exploitable.",introText:"Chaque programme relie objectifs, activités, résultats, partenaires, ressources et opportunités.",introImage:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"},
    opportunities:{heroTitle:"Des opportunités concrètes pour avancer.",heroText:"Emplois, stages, bourses, formations, volontariat, concours et appels à projets réunis dans un catalogue unique.",heroImage:"https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=88",introTitle:"Votre prochaine opportunité commence ici.",introText:"Recherche, filtres, favoris et suivi de candidature.",introImage:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"},
    network:{heroTitle:"26 provinces. Une jeunesse connectée.",heroText:"Explorez les conseils provinciaux, les organisations de jeunesse, les activités locales et les opportunités territoriales.",heroImage:"https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1600&q=88",introTitle:"Un réseau national proche des jeunes.",introText:"Chaque province peut disposer d’un espace éditorial et opérationnel dédié.",introImage:"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85"},
    news:{heroTitle:"Suivre ce qui fait bouger la jeunesse.",heroText:"Actualités institutionnelles, programmes, partenariats, activités provinciales, communiqués et événements.",heroImage:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=88",introTitle:"Actualités du CNJ et de son réseau.",introText:"Un espace éditorial riche en images, documents et comptes rendus.",introImage:"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85"},
    resources:{heroTitle:"Une bibliothèque pour comprendre et agir.",heroText:"Documents institutionnels, guides, politiques, rapports, publications, kits pratiques et références pour la jeunesse.",heroImage:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=88",introTitle:"Les ressources essentielles au même endroit.",introText:"Une bibliothèque classée, recherchable et maintenable depuis le back-office.",introImage:"https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85"},
    contact:{heroTitle:"Parler au CNJ, simplement.",heroText:"Questions, demandes d’orientation, propositions de partenariat, organisations de jeunesse et initiatives.",heroImage:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=88",introTitle:"Comment pouvons-nous vous orienter ?",introText:"Un point d’entrée clair pour les jeunes, organisations et partenaires.",introImage:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85"},
    youth:{heroTitle:"Espace Jeunes",heroText:"Favoris, candidatures, recommandations et suivi personnel.",heroImage:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=88",introTitle:"Mon tableau de bord",introText:"Un espace personnel pour suivre ses opportunités et démarches.",introImage:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"}
  },
  media:[],
  overrides:{}
};

const state={
  programs:[
    {id:"p1",title:"Éducation & compétences",kicker:"Apprendre et progresser",text:"Formation, compétences numériques, orientation et développement du capital humain.",image:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"},
    {id:"p2",title:"Emploi & entrepreneuriat",kicker:"Insertion et autonomie",text:"Orientation, opportunités, incubation, employabilité et mise en relation.",image:"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"},
    {id:"p3",title:"Citoyenneté & paix",kicker:"Participer et construire",text:"Dialogue, culture de paix, engagement communautaire et leadership.",image:"https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1200&q=80"},
    {id:"p4",title:"Innovation & numérique",kicker:"Créer les solutions de demain",text:"Créativité, innovation, entrepreneuriat numérique et technologies.",image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"}
  ],
  opportunities:[
    {id:"o1",type:"Formation",title:"Compétences numériques pour l'emploi",org:"Programme partenaire",province:"Kinshasa",deadline:"09 oct. 2026",tag:"Gratuit",desc:"Parcours pratique autour des outils numériques, de la recherche d'emploi et de la présence professionnelle en ligne."},
    {id:"o2",type:"Stage",title:"Stage en communication digitale",org:"Organisation partenaire",province:"Kongo-Central",deadline:"15 oct. 2026",tag:"3 mois",desc:"Expérience pratique en communication, création de contenus, événementiel et suivi des campagnes."},
    {id:"o3",type:"Emploi",title:"Assistant(e) projet jeunesse",org:"Organisation partenaire",province:"Kinshasa",deadline:"05 oct. 2026",tag:"CDD",desc:"Appui à la coordination, au reporting et au suivi d'activités destinées aux jeunes."},
    {id:"o4",type:"Financement",title:"Appel à projets — Innovation verte",org:"Fonds partenaire",province:"Haut-Katanga",deadline:"22 oct. 2026",tag:"Financement",desc:"Accompagnement de projets portés par des jeunes dans l'environnement et l'économie circulaire."}
  ],
  news:[
    {id:"n1",cat:"Actualités",date:"18 avr. 2026",title:"RDC – Jeunesse et MONUSCO : une rencontre stratégique pour renforcer la paix et la collaboration",excerpt:"Dialogue et collaboration autour de la jeunesse, de la paix et de la cohésion.",image:"https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80"},
    {id:"n2",cat:"Actualités",date:"23 déc. 2025",title:"Kolwezi : lancement officiel du Symposium de la Jeunesse du Lualaba",excerpt:"Une rencontre consacrée à la jeunesse du Lualaba et à la mobilisation des acteurs.",image:"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80"},
    {id:"n3",cat:"Institution",date:"22 déc. 2025",title:"Planification du plan d’action 2026 en faveur de la jeunesse",excerpt:"Une séance de travail consacrée à la planification des actions du CNJ.",image:"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"}
  ],
  events:[
    {id:"e1",day:"03",month:"OCT",title:"Forum Jeunesse & Emploi",place:"Kinshasa",format:"Présentiel"},
    {id:"e2",day:"11",month:"OCT",title:"Atelier leadership provincial",place:"Kongo-Central",format:"Hybride"},
    {id:"e3",day:"22",month:"OCT",title:"Rencontre Innovation & Numérique",place:"Haut-Katanga",format:"Présentiel"}
  ],
  consultations:[
    {id:"c1",title:"Emploi des jeunes & compétences numériques",status:"En cours",responses:2846,deadline:"08 oct. 2026",question:"Quelles compétences devraient être prioritaires pour améliorer l'employabilité des jeunes ?"}
  ],
  resources:[
    {id:"r1",type:"Guide",title:"Guide de participation des organisations de jeunesse",format:"PDF",size:"2,4 MB",url:"#"},
    {id:"r2",type:"Rapport",title:"Rapport synthétique — Consultation jeunesse",format:"PDF",size:"4,1 MB",url:"#"},
    {id:"r3",type:"Kit",title:"Kit pratique : créer et structurer une initiative",format:"ZIP",size:"8,6 MB",url:"#"},
    {id:"r4",type:"Référence",title:"Documentation institutionnelle et textes utiles",format:"PDF",size:"3,2 MB",url:"#"}
  ],
  organizations:[
    {id:"org1",name:"Réseau Jeunesse Innovation",province:"Kinshasa",domain:"Innovation & numérique",status:"verified"},
    {id:"org2",name:"Collectif Jeunes Entrepreneurs",province:"Haut-Katanga",domain:"Entrepreneuriat",status:"verified"}
  ],
  messages:[],newsletter:[],orgRequests:[],consultationResponses:[],applications:[],bookmarks:new Map(),sessions:new Map()
};

let cms=structuredClone(defaultCms);
try{
  const saved=JSON.parse(await readFile(CMS_FILE,"utf8"));
  cms={
    ...cms,
    ...saved,
    settings:{...cms.settings,...(saved.settings||{})},
    pages:{...cms.pages,...(saved.pages||{})},
    media:Array.isArray(saved.media)?saved.media:cms.media,
    overrides:{...cms.overrides,...(saved.overrides||{})}
  };
}catch{}
const persistedKeys=["programs","opportunities","news","events","consultations","resources","organizations"];
if(cms.collections){
  for(const k of persistedKeys) if(Array.isArray(cms.collections[k])) state[k]=cms.collections[k];
}
function syncCollections(){cms.collections=Object.fromEntries(persistedKeys.map(k=>[k,state[k]]));}
async function saveCms(){syncCollections();await writeFile(CMS_FILE,JSON.stringify(cms,null,2),"utf8");}

const accounts=[
  {id:"u_youth",role:"youth",name:"Jeune Démo",email:"jeune@demo.cnj.cd",password:"Jeune2026!"},
  {id:"u_admin",role:"admin",name:"Administrateur Démo",email:"admin@cnj.cd",password:"Admin2026!"}
];

const mimeTypes={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".webp":"image/webp"};

function send(res,status,data,headers={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers});res.end(JSON.stringify(data));}
async function body(req,max=12_000_000){return await new Promise((resolve,reject)=>{let s="";req.on("data",c=>{s+=c;if(s.length>max)reject(new Error("Payload too large"));});req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on("error",reject);});}
function clean(v){return typeof v==="string"?v.replace(/[<>]/g,"").trim().slice(0,10000):v;}
function sanitize(o){const out={};for(const [k,v] of Object.entries(o||{}))out[k]=typeof v==="string"?clean(v):v;return out;}
function auth(req,role){const h=req.headers.authorization||"";const token=h.startsWith("Bearer ")?h.slice(7):"";const s=state.sessions.get(token);if(!s)return null;if(role&&s.role!==role)return null;return s;}
function publicPayload(){return {demo:true,provinces,cms,programs:state.programs,opportunities:state.opportunities,news:state.news,events:state.events,consultations:state.consultations,resources:state.resources,organizations:state.organizations,missions:state.missions,values:state.values,structure:state.structure,leadership:state.leadership,officialNews:state.officialNews,officialDocuments:state.officialDocuments,partners:state.partners};}
function extFromMime(m){return {"image/png":".png","image/jpeg":".jpg","image/webp":".webp","image/gif":".gif"}[m]||"";}
async function serveStatic(res,urlPath){
  let file=urlPath==="/"? "index.html":urlPath.replace(/^\/+/, "");
  if(!extname(file))file="index.html";
  const safe=normalize(file).replace(/^(\.\.(\/|\\|$))+/, "");
  const path=join(ROOT,safe);
  if(!path.startsWith(ROOT))return send(res,403,{error:"Forbidden"});
  try{
    const data=await readFile(path);
    res.writeHead(200,{"Content-Type":mimeTypes[extname(path).toLowerCase()]||"application/octet-stream","Cache-Control":extname(path)===".html"?"no-cache":"public, max-age=300","X-Content-Type-Options":"nosniff"});
    res.end(data);
  }catch{
    try{const data=await readFile(join(ROOT,"index.html"));res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"});res.end(data);}catch{send(res,404,{error:"Not found"});}
  }
}
function collectionRoute(path,name){
  const base="/api/admin/"+name;
  if(path===base)return {action:"collection"};
  if(path.startsWith(base+"/"))return {action:"item",id:path.split("/").pop()};
  return null;
}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,"http://localhost");
  try{
    if(req.method==="GET"&&u.pathname==="/api/health")return send(res,200,{ok:true,startedAt});
    if(req.method==="GET"&&u.pathname==="/api/bootstrap")return send(res,200,publicPayload());

    if(req.method==="POST"&&u.pathname==="/api/auth/login"){
      const b=sanitize(await body(req));const user=accounts.find(x=>x.email.toLowerCase()===String(b.email||"").toLowerCase()&&x.password===b.password);
      if(!user)return send(res,401,{error:"Identifiants invalides"});
      const token=crypto.randomBytes(24).toString("hex"),session={id:user.id,role:user.role,name:user.name,email:user.email};state.sessions.set(token,session);return send(res,200,{token,user:session});
    }
    if(req.method==="GET"&&u.pathname==="/api/me"){const s=auth(req);return s?send(res,200,{user:s}):send(res,401,{error:"Non authentifié"});}

    if(req.method==="POST"&&u.pathname==="/api/contact"){const b=sanitize(await body(req));if(!b.name||!b.email||!b.message)return send(res,400,{error:"Nom, email et message requis"});state.messages.unshift({id:uid("msg"),...b,createdAt:new Date().toISOString()});return send(res,201,{ok:true});}
    if(req.method==="POST"&&u.pathname==="/api/newsletter"){const b=sanitize(await body(req));if(!b.email)return send(res,400,{error:"Email requis"});state.newsletter.push({id:uid("nl"),email:b.email,createdAt:new Date().toISOString()});return send(res,201,{ok:true});}
    if(req.method==="POST"&&u.pathname==="/api/organizations"){const b=sanitize(await body(req));if(!b.name||!b.province||!b.email)return send(res,400,{error:"Nom, province et email requis"});state.orgRequests.unshift({id:uid("orgreq"),...b,status:"pending",createdAt:new Date().toISOString()});return send(res,201,{ok:true});}
    if(req.method==="POST"&&u.pathname.startsWith("/api/consultations/")&&u.pathname.endsWith("/respond")){const id=u.pathname.split("/")[3],b=sanitize(await body(req));state.consultationResponses.unshift({id:uid("resp"),consultationId:id,...b,createdAt:new Date().toISOString()});return send(res,201,{ok:true});}
    if(req.method==="POST"&&u.pathname==="/api/applications"){const b=sanitize(await body(req));state.applications.unshift({id:uid("app"),...b,status:"Soumise",createdAt:new Date().toISOString()});return send(res,201,{ok:true});}

    if(req.method==="GET"&&u.pathname==="/api/youth/dashboard"){const s=auth(req,"youth");if(!s)return send(res,401,{error:"Non autorisé"});const bookmarks=[...(state.bookmarks.get(s.id)||new Set())];return send(res,200,{bookmarks,applications:state.applications.filter(x=>x.email===s.email),recommended:state.opportunities.slice(0,4)});}
    if(req.method==="POST"&&u.pathname.startsWith("/api/bookmarks/")){const s=auth(req,"youth");if(!s)return send(res,401,{error:"Connexion requise"});const id=u.pathname.split("/").pop();if(!state.bookmarks.has(s.id))state.bookmarks.set(s.id,new Set());const set=state.bookmarks.get(s.id);set.has(id)?set.delete(id):set.add(id);return send(res,200,{bookmarks:[...set]});}

    const admin=auth(req,"admin");
    if(u.pathname.startsWith("/api/admin")&&!admin)return send(res,401,{error:"Non autorisé"});

    if(req.method==="GET"&&u.pathname==="/api/admin"){
      return send(res,200,{kpis:{opportunities:state.opportunities.length,pendingOrganizations:state.orgRequests.filter(x=>x.status==="pending").length,consultationResponses:state.consultationResponses.length,messages:state.messages.length,media:cms.media.length},opportunities:state.opportunities,news:state.news,programs:state.programs,resources:state.resources,orgRequests:state.orgRequests,messages:state.messages,applications:state.applications,cms});
    }
    if(req.method==="GET"&&u.pathname==="/api/admin/cms")return send(res,200,{cms});
    if(req.method==="PUT"&&u.pathname==="/api/admin/settings"){cms.settings={...cms.settings,...sanitize(await body(req))};await saveCms();return send(res,200,{ok:true,settings:cms.settings});}
    if(req.method==="PUT"&&u.pathname.startsWith("/api/admin/pages/")){const key=u.pathname.split("/").pop();if(!cms.pages[key])return send(res,404,{error:"Page inconnue"});cms.pages[key]={...cms.pages[key],...sanitize(await body(req))};await saveCms();return send(res,200,{ok:true,page:cms.pages[key]});}
    if(req.method==="PUT"&&u.pathname.startsWith("/api/admin/overrides/")){const key=u.pathname.split("/").pop();const b=await body(req,4_000_000);cms.overrides[key]={texts:b.texts||{},images:b.images||{}};await saveCms();return send(res,200,{ok:true,overrides:cms.overrides[key]});}

    if(req.method==="POST"&&u.pathname==="/api/admin/media"){
      const b=await body(req,16_000_000);const mime=String(b.mime||"");const ext=extFromMime(mime);
      if(!ext||!String(b.data||"").startsWith("data:image/"))return send(res,400,{error:"Image PNG, JPG ou WEBP requise"});
      const base64=String(b.data).split(",")[1]||"";const buf=Buffer.from(base64,"base64");if(buf.length>6_000_000)return send(res,400,{error:"Image trop volumineuse (6 MB max)"});
      const filename=uid("media")+ext;await writeFile(join(UPLOAD_DIR,filename),buf);const item={id:uid("m"),name:clean(b.name||filename),url:"/uploads/"+filename,mime,size:buf.length,createdAt:new Date().toISOString()};cms.media.unshift(item);await saveCms();return send(res,201,{ok:true,item});
    }
    if(req.method==="DELETE"&&u.pathname.startsWith("/api/admin/media/")){
      const id=u.pathname.split("/").pop();const item=cms.media.find(x=>x.id===id);if(!item)return send(res,404,{error:"Média introuvable"});cms.media=cms.media.filter(x=>x.id!==id);try{await unlink(join(ROOT,item.url.replace(/^\//,"")));}catch{}await saveCms();return send(res,200,{ok:true});
    }

    for(const [name,key] of [["opportunities","opportunities"],["news","news"],["programs","programs"],["resources","resources"],["events","events"],["consultations","consultations"]]){
      const r=collectionRoute(u.pathname,name);if(!r)continue;
      if(req.method==="POST"&&r.action==="collection"){const b=sanitize(await body(req));const rec={id:uid(name.slice(0,2)),...b};state[key].unshift(rec);await saveCms();return send(res,201,{ok:true,record:rec});}
      if(req.method==="PUT"&&r.action==="item"){const i=state[key].findIndex(x=>x.id===r.id);if(i<0)return send(res,404,{error:"Élément introuvable"});state[key][i]={...state[key][i],...sanitize(await body(req)),id:r.id};await saveCms();return send(res,200,{ok:true,record:state[key][i]});}
      if(req.method==="DELETE"&&r.action==="item"){state[key]=state[key].filter(x=>x.id!==r.id);await saveCms();return send(res,200,{ok:true});}
    }

    if(req.method==="PATCH"&&u.pathname.startsWith("/api/admin/organizations/")){const id=u.pathname.split("/").pop(),b=sanitize(await body(req)),rec=state.orgRequests.find(x=>x.id===id);if(!rec)return send(res,404,{error:"Demande introuvable"});rec.status=b.status==="approved"?"approved":"rejected";if(rec.status==="approved"&&!state.organizations.some(x=>x.name===rec.name))state.organizations.push({id:uid("org"),name:rec.name,province:rec.province,domain:rec.domain||"Autre",status:"verified"});await saveCms();return send(res,200,{ok:true,record:rec});}

    return serveStatic(res,u.pathname);
  }catch(err){console.error(err);return send(res,500,{error:"Erreur serveur"});}
});

server.listen(PORT,"0.0.0.0",()=>console.log("CNJ-RDC CMS demo listening on",PORT));
