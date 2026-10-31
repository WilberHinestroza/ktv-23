# Genera los audios del locutor con tu voz clonada (Chatterbox, modelo multilingüe, licencia MIT).
# Lo llama `npm run locutor -- --voz`; no hace falta correrlo a mano.
#
#   python voz_chatterbox.py lista.json --muestra voz.wav
#   lista.json = [{"texto": "...", "destino": "C:/.../public/locutor/x.mp3"}, ...]
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

sys.stdout.reconfigure(encoding="utf-8")  # la consola de Windows no muestra ✔ ni tildes sin esto

p = argparse.ArgumentParser()
p.add_argument("lista")
p.add_argument("--muestra", required=True, help="grabación de tu voz (wav, 10 a 20 segundos)")
p.add_argument("--expresion", type=float, default=0.55, help="0.3 tranquilo … 0.9 muy expresivo")
p.add_argument("--ritmo", type=float, default=0.45, help="más bajo = habla más pausado")
p.add_argument("--tono", type=float, default=0, help="semitonos: -2 = voz más grave y gruesa")
p.add_argument("--radio", action="store_true", help="más graves y compresión, sonido de locutor")
p.add_argument("--crudo", action="store_true", help="guarda también el .wav sin procesar al lado del mp3")
a = p.parse_args()

if not os.path.exists(a.muestra):
    sys.exit(f"No encuentro tu muestra de voz: {a.muestra}")

def filtro_final(sr):
    """Quita silencios al inicio y al final, ajusta tono y cuerpo, e iguala el volumen."""
    partes = [
        "silenceremove=start_periods=1:start_threshold=-45dB",
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
    ]
    if a.tono:
        f = 2 ** (a.tono / 12)
        partes.append(f"rubberband=pitch={f:.4f}:pitchq=quality:transients=smooth")
    if a.radio:
        partes += [
            "highpass=f=60",
            "equalizer=f=140:t=q:w=1:g=3",  # más pecho
            "acompressor=threshold=-22dB:ratio=2:attack=10:release=150:makeup=1.5",
        ]
    partes += ["apad=pad_dur=0.25", "loudnorm=I=-16:TP=-1.5"]
    return ",".join(partes)


items = json.load(open(a.lista, encoding="utf-8"))
torch.set_num_threads(max(1, (os.cpu_count() or 4) - 1))
print("… cargando el modelo (la primera vez lo descarga, unos 3 GB)", flush=True)
modelo = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
modelo.prepare_conditionals(a.muestra, exaggeration=a.expresion)

inicio = time.time()
for i, it in enumerate(items, 1):
    os.makedirs(os.path.dirname(it["destino"]), exist_ok=True)
    wav = modelo.generate(it["texto"], language_id="es", exaggeration=a.expresion, cfg_weight=a.ritmo)
    with tempfile.TemporaryDirectory() as tmp:
        crudo = os.path.join(tmp, "voz.wav")
        ta.save(crudo, wav, modelo.sr)
        if a.crudo:
            shutil.copy(crudo, os.path.splitext(it["destino"])[0] + ".wav")
        filtro = filtro_final(modelo.sr)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", crudo, "-af", filtro, "-ar", "44100",
             "-codec:a", "libmp3lame", "-b:a", "128k", it["destino"]],
            check=True,
        )
    pasado = time.time() - inicio
    resta = pasado / i * (len(items) - i)
    print(f"  [{i}/{len(items)}] {os.path.basename(it['destino'])}  (faltan ~{resta / 60:.0f} min)", flush=True)

print(f"✔ {len(items)} audio(s) listos en {(time.time() - inicio) / 60:.1f} min", flush=True)
