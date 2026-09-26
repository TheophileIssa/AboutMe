import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8080);
const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const startedAt = new Date().toISOString();
const id = (prefix = "id") => prefix + "_" + Date.now().toString(36) + "_" + crypto.randomBytes(4).toString("hex");

const provinces = [
  "Bas-Uele","Équateur","Haut-Katanga","Haut-Lomami","Haut-Uele","Ituri","Kasaï","Kasaï-Central",
  "Kasaï-Oriental","Kinshasa","Kongo-Central","Kwango","Kwilu","Lomami","Lualaba","Mai-Ndombe",
  "Maniema","Mongala","Nord-Kivu","Nord-Ubangi","Sankuru","Sud-Kivu","Sud-Ubangi","Tanganyika","Tshopo","Tshuapa"
];

const state = {
  programs: [
    {id:"p1",slug:"emploi",title:"Emploi & entrepreneuriat",kicker:"Insertion et autonomie",text:"Orientation, opportunités, incubation, employabilité et mise en relation avec les acteurs économiques.",icon:"briefcase",image:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"},
    {id:"p2",slug:"education",title:"Éducation & compétences",kicker:"Apprendre et progresser",text:"Formation, compétences numériques, leadership, orientation académique et développement du capital humain.",icon:"graduation",image:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"},
    {id:"p3",slug:"citoyennete",title:"Citoyenneté & paix",kicker:"Participer et construire",text:"Dialogue, culture de paix, engagement communautaire, leadership et participation citoyenne.",icon:"peace",image:"https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1200&q=80"},
    {id:"p4",slug:"innovation",title:"Innovation & numérique",kicker:"Créer les solutions de demain",text:"Créativité, innovation, entrepreneuriat numérique et accès aux nouvelles technologies.",icon:"sparkles",image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"}
  ],
  opportunities: [
    {id:"o1",type:"Formation",title:"Compétences numériques pour l'emploi",org:"Programme partenaire",province:"Kinshasa",deadline:"09 oct. 2026",tag:"Gratuit",featured:true,desc:"Parcours pratique autour des outils numériques, de la recherche d'emploi et de la présence professionnelle en ligne."},
    {id:"o2",type:"Stage",title:"Stage en communication digitale",org:"Organisation partenaire",province:"Kongo-Central",deadline:"15 oct. 2026",tag:"3 mois",featured:true,desc:"Expérience pratique en communication, création de contenus, événementiel et suivi des campagnes."},
    {id:"o3",type:"Emploi",title:"Assistant(e) projet jeunesse",org:"Organisation partenaire",province:"Kinshasa",deadline:"05 oct. 2026",tag:"CDD",featured:false,desc:"Appui à la coordination, au reporting et au suivi d'activités destinées aux jeunes."},
    {id:"o4",type:"Financement",title:"Appel à projets — Innovation verte",org:"Fonds partenaire",province:"Haut-Katanga",deadline:"22 oct. 2026",tag:"Financement",featured:true,desc:"Accompagnement de projets portés par des jeunes dans l'environnement et l'économie circulaire."},
    {id:"o5",type:"Bourse",title:"Bourse leadership & politiques publiques",org:"Partenaire académique",province:"National",deadline:"30 oct. 2026",tag:"International",featured:false,desc:"Programme de renforcement des capacités pour jeunes diplômés et responsables d'organisations."},
    {id:"o6",type:"Concours",title:"Challenge national des jeunes innovateurs",org:"Écosystème innovation",province:"National",deadline:"30 oct. 2026",tag:"National",featured:false,desc:"Valorisation de solutions numériques et sociales imaginées et développées par des jeunes."},
    {id:"o7",type:"Volontariat",title:"Volontariat communautaire — Jeunes en action",org:"Réseau partenaire",province:"Sud-Kivu",deadline:"12 nov. 2026",tag:"Volontariat",featured:false,desc:"Engagement communautaire autour de l'éducation, la cohésion sociale et l'environnement."},
    {id:"o8",type:"Formation",title:"Bootcamp entrepreneuriat & finance",org:"Incubateur partenaire",province:"Lualaba",deadline:"18 oct. 2026",tag:"Bootcamp",featured:false,desc:"Parcours intensif en modèle économique, vente, gestion financière et pitch."}
  ],
  news: [
    {id:"n1",cat:"Institution",date:"24 sept. 2026",title:"Une nouvelle expérience numérique dédiée à la jeunesse",excerpt:"Le prototype repense l'accès aux informations, opportunités et espaces de participation.",image:"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80"},
    {id:"n2",cat:"Programme",date:"21 sept. 2026",title:"Insertion professionnelle : connecter compétences et opportunités",excerpt:"Une approche plus lisible pour rapprocher les jeunes des parcours d'insertion.",image:"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"},
    {id:"n3",cat:"Réseau",date:"18 sept. 2026",title:"Les provinces au cœur du nouveau portail",excerpt:"Chaque province pourra disposer de contenus, contacts et activités dédiés.",image:"https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80"},
    {id:"n4",cat:"Jeunesse",date:"16 sept. 2026",title:"Participation citoyenne : donner plus de place à la voix des jeunes",excerpt:"Consultations, propositions et retours structurés au sein d'un même espace.",image:"https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"}
  ],
  events: [
    {id:"e1",day:"03",month:"OCT",title:"Forum Jeunesse & Emploi",place:"Kinshasa",format:"Présentiel"},
    {id:"e2",day:"11",month:"OCT",title:"Atelier leadership provincial",place:"Kongo-Central",format:"Hybride"},
    {id:"e3",day:"22",month:"OCT",title:"Rencontre Innovation & Numérique",place:"Haut-Katanga",format:"Présentiel"}
  ],
  consultations: [
    {id:"c1",title:"Emploi des jeunes & compétences numériques",status:"En cours",responses:2846,deadline:"08 oct. 2026",question:"Quelles compétences devraient être prioritaires pour améliorer l'employabilité des jeunes ?"},
    {id:"c2",title:"Entrepreneuriat des jeunes",status:"En cours",responses:1932,deadline:"18 oct. 2026",question:"Quels obstacles faut-il traiter en priorité pour aider les jeunes entrepreneurs ?"},
    {id:"c3",title:"Participation citoyenne",status:"À venir",responses:0,deadline:"05 nov. 2026",question:"Comment mieux associer les jeunes aux espaces de décision et de dialogue ?"}
  ],
  resources: [
    {id:"r1",type:"Guide",title:"Guide de participation des organisations de jeunesse",format:"PDF",size:"2,4 MB"},
    {id:"r2",type:"Rapport",title:"Rapport synthétique — Consultation jeunesse",format:"PDF",size:"4,1 MB"},
    {id:"r3",type:"Kit",title:"Kit pratique : créer et structurer une initiative",format:"ZIP",size:"8,6 MB"},
    {id:"r4",type:"Référence",title:"Documentation institutionnelle et textes utiles",format:"PDF",size:"3,2 MB"}
  ],
  organizations: [
    {id:"org1",name:"Réseau Jeunesse Innovation",province:"Kinshasa",domain:"Innovation & numérique",status:"verified"},
    {id:"org2",name:"Collectif Jeunes Entrepreneurs",province:"Haut-Katanga",domain:"Entrepreneuriat",status:"verified"},
    {id:"org3",name:"Jeunesse Verte du Kivu",province:"Sud-Kivu",domain:"Environnement",status:"verified"},
    {id:"org4",name:"Plateforme Leadership Jeune",province:"Kongo-Central",domain:"Citoyenneté",status:"verified"}
  ],
  messages: [],
  newsletter: [],
  orgRequests: [],
  consultationResponses: [],
  applications: [],
  bookmarks: new Map(),
  sessions: new Map()
};

const accounts = [
  {id:"u_youth",role:"youth",name:"Jeune Démo",email:"jeune@demo.cnj.cd",password:"Jeune2026!"},
  {id:"u_admin",role:"admin",name:"Administrateur Démo",email:"admin@cnj.cd",password:"Admin2026!"}
];

const types = {
  ".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",
  ".webp":"image/webp",".ico":"image/x-icon",".txt":"text/plain; charset=utf-8"
};

function clean(value){
  if(typeof value !== "string") return value;
  return value.replace(/[<>]/g,"").trim().slice(0,5000);
}
function sanitizeObject(input){
  const out = {};
  for(const [k,v] of Object.entries(input || {})) out[k] = typeof v === "string" ? clean(v) : v;
  return out;
}
function sendJson(res,status,data){
  res.writeHead(status,{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"strict-origin-when-cross-origin"
  });
  res.end(JSON.stringify(data));
}
async function getBody(req){
  return await new Promise((resolve,reject)=>{
    let data = "";
    req.on("data",chunk=>{
      data += chunk;
      if(data.length > 1_000_000) reject(new Error("Payload too large"));
    });
    req.on("end",()=>{
      try{ resolve(data ? JSON.parse(data) : {}); }catch(err){ reject(err); }
    });
    req.on("error",reject);
  });
}
function auth(req, role){
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = state.sessions.get(token);
  if(!session) return null;
  if(role && session.role !== role) return null;
  return session;
}
function publicPayload(){
  return {
    demo:true,
    notice:"Prototype interactif : certains contenus et chiffres sont illustratifs et devront être validés avant publication officielle.",
    provinces,
    programs:state.programs,
    opportunities:state.opportunities,
    news:state.news,
    events:state.events,
    consultations:state.consultations,
    resources:state.resources,
    organizations:state.organizations
  };
}
async function serveStatic(req,res,urlPath){
  let file = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  if(!extname(file)) file = "index.html";
  const safe = normalize(file).replace(/^(\.\.(\/|\\|$))+/, "");
  const path = join(ROOT,safe);
  if(!path.startsWith(ROOT)) return sendJson(res,403,{error:"Forbidden"});
  try{
    const data = await readFile(path);
    res.writeHead(200,{
      "Content-Type":types[extname(path).toLowerCase()] || "application/octet-stream",
      "Cache-Control": extname(path) === ".html" ? "no-cache" : "public, max-age=300",
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"strict-origin-when-cross-origin"
    });
    res.end(data);
  }catch{
    if(urlPath !== "/"){
      try{
        const data = await readFile(join(ROOT,"index.html"));
        res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"});
        return res.end(data);
      }catch{}
    }
    sendJson(res,404,{error:"Not found"});
  }
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url,"http://localhost");
  try{
    if(req.method === "GET" && url.pathname === "/api/health") return sendJson(res,200,{ok:true,startedAt});
    if(req.method === "GET" && url.pathname === "/api/bootstrap") return sendJson(res,200,publicPayload());

    if(req.method === "POST" && url.pathname === "/api/auth/login"){
      const body = sanitizeObject(await getBody(req));
      const user = accounts.find(x=>x.email.toLowerCase() === String(body.email || "").toLowerCase() && x.password === body.password);
      if(!user) return sendJson(res,401,{error:"Identifiants invalides"});
      const token = crypto.randomBytes(24).toString("hex");
      const session = {id:user.id,role:user.role,name:user.name,email:user.email};
      state.sessions.set(token,session);
      return sendJson(res,200,{token,user:session});
    }
    if(req.method === "GET" && url.pathname === "/api/me"){
      const session = auth(req);
      return session ? sendJson(res,200,{user:session}) : sendJson(res,401,{error:"Non authentifié"});
    }

    if(req.method === "POST" && url.pathname === "/api/newsletter"){
      const body = sanitizeObject(await getBody(req));
      if(!body.email) return sendJson(res,400,{error:"Email requis"});
      state.newsletter.push({id:id("nl"),email:body.email,createdAt:new Date().toISOString()});
      return sendJson(res,201,{ok:true});
    }
    if(req.method === "POST" && url.pathname === "/api/contact"){
      const body = sanitizeObject(await getBody(req));
      if(!body.name || !body.email || !body.message) return sendJson(res,400,{error:"Nom, email et message requis"});
      state.messages.unshift({id:id("msg"),...body,createdAt:new Date().toISOString()});
      return sendJson(res,201,{ok:true});
    }
    if(req.method === "POST" && url.pathname === "/api/organizations"){
      const body = sanitizeObject(await getBody(req));
      if(!body.name || !body.province || !body.email) return sendJson(res,400,{error:"Nom, province et email requis"});
      const record = {id:id("orgreq"),...body,status:"pending",createdAt:new Date().toISOString()};
      state.orgRequests.unshift(record);
      return sendJson(res,201,{ok:true,record});
    }
    if(req.method === "POST" && url.pathname.startsWith("/api/consultations/") && url.pathname.endsWith("/respond")){
      const consultationId = url.pathname.split("/")[3];
      const body = sanitizeObject(await getBody(req));
      if(!body.answer) return sendJson(res,400,{error:"Réponse requise"});
      state.consultationResponses.unshift({id:id("resp"),consultationId,...body,createdAt:new Date().toISOString()});
      const c = state.consultations.find(x=>x.id === consultationId);
      if(c) c.responses += 1;
      return sendJson(res,201,{ok:true});
    }
    if(req.method === "POST" && url.pathname === "/api/applications"){
      const body = sanitizeObject(await getBody(req));
      if(!body.opportunityId || !body.name || !body.email) return sendJson(res,400,{error:"Informations de candidature incomplètes"});
      state.applications.unshift({id:id("app"),...body,status:"Soumise",createdAt:new Date().toISOString()});
      return sendJson(res,201,{ok:true});
    }
    if(req.method === "POST" && url.pathname.startsWith("/api/bookmarks/")){
      const session = auth(req,"youth");
      if(!session) return sendJson(res,401,{error:"Connexion Espace Jeunes requise"});
      const opportunityId = url.pathname.split("/").pop();
      if(!state.bookmarks.has(session.id)) state.bookmarks.set(session.id,new Set());
      const set = state.bookmarks.get(session.id);
      if(set.has(opportunityId)) set.delete(opportunityId); else set.add(opportunityId);
      return sendJson(res,200,{bookmarks:[...set]});
    }
    if(req.method === "GET" && url.pathname === "/api/youth/dashboard"){
      const session = auth(req,"youth");
      if(!session) return sendJson(res,401,{error:"Non autorisé"});
      const bookmarks = [...(state.bookmarks.get(session.id) || new Set())];
      const applications = state.applications.filter(x=>x.email === session.email || x.userId === session.id);
      return sendJson(res,200,{bookmarks,applications,recommended:state.opportunities.filter(x=>x.featured).slice(0,4)});
    }

    if(req.method === "GET" && url.pathname === "/api/admin"){
      const session = auth(req,"admin");
      if(!session) return sendJson(res,401,{error:"Non autorisé"});
      return sendJson(res,200,{
        kpis:{
          opportunities:state.opportunities.length,
          pendingOrganizations:state.orgRequests.filter(x=>x.status === "pending").length,
          consultationResponses:state.consultationResponses.length,
          messages:state.messages.length
        },
        opportunities:state.opportunities,
        orgRequests:state.orgRequests,
        messages:state.messages.slice(0,20),
        applications:state.applications.slice(0,20)
      });
    }
    if(req.method === "POST" && url.pathname === "/api/admin/opportunities"){
      const session = auth(req,"admin");
      if(!session) return sendJson(res,401,{error:"Non autorisé"});
      const body = sanitizeObject(await getBody(req));
      if(!body.title || !body.type) return sendJson(res,400,{error:"Titre et type requis"});
      const record = {id:id("opp"),featured:false,org:"CNJ / Partenaire",province:"National",deadline:"À définir",tag:body.type,desc:"Nouvelle opportunité ajoutée depuis le tableau de bord.",...body};
      state.opportunities.unshift(record);
      return sendJson(res,201,{ok:true,record});
    }
    if(req.method === "PATCH" && url.pathname.startsWith("/api/admin/organizations/")){
      const session = auth(req,"admin");
      if(!session) return sendJson(res,401,{error:"Non autorisé"});
      const orgId = url.pathname.split("/").pop();
      const body = sanitizeObject(await getBody(req));
      const request = state.orgRequests.find(x=>x.id === orgId);
      if(!request) return sendJson(res,404,{error:"Demande introuvable"});
      request.status = body.status === "approved" ? "approved" : "rejected";
      if(request.status === "approved"){
        state.organizations.push({id:id("org"),name:request.name,province:request.province,domain:request.domain || "Autre",status:"verified"});
      }
      return sendJson(res,200,{ok:true,request});
    }

    return serveStatic(req,res,url.pathname);
  }catch(err){
    console.error(err);
    return sendJson(res,500,{error:"Erreur serveur"});
  }
});

server.listen(PORT,"0.0.0.0",()=>console.log("CNJ-RDC premium demo listening on",PORT));
