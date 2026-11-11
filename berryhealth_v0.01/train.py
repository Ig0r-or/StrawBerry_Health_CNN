import json, os, numpy as np, tensorflow as tf
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

IMG, BS, SEED = 224, 32, 42
classes = sorted(d for d in os.listdir("data") if os.path.isdir(f"data/{d}"))
paths, labels = [], []
for i, c in enumerate(classes):
    for f in os.listdir(f"data/{c}"):
        paths.append(f"data/{c}/{f}"); labels.append(i)
labels = np.array(labels, dtype="int32")
print("classes:", classes, "| total:", len(paths))

# UMA unica divisao (70/15/15), estratificada, antes de qualquer aumento de dados
idx = np.arange(len(paths))
i_tr, i_tmp = train_test_split(idx, test_size=0.30, stratify=labels, random_state=SEED)
i_va, i_te = train_test_split(i_tmp, test_size=0.50, stratify=labels[i_tmp], random_state=SEED)
print("treino/val/teste:", len(i_tr), len(i_va), len(i_te))

def carregar(indices):
    X = np.zeros((len(indices), IMG, IMG, 3), dtype="float32")
    for k, j in enumerate(indices):
        X[k] = np.asarray(Image.open(paths[j]).convert("RGB").resize((IMG, IMG)), dtype="float32")
    return X, labels[indices]

print("Carregando imagens...")
Xtr, ytr = carregar(i_tr)
Xva, yva = carregar(i_va)
Xte, yte = carregar(i_te)
print("dtypes:", Xtr.dtype, ytr.dtype, "| shapes:", Xtr.shape, ytr.shape)

aug = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.15),
    tf.keras.layers.RandomZoom(0.15),
    tf.keras.layers.RandomBrightness(0.2, value_range=(0, 255)),
])
base = tf.keras.applications.MobileNetV2(input_shape=(IMG, IMG, 3), include_top=False, weights="imagenet")
base.trainable = False

inp = tf.keras.Input((IMG, IMG, 3))
x = aug(inp)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.3)(x)
out = tf.keras.layers.Dense(len(classes), activation="softmax")(x)
model = tf.keras.Model(inp, out)

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])
model.fit(Xtr, ytr, validation_data=(Xva, yva), epochs=8, batch_size=BS)

base.trainable = True                      # ajuste fino das ultimas camadas
for l in base.layers[:-30]:
    l.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])
model.fit(Xtr, ytr, validation_data=(Xva, yva), epochs=6, batch_size=BS,
          callbacks=[tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)])

print("\n=== TESTE (nunca visto no treino) ===")
loss, acc = model.evaluate(Xte, yte, batch_size=BS)
print(f"loss: {loss:.4f} | acuracia: {acc:.4f}")
pred = np.argmax(model.predict(Xte, batch_size=BS), axis=1)
print(classification_report(yte, pred, target_names=classes))
print(confusion_matrix(yte, pred))

model.save("model.keras")
json.dump(classes, open("classes.json", "w"))
print("Modelo salvo em model.keras")