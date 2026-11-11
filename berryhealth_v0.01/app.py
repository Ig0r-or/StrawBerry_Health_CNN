import io, json, os, time, uuid
import numpy as np, tensorflow as tf
from flask import Flask, request, jsonify, render_template_string
from PIL import Image

LIMIAR = 0.60   # abaixo disso => "nao conclusivo"
IMG = 224
app = Flask(__name__)
model = tf.keras.models.load_model("model.keras")
classes = json.load(open("classes.json"))
os.makedirs("feedback", exist_ok=True)

ORIENTACAO = {
 "saudavel": ("Folha saudável", "Nenhum sinal de problema nesta folha. Continue o monitoramento de rotina."),
 "deficiencia_calcio": ("Provável deficiência de cálcio (tipburn)",
   "Geralmente é falha no transporte do cálcio até a folha nova, não falta no solo. Verifique irrigação regular, umidade/ventilação do ambiente e adubação equilibrada antes de aplicar mais cálcio. Procure um técnico para confirmar."),
 "queima_foliar": ("Provável queima foliar",
   "Pode estar ligada a fungo. Remova folhas muito afetadas, melhore a ventilação e evite molhar a folhagem. Procure orientação técnica antes de aplicar produtos."),
 "folha_velha": ("Folha velha (senescência natural)",
   "Alteração esperada em folhas mais velhas. Retire-a para melhorar a ventilação, se necessário."),
 "nao_conclusivo": ("Não conclusivo",
   "A IA não conseguiu concluir com segurança. Envie nova foto (folha nova, boa luz, de perto) ou busque orientação técnica."),
}

def qualidade(img):
    if min(img.size) < 150: return "Foto pequena demais. Aproxime-se da folha."
    g = np.asarray(img.convert("L"), dtype=np.float32)
    if g.mean() < 40: return "Foto muito escura. Procure mais luz."
    if (np.var(np.diff(g, axis=0)) + np.var(np.diff(g, axis=1))) < 15: return "Foto desfocada. Tente de novo."
    return None

@app.post("/diagnosticar")
def diagnosticar():
    f = request.files.get("foto")
    if not f: return jsonify(erro="Envie uma foto."), 400
    img = Image.open(f.stream).convert("RGB")
    problema = qualidade(img)
    if problema: return jsonify(erro=problema), 422
    arr = np.asarray(img.resize((IMG, IMG)), dtype=np.float32)[None]
    prob = model.predict(arr, verbose=0)[0]
    i = int(np.argmax(prob)); conf = float(prob[i])
    cls = classes[i] if conf >= LIMIAR else "nao_conclusivo"
    titulo, texto = ORIENTACAO.get(cls, (cls, ""))
    fid = uuid.uuid4().hex[:10]
    img.save(f"feedback/{fid}.jpg")
    json.dump({"pred": cls, "conf": conf, "ts": time.time()}, open(f"feedback/{fid}.json", "w"))
    return jsonify(id=fid, classe=cls, titulo=titulo, orientacao=texto, confianca=round(conf*100),
                   detalhes={c: round(float(p)*100) for c, p in zip(classes, prob)})

@app.post("/feedback")
def feedback():
    d = request.json; p = f"feedback/{d['id']}.json"
    if os.path.exists(p):
        j = json.load(open(p)); j["acertou"] = bool(d["acertou"]); json.dump(j, open(p, "w"))
    return jsonify(ok=True)

PAGE = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>BerryHealth AI</title>
<style>
:root{--r:#c0213a;--r2:#9d1a2f;--bg:#faf4f5;--ink:#2b2b2b;--mut:#6f6f6f;--ok:#2e7d32;--warn:#b26a00}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);margin:0}
header{background:#fff;border-bottom:1px solid #eadadd;position:sticky;top:0;z-index:5}
.nav{max-width:1100px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:22px;font-weight:700;color:var(--r)}
.nav span{color:var(--mut);font-size:14px}
.hero{max-width:1100px;margin:0 auto;padding:36px 24px 12px}
.hero h1{font-size:34px;margin:0 0 6px}.hero p{color:var(--mut);margin:0;font-size:17px}
.grid{max-width:1100px;margin:0 auto;padding:20px 24px 40px;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.card{background:#fff;border-radius:18px;padding:24px;box-shadow:0 2px 14px #0000000f}
.card h2{margin:0 0 14px;font-size:18px}
.drop{border:2px dashed #d9b9bf;border-radius:14px;padding:34px 16px;text-align:center;cursor:pointer;transition:.15s;color:var(--mut)}
.drop:hover,.drop.over{border-color:var(--r);background:#fff5f6;color:var(--r)}
.drop b{display:block;font-size:17px;color:var(--ink);margin-bottom:4px}
#prev{width:100%;max-height:340px;object-fit:contain;border-radius:12px;background:#f3eeef;margin-top:14px}
.tips{display:flex;gap:10px;margin:16px 0 0;flex-wrap:wrap}
.tip{background:#fdecee;color:var(--r2);border-radius:20px;padding:6px 14px;font-size:13px}
.btn{background:var(--r);color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:15px;cursor:pointer;margin-top:14px}
.btn:hover{background:var(--r2)}.btn:disabled{opacity:.5;cursor:not-allowed}
.btn.alt{background:#eee;color:#333;margin-right:8px}.btn.alt:hover{background:#e0e0e0}
.empty{color:var(--mut);text-align:center;padding:40px 10px}
.badge{display:inline-block;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600;color:#fff}
.b-ok{background:var(--ok)}.b-bad{background:var(--r)}.b-warn{background:var(--warn)}
.res h3{font-size:22px;margin:10px 0 4px}
.conf{font-size:40px;font-weight:700;color:var(--r);margin:0}
.conf small{font-size:14px;color:var(--mut);font-weight:400}
.row{display:flex;justify-content:space-between;font-size:13px;margin-top:10px}
.bar{height:8px;background:#eee;border-radius:4px;overflow:hidden}.bar i{display:block;height:100%;background:var(--r)}
.erro{color:#b00020;font-weight:600}
.fb{margin-top:20px;padding-top:16px;border-top:1px solid #eee}
footer{max-width:1100px;margin:0 auto;padding:0 24px 30px;color:var(--mut);font-size:13px}
.hide{display:none}
@media(max-width:820px){.grid{grid-template-columns:1fr}.hero h1{font-size:26px}}
.user{position:relative}
.user-btn{display:flex;align-items:center;gap:10px;background:none;border:1px solid #eadadd;border-radius:30px;padding:5px 14px 5px 5px;cursor:pointer;font-size:14px;color:var(--ink)}
.avatar{width:34px;height:34px;border-radius:50%;background:var(--r);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
.plan{font-size:11px;background:#fdecee;color:var(--r2);border-radius:10px;padding:2px 8px;font-weight:600}
.menu{display:none;position:absolute;right:0;top:100%;padding-top:8px;min-width:210px}
.menu ul{list-style:none;margin:0;padding:6px;background:#fff;border:1px solid #eadadd;border-radius:12px;box-shadow:0 6px 20px #0000001a}
.menu li{padding:10px 12px;border-radius:8px;cursor:default;font-size:14px}
.menu li:hover{background:#faf4f5}.menu li.sep{border-top:1px solid #eee;margin-top:4px;padding-top:12px;color:var(--mut)}
.user:hover .menu{display:block}
.account{grid-column:1/-1;display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center}
.account .avatar{width:64px;height:64px;font-size:24px}
.account h2{margin:0 0 4px}.account p{margin:0;color:var(--mut);font-size:14px}
.usage{margin-top:10px;max-width:360px}
.stats{display:flex;gap:28px}.stat b{display:block;font-size:24px;color:var(--r)}.stat span{font-size:12px;color:var(--mut)}
.btn.pro{margin:0;background:#2b2b2b}.btn.pro:hover{background:#000}
@media(max-width:820px){.account{grid-template-columns:1fr}.nav span{display:none}.user-btn .uname{display:none}}
</style></head><body>
<header><div class="nav"><div class="logo">🍓 BerryHealth AI</div><span>Diagnóstico por foto do morangueiro</span>
 <div class="user"><button class="user-btn" type="button"><div class="avatar">CV</div><span class="uname">Cezar Vitor</span><span class="plan">Gratuito</span></button>
  <div class="menu"><ul><li>👤 Meu perfil</li><li>🌱 Meus talhões</li><li>🕘 Histórico de diagnósticos</li><li>⭐ Assinar plano Pro</li><li class="sep">↩ Sair</li></ul></div></div>
</div></header>
<section class="hero"><h1>Fotografou, descobriu.</h1>
<p>Envie a foto de uma folha de morango e receba um diagnóstico com nível de confiança e orientação de manejo.</p></section>
<main class="grid">
 <section class="card"><h2>1. Envie a foto da folha</h2>
  <div class="drop" id="drop"><b>Arraste a imagem aqui</b>ou clique para escolher um arquivo</div>
  <input id="f" type="file" accept="image/*" class="hide">
  <img id="prev" class="hide" alt="Pré-visualização">
  <div class="tips"><span class="tip">🌿 Folha nova</span><span class="tip">☀️ Boa luz</span><span class="tip">🔍 De perto</span></div>
  <button class="btn" id="go" disabled>Analisar folha</button>
 </section>
 <section class="card"><h2>2. Resultado</h2><div id="res" class="res"><div class="empty">O diagnóstico aparecerá aqui.</div></div></section>
 <section class="card account">
  <div class="avatar">JS</div>
  <div><h2>Olá, Cezar Vitor 👋</h2><p>Sítio Boa Vista · Pouso Alegre, MG · Plano Gratuito</p>
   <div class="usage"><div class="row"><span>Diagnósticos este mês</span><span>3 de 10</span></div><div class="bar"><i style="width:30%"></i></div></div></div>
  <div><div class="stats"><div class="stat"><b>12</b><span>Fotos enviadas</span></div><div class="stat"><b>2</b><span>Talhões</span></div><div class="stat"><b>83%</b><span>Acertos</span></div></div>
   <button class="btn pro" type="button" style="margin-top:14px">Conhecer o plano Pro</button></div>
 </section>
</main>
<footer>BerryHealth é uma ferramenta de apoio à decisão. Não substitui orientação técnica nem prescreve doses.</footer>
<script>
const $=id=>document.getElementById(id); let file=null;
function setFile(f){ if(!f||!f.type.startsWith('image/'))return; file=f;
 $('prev').src=URL.createObjectURL(f); $('prev').classList.remove('hide'); $('go').disabled=false;
 $('res').innerHTML='<div class="empty">Pronto para analisar.</div>'; }
$('drop').onclick=()=>$('f').click();
$('f').onchange=e=>setFile(e.target.files[0]);
['dragenter','dragover'].forEach(t=>$('drop').addEventListener(t,e=>{e.preventDefault();$('drop').classList.add('over')}));
['dragleave','drop'].forEach(t=>$('drop').addEventListener(t,e=>{e.preventDefault();$('drop').classList.remove('over')}));
$('drop').addEventListener('drop',e=>setFile(e.dataTransfer.files[0]));
$('go').onclick=async()=>{
 const r=$('res'); r.innerHTML='<div class="empty">Analisando…</div>'; $('go').disabled=true;
 const fd=new FormData(); fd.append('foto',file);
 try{
  const resp=await fetch('/diagnosticar',{method:'POST',body:fd}); const d=await resp.json();
  if(d.erro){r.innerHTML='<p class="erro">'+d.erro+'</p>';return}
  const cls=d.classe==='saudavel'?'b-ok':(d.classe==='nao_conclusivo'?'b-warn':'b-bad');
  const det=Object.entries(d.detalhes).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
   `<div class="row"><span>${k.replace('_',' ')}</span><span>${v}%</span></div><div class="bar"><i style="width:${v}%"></i></div>`).join('');
  r.innerHTML=`<span class="badge ${cls}">${d.classe.replace('_',' ')}</span><h3>${d.titulo}</h3>
   <p class="conf">${d.confianca}%<small> de confiança</small></p><p>${d.orientacao}</p>${det}
   <div class="fb"><b>O diagnóstico acertou?</b><br>
   <button class="btn alt" onclick="fb('${d.id}',true)">✅ Acertou</button>
   <button class="btn alt" onclick="fb('${d.id}',false)">❌ Errou</button></div>`;
 }catch(e){r.innerHTML='<p class="erro">Erro ao conectar com o servidor.</p>'}
 finally{$('go').disabled=false}
};
async function fb(id,a){
 await fetch('/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,acertou:a})});
 document.querySelector('.fb').innerHTML='<p>Obrigado! Sua resposta ajuda o modelo a aprender. 🌱</p>';
}
</script></body></html>"""

@app.get("/")
def home(): return render_template_string(PAGE)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
