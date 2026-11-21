import struct, json, numpy as np
CT={5126:np.float32,5125:np.uint32,5123:np.uint16,5121:np.uint8}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(path):
    b=open(path,'rb').read()
    jl=struct.unpack('<I',b[12:16])[0]
    j=json.loads(b[20:20+jl])
    off=20+jl
    bl=struct.unpack('<I',b[off:off+4])[0]
    bin_=b[off+8:off+8+bl]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]
        o=bv.get('byteOffset',0)+a.get('byteOffset',0)
        n=NC[a['type']]; dt=CT[a['componentType']]
        arr=np.frombuffer(bin_,dtype=dt,count=a['count']*n,offset=o)
        return arr.reshape(a['count'],n) if n>1 else arr
    p=j['meshes'][0]['primitives'][0]
    pos=acc(p['attributes']['POSITION']).copy(); nrm=acc(p['attributes']['NORMAL']).copy()
    uv=acc(p['attributes']['TEXCOORD_0']).copy(); idx=acc(p['indices']).astype(np.int64).reshape(-1,3)
    imgs=[]
    for im in j['images']:
        bv=j['bufferViews'][im['bufferView']]; o=bv.get('byteOffset',0)
        imgs.append(bin_[o:o+bv['byteLength']])
    # texture index -> image
    tex=[t['source'] for t in j['textures']]
    m=j['materials'][0]
    maps={'normal':imgs[tex[m['normalTexture']['index']]],'base':imgs[tex[m['pbrMetallicRoughness']['baseColorTexture']['index']]],'mr':imgs[tex[m['pbrMetallicRoughness']['metallicRoughnessTexture']['index']]]}
    return dict(pos=pos,nrm=nrm,uv=uv,idx=idx,maps=maps,node=j['nodes'][0])
