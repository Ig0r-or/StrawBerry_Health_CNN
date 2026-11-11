"""Organiza o dataset em data/<classe>/*.jpg.
Classes finais: saudavel, deficiencia_calcio, queima_foliar, folha_velha
(a classe 'nao_conclusivo' NAO e treinada: ela surge pelo limiar de confianca no app).

Como usar: coloque as imagens baixadas nas pastas abaixo e rode este script para
remover duplicatas (evita o vazamento de dados apontado na auditoria).
  data/saudavel/              <- Hariri (healthy) + PlantifyDr (Strawberry healthy)
  data/deficiencia_calcio/    <- Hariri (tipburn)
  data/queima_foliar/         <- PlantifyDr (Strawberry Leaf scorch)
  data/folha_velha/           <- fotos proprias de folhas senescentes (opcional)
"""
import hashlib, os, shutil, sys

# Uso: python prepare_data.py "C:\caminho\para\a\pasta\do\dataset"
# Se nao passar caminho, procura a partir da pasta atual.
RAIZ = sys.argv[1] if len(sys.argv) > 1 else "."
DST = "data"
EXT = (".jpg", ".jpeg", ".png")

def classe_da_pasta(nome):
    n = nome.lower()
    if "scorch" in n: return "queima_foliar"
    if "health" in n: return "saudavel"
    return None

def split_do_caminho(caminho):
    partes = [p.lower() for p in caminho.replace("\\", "/").split("/")]
    if "train" in partes: return "train"
    if any(p in ("valid", "val", "validation") for p in partes): return "valid"
    return None

encontradas = []
for pasta, subdirs, arquivos in os.walk(RAIZ):
    if os.path.abspath(pasta).startswith(os.path.abspath(DST)): continue
    if "venv" in pasta.replace("\\", "/").split("/"): continue
    classe = classe_da_pasta(os.path.basename(pasta))
    split = split_do_caminho(pasta)
    imgs = [f for f in arquivos if f.lower().endswith(EXT)]
    if classe and split and imgs:
        encontradas.append((pasta, classe, split, imgs))

if not encontradas:
    print("Nenhuma pasta de imagens encontrada em:", os.path.abspath(RAIZ))
    print("Passe o caminho do dataset: python prepare_data.py \"C:\\...\\Strawberry\"")
    sys.exit(1)

vistos, copiadas, ignoradas = set(), 0, 0
for pasta, classe, split, imgs in encontradas:
    print(f"{pasta}  ->  {classe} ({split}): {len(imgs)} imagens")
    os.makedirs(os.path.join(DST, classe), exist_ok=True)
    for f in imgs:
        origem = os.path.join(pasta, f)
        h = hashlib.md5(open(origem, "rb").read()).hexdigest()
        if h in vistos:
            ignoradas += 1; continue
        vistos.add(h)
        shutil.copy(origem, os.path.join(DST, classe, f"{split}_{f}"))
        copiadas += 1

print("\nResumo em", DST)
for c in sorted(os.listdir(DST)):
    print(" ", c, len(os.listdir(os.path.join(DST, c))), "imagens")
print("copiadas:", copiadas, "| duplicatas ignoradas:", ignoradas)