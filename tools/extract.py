"""Step 1 of the rig pipeline: unpack the Tripo source GLBs into ./work (mesh arrays + textures).
Usage (from the project folder):  python tools/extract.py
Expects the original models in ./source_models/Orion_WW3Game_<Name>.glb"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import glbio
os.makedirs('./work', exist_ok=True)
for name in ['OrionMascar', 'ThomasHawthorne']:
    d = glbio.load(f'./source_models/Orion_WW3Game_{name}.glb')
    np.savez(f'./work/{name}_raw.npz', pos=d['pos'], nrm=d['nrm'], uv=d['uv'], idx=d['idx'])
    for k, v in d['maps'].items():
        open(f'./work/{name}_{k}.jpg', 'wb').write(v)
    print(name, d['pos'].shape[0], 'verts')
