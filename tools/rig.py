"""Auto-rig a decimated Tripo mesh and export a skinned, animated GLB."""
import sys, json, struct, math
import numpy as np
sys.path.insert(0, './tools')
import anims
H_DEC = 0.012

PARENT = {'Hips': None, 'Spine': 'Hips', 'Chest': 'Spine', 'Neck': 'Chest', 'Head': 'Neck',
          'L_Shoulder': 'Chest', 'L_UpperArm': 'L_Shoulder', 'L_ForeArm': 'L_UpperArm', 'L_Hand': 'L_ForeArm',
          'R_Shoulder': 'Chest', 'R_UpperArm': 'R_Shoulder', 'R_ForeArm': 'R_UpperArm', 'R_Hand': 'R_ForeArm',
          'L_UpLeg': 'Hips', 'L_Leg': 'L_UpLeg', 'L_Foot': 'L_Leg', 'L_Toe': 'L_Foot',
          'R_UpLeg': 'Hips', 'R_Leg': 'R_UpLeg', 'R_Foot': 'R_Leg', 'R_Toe': 'R_Foot'}
BONES = anims.BONES

def mirror(j):
    out = dict(j)
    for k, v in j.items():
        if k.startswith('L_'):
            out['R_' + k[2:]] = (-v[0], v[1], v[2]) if isinstance(v, tuple) else v
    return out

# joint positions in native model units (height ~0.98); "end" points for segment tips
CHARS = {
 'ThomasHawthorne': dict(
   joints=mirror({'Hips': (0, .50, -.01), 'Spine': (0, .60, -.01), 'Chest': (0, .70, -.01), 'Neck': (0, .83, -.005), 'Head': (0, .875, 0),
          'L_Shoulder': (.04, .80, -.02), 'L_UpperArm': (.16, .77, -.02), 'L_ForeArm': (.19, .605, -.02), 'L_Hand': (.20, .475, 0),
          'L_UpLeg': (.075, .49, -.01), 'L_Leg': (.09, .27, 0), 'L_Foot': (.10, .065, -.02), 'L_Toe': (.10, .02, .07)}),
   ends=mirror({'Head': (0, .98, 0), 'L_Hand': (.205, .40, .01), 'L_Toe': (.10, .02, .12), 'Hips': (0, .44, -.01)}),
   radius=mirror({'Hips': .11, 'Spine': .11, 'Chest': .12, 'Neck': .05, 'Head': .075, 'L_Shoulder': .05,
          'L_UpperArm': .062, 'L_ForeArm': .056, 'L_Hand': .04, 'L_UpLeg': .072, 'L_Leg': .058, 'L_Foot': .05, 'L_Toe': .04}),
   cloak=False),
 'OrionMascar': dict(
   joints=mirror({'Hips': (0, .49, 0), 'Spine': (0, .60, 0), 'Chest': (0, .70, -.01), 'Neck': (0, .835, -.01), 'Head': (0, .88, 0),
          'L_Shoulder': (.04, .80, -.02), 'L_UpperArm': (.135, .78, -.02), 'L_ForeArm': (.15, .625, -.02), 'L_Hand': (.16, .48, 0),
          'L_UpLeg': (.065, .48, 0), 'L_Leg': (.07, .27, 0), 'L_Foot': (.08, .065, -.02), 'L_Toe': (.08, .02, .07)}),
   ends=mirror({'Head': (0, .98, 0), 'L_Hand': (.165, .42, .01), 'L_Toe': (.08, .02, .12), 'Hips': (0, .43, 0)}),
   radius=mirror({'Hips': .10, 'Spine': .10, 'Chest': .11, 'Neck': .05, 'Head': .075, 'L_Shoulder': .045,
          'L_UpperArm': .05, 'L_ForeArm': .046, 'L_Hand': .038, 'L_UpLeg': .068, 'L_Leg': .055, 'L_Foot': .05, 'L_Toe': .04}),
   cloak=True, arm_cut=1.25),
}
# Talina Alvarez: long open coat (handled like a cloak); her stance is slightly asymmetric, so the legs are measured per side
_t = mirror({'Hips': (0, .50, 0), 'Spine': (0, .60, 0), 'Chest': (0, .70, -.01), 'Neck': (0, .83, -.01), 'Head': (0, .875, .005),
          'L_Shoulder': (.04, .80, -.01), 'L_UpperArm': (.118, .785, -.01), 'L_ForeArm': (.148, .63, -.01), 'L_Hand': (.162, .48, .015),
          'L_UpLeg': (.065, .48, 0), 'L_Leg': (.095, .255, -.012), 'L_Foot': (.13, .07, -.035), 'L_Toe': (.142, .02, .05)})
_t.update({'R_Leg': (-.057, .255, -.014), 'R_Foot': (-.07, .07, -.035), 'R_Toe': (-.08, .02, .05)})
_te = mirror({'Head': (0, .98, 0), 'L_Hand': (.166, .42, .02), 'L_Toe': (.145, .02, .085), 'Hips': (0, .44, 0)}); _te['R_Toe'] = (-.082, .02, .085)
CHARS['TalinaAlvarez'] = dict(joints=_t, ends=_te,
   radius=mirror({'Hips': .095, 'Spine': .095, 'Chest': .10, 'Neck': .045, 'Head': .07, 'L_Shoulder': .042,
          'L_UpperArm': .046, 'L_ForeArm': .042, 'L_Hand': .036, 'L_UpLeg': .062, 'L_Leg': .05, 'L_Foot': .046, 'L_Toe': .036}),
   cloak=True, arm_cut=1.25)
CHARS['OrionEyepatch'] = CHARS['OrionMascar']  # same body, new face
CHILD_FOR_SEG = {'Hips': None, 'Spine': 'Chest', 'Chest': 'Neck', 'Neck': 'Head', 'Head': None,
                 'L_Shoulder': 'L_UpperArm', 'L_UpperArm': 'L_ForeArm', 'L_ForeArm': 'L_Hand', 'L_Hand': None,
                 'R_Shoulder': 'R_UpperArm', 'R_UpperArm': 'R_ForeArm', 'R_ForeArm': 'R_Hand', 'R_Hand': None,
                 'L_UpLeg': 'L_Leg', 'L_Leg': 'L_Foot', 'L_Foot': 'L_Toe', 'L_Toe': None,
                 'R_UpLeg': 'R_Leg', 'R_Leg': 'R_Foot', 'R_Foot': 'R_Toe', 'R_Toe': None}

def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / max(1e-9, ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

ARM_L = ['L_Shoulder', 'L_UpperArm', 'L_ForeArm', 'L_Hand']
ARM_R = ['R_Shoulder', 'R_UpperArm', 'R_ForeArm', 'R_Hand']
LEG_L = ['L_UpLeg', 'L_Leg', 'L_Foot', 'L_Toe']
LEG_R = ['R_UpLeg', 'R_Leg', 'R_Foot', 'R_Toe']
TORSO = ['Hips', 'Spine', 'Chest', 'Neck', 'Head']

def dist_matrix(P, cfg):
    J = {k: np.array(v, float) for k, v in cfg['joints'].items()}
    E = {k: np.array(v, float) for k, v in cfg['ends'].items()}
    D = np.zeros((len(P), len(BONES)))
    for i, b in enumerate(BONES):
        a = J[b]; c = CHILD_FOR_SEG[b]
        if b == 'Hips':
            a, e = E['Hips'], J['Spine']
        else:
            e = J[c] if c else E[b]
        D[:, i] = seg_dist(P, a, e) / cfg['radius'][b]
    return D

def regions(P, cfg, N=None):
    """0 torso/head, 1 L arm, 2 R arm, 3 L leg, 4 R leg, 5 cloak"""
    D = dist_matrix(P, cfg); bi = {b: i for i, b in enumerate(BONES)}
    grp = np.zeros(len(BONES), int)
    for b in ARM_L[1:]: grp[bi[b]] = 1
    for b in ARM_R[1:]: grp[bi[b]] = 2
    for b in LEG_L: grp[bi[b]] = 3
    for b in LEG_R: grp[bi[b]] = 4
    reg = grp[np.argmin(D, 1)]
    if cfg['cloak']:
        arm = D[:, [bi[b] for b in ARM_L[1:] + ARM_R[1:]]].min(1)
        leg = D[:, [bi[b] for b in LEG_L + LEG_R]].min(1)
        tor = D[:, [bi[b] for b in ('Hips', 'Spine', 'Chest')]].min(1)
        y, z = P[:, 1], P[:, 2]
        cloak = (y < 0.79) & (y > 0.12) & (arm > cfg.get('arm_cut', 1.2)) & (leg > 1.2) & ((tor > 1.08) | (z < -0.075))
        if N is not None:
            th = thin_mask(P, N)
            isarm = (reg == 1) | (reg == 2)
            cloak |= th & isarm & (y < 0.76) & (arm > 0.55)
            cloak &= ~(isarm & ~th & (arm < 1.6))
            print('  thin verts', int(th.sum()), 'of', len(P))
        reg[cloak] = 5
    return reg, D

def thin_mask(P, N, depth=0.02, vox=0.004):
    from scipy import ndimage
    mn = P.min(0) - 0.02; dims = np.ceil((P.max(0) + 0.02 - mn) / vox).astype(int) + 1
    g = np.zeros(dims, bool); ii = ((P - mn) / vox).astype(int); g[ii[:, 0], ii[:, 1], ii[:, 2]] = True
    g = ndimage.binary_dilation(g, iterations=1)
    solid = ndimage.binary_fill_holes(g)
    inside = np.zeros(len(P), bool)
    for d in (depth * 0.75, depth, depth * 1.4):
        q = ((P - N * d - mn) / vox).astype(int); q = np.clip(q, 0, dims - 1)
        inside |= solid[q[:, 0], q[:, 1], q[:, 2]]
    return ~inside

def clean_regions(reg, F, n, iters=4):
    import scipy.sparse as sp
    r = np.concatenate([F[:, 0], F[:, 1], F[:, 2]]); c = np.concatenate([F[:, 1], F[:, 2], F[:, 0]])
    A = sp.coo_matrix((np.ones(len(r), np.float32), (r, c)), shape=(n, n)).tocsr(); A = A + A.T
    for _ in range(iters):
        oh = np.zeros((n, 6), np.float32); oh[np.arange(n), reg] = 1
        S = A @ oh + oh * 1.5
        reg = np.argmax(S, 1)
    return reg

def compute_weights(P, Fp, cfg, reg):
    D = dist_matrix(P, cfg); bi = {b: i for i, b in enumerate(BONES)}
    allow = np.zeros((6, len(BONES)), bool)
    def A(r, names):
        for n in names: allow[r, bi[n]] = True
    A(0, TORSO + ['L_Shoulder', 'R_Shoulder', 'L_UpperArm', 'R_UpperArm', 'L_UpLeg', 'R_UpLeg'])
    A(1, ARM_L + ['Chest']); A(2, ARM_R + ['Chest'])
    A(3, LEG_L + ['Hips']); A(4, LEG_R + ['Hips']); A(5, ['Hips', 'Spine', 'Chest'] + LEG_L[:2] + LEG_R[:2])
    k = 7.0
    Dm = np.where(allow[reg], D, 1e6)
    # torso verts may only take upper arm weight near the shoulder
    sh_y = cfg['joints']['L_UpperArm'][1]
    low = (reg == 0) & (P[:, 1] < sh_y - 0.06)
    Dm[np.ix_(low, [bi['L_UpperArm'], bi['R_UpperArm']])] = 1e6
    W = np.exp(-k * (Dm - Dm.min(1, keepdims=True)))
    W /= W.sum(1, keepdims=True)
    c = reg == 5
    if c.any():
        y = P[c, 1]
        tgt = np.zeros((c.sum(), len(BONES)))
        tgt[:, bi['Hips']] = np.clip((0.66 - y) / 0.12, 0, 1)
        tgt[:, bi['Spine']] = 1 - tgt[:, bi['Hips']]
        upper = np.clip((y - 0.66) / 0.08, 0, 1)
        tgt[:, bi['Chest']] = upper; tgt[:, bi['Spine']] *= (1 - upper)
        Wl = W[c].copy(); Wl[:, [bi[b] for b in BONES if b not in ('L_UpLeg', 'R_UpLeg', 'L_Leg', 'R_Leg')]] = 0
        Wl /= Wl.sum(1, keepdims=True) + 1e-9
        hem = (np.clip((0.5 - y) / 0.3, 0, 1) * 0.4)[:, None]
        W[c] = tgt * (1 - hem) + Wl * hem
    import scipy.sparse as sp
    r = np.concatenate([Fp[:, 0], Fp[:, 1], Fp[:, 2]]); cc = np.concatenate([Fp[:, 1], Fp[:, 2], Fp[:, 0]])
    same = reg[r] == reg[cc]
    # allow torso<->limb smoothing only at joints (shoulder/hip) so weights blend there
    A_ = sp.coo_matrix((np.ones(same.sum()), (r[same], cc[same])), shape=(len(P), len(P))).tocsr()
    A_ = A_ + A_.T; A_.data[:] = 1
    deg = np.asarray(A_.sum(1)).ravel() + 1e-9
    for _ in range(6):
        W = 0.5 * W + 0.5 * (A_ @ W) / deg[:, None]
    idx = np.argsort(-W, 1)[:, :4]
    w4 = np.take_along_axis(W, idx, 1)
    w4[w4 < 0.02] = 0
    ss = w4.sum(1, keepdims=True); badw = (~np.isfinite(ss[:, 0])) | (ss[:, 0] <= 0)
    if badw.any(): print('  fixing', int(badw.sum()), 'bad weight rows')
    w4[badw] = [1, 0, 0, 0]; idx[badw, 0] = BONES.index('Hips'); ss[badw] = 1
    w4 /= ss
    return idx.astype(np.uint8), w4.astype(np.float32)

def tangents(V, N, UV, F):
    v0, v1, v2 = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    t0, t1, t2 = UV[F[:, 0]], UV[F[:, 1]], UV[F[:, 2]]
    e1, e2 = v1 - v0, v2 - v0; d1, d2 = t1 - t0, t2 - t0
    r = d1[:, 0] * d2[:, 1] - d2[:, 0] * d1[:, 1]
    r = np.where(np.abs(r) < 1e-12, 1e-12, r)
    sdir = (e1 * d2[:, 1:2] - e2 * d1[:, 1:2]) / r[:, None]
    tdir = (e2 * d1[:, 0:1] - e1 * d2[:, 0:1]) / r[:, None]
    T = np.zeros_like(V); B = np.zeros_like(V)
    for k in range(3):
        np.add.at(T, F[:, k], sdir); np.add.at(B, F[:, k], tdir)
    T = T - N * np.sum(N * T, 1, keepdims=True)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-12
    w = np.where(np.sum(np.cross(N, T) * B, 1) < 0, -1.0, 1.0)
    bad = ~np.isfinite(T).all(1) | (np.linalg.norm(T, axis=1) < 0.5)
    T[bad] = [1, 0, 0]
    return np.concatenate([T, w[:, None]], 1).astype(np.float32)

def quat_euler(x, y, z):
    x, y, z = [math.radians(a) / 2 for a in (x, y, z)]
    qx = (math.sin(x), 0, 0, math.cos(x)); qy = (0, math.sin(y), 0, math.cos(y)); qz = (0, 0, math.sin(z), math.cos(z))
    def mul(a, b):
        ax, ay, az, aw = a; bx, by, bz, bw = b
        return (aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx,
                aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz)
    return mul(mul(qy, qx), qz)

class GLB:
    def __init__(self):
        self.bin = bytearray(); self.j = {'asset': {'version': '2.0', 'generator': 'Orion WW3 auto-rig'},
                                          'bufferViews': [], 'accessors': []}
    def view(self, data, target=None):
        while len(self.bin) % 4: self.bin.append(0)
        bv = {'buffer': 0, 'byteOffset': len(self.bin), 'byteLength': len(data)}
        if target: bv['target'] = target
        self.bin += data; self.j['bufferViews'].append(bv); return len(self.j['bufferViews']) - 1
    def acc(self, arr, typ, ctype, target=None, minmax=False, normalized=False):
        arr = np.ascontiguousarray(arr)
        v = self.view(arr.tobytes(), target)
        a = {'bufferView': v, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
        if normalized: a['normalized'] = True
        if minmax:
            a['min'] = np.atleast_1d(arr.min(0)).astype(float).tolist(); a['max'] = np.atleast_1d(arr.max(0)).astype(float).tolist()
        self.j['accessors'].append(a); return len(self.j['accessors']) - 1
    def write(self, path):
        while len(self.bin) % 4: self.bin.append(0)
        self.j['buffers'] = [{'byteLength': len(self.bin)}]
        js = json.dumps(self.j, separators=(',', ':')).encode()
        while len(js) % 4: js += b' '
        out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(self.bin))
        out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(self.bin), 0x004E4942) + bytes(self.bin)
        open(path, 'wb').write(out)

def build(name, dec_path, tex_prefix, out_path, scale, clipset):
    cfg = CHARS[name]
    import decimate
    raw = np.load(dec_path)
    rp = raw['pos'].astype(np.float64)
    _, wid = np.unique(raw['pos'], axis=0, return_inverse=True); wid = wid.ravel()
    Pw = np.zeros((wid.max() + 1, 3)); Pw[wid] = rp
    Nw = np.zeros((wid.max() + 1, 3)); np.add.at(Nw, wid, raw['nrm'].astype(np.float64)); Nw /= np.linalg.norm(Nw, axis=1, keepdims=True) + 1e-9
    reg_w, _ = regions(Pw, cfg, Nw)
    reg_w = clean_regions(reg_w, wid[raw['idx']], len(Pw))
    reg_raw = reg_w[wid]
    d = decimate.decimate(raw['pos'], raw['nrm'], raw['uv'], raw['idx'], H_DEC, extra=reg_raw)
    V = d['pos'].astype(np.float64); N = d['nrm']; UV = d['uv']; F = d['idx'].astype(np.int64)
    P = d['P'].astype(np.float64); prep = d['prep']; reg = d['region']
    Fp = prep[F]
    # cut fused bridges between arms and legs/cloak (and torso below the armpit)
    R3 = reg[Fp]; isarm = (R3 == 1) | (R3 == 2)
    other = np.where(isarm, -1, R3)
    has_arm = isarm.any(1); omax = other.max(1)
    cy = P[Fp].mean(1)[:, 1]
    mixed_arms = ((R3 == 1).any(1) & (R3 == 2).any(1))
    bad = has_arm & ((omax >= 3) | ((omax == 0) & (cy < cfg['joints']['L_UpperArm'][1] - 0.09))) | mixed_arms
    F = F[~bad]; Fp = prep[F]
    print('  regions', np.bincount(reg, minlength=6), 'cut', int(bad.sum()))
    ji, jw = compute_weights(P, Fp, cfg, reg)
    JI, JW = ji[prep], jw[prep]
    T = tangents(V.astype(np.float32), N, UV, F)
    V = (V * scale).astype(np.float32)
    joints = {k: np.array(v) * scale for k, v in cfg['joints'].items()}
    g = GLB(); j = g.j
    nodes = []
    bone_node = {}
    for b in BONES:
        par = PARENT[b]
        loc = joints[b] - (joints[par] if par else 0)
        bone_node[b] = len(nodes)
        nodes.append({'name': b, 'translation': loc.tolist()})
    for b in BONES:
        ch = [bone_node[c] for c in BONES if PARENT[c] == b]
        if ch: nodes[bone_node[b]]['children'] = ch
    # images
    imgs = []
    for k in ('base', 'normal', 'mr'):
        data = open(f'{tex_prefix}_{k}.jpg', 'rb').read()
        imgs.append({'bufferView': g.view(data), 'mimeType': 'image/jpeg', 'name': k})
    j['images'] = imgs
    j['samplers'] = [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}]
    j['textures'] = [{'source': i, 'sampler': 0} for i in range(3)]
    j['materials'] = [{'name': name + '_mat', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0},
                       'metallicRoughnessTexture': {'index': 2}}, 'normalTexture': {'index': 1}}]
    attrs = {'POSITION': g.acc(V, 'VEC3', 5126, 34962, True), 'NORMAL': g.acc(N, 'VEC3', 5126, 34962),
             'TANGENT': g.acc(T, 'VEC4', 5126, 34962), 'TEXCOORD_0': g.acc(UV, 'VEC2', 5126, 34962),
             'JOINTS_0': g.acc(JI.astype(np.uint8), 'VEC4', 5121, 34962),
             'WEIGHTS_0': g.acc(JW, 'VEC4', 5126, 34962)}
    ind = g.acc(F.astype(np.uint32).ravel(), 'SCALAR', 5125, 34963)
    j['meshes'] = [{'name': name, 'primitives': [{'attributes': attrs, 'indices': ind, 'material': 0}]}]
    ibm = np.zeros((len(BONES), 16), np.float32)
    for i, b in enumerate(BONES):
        m = np.eye(4); m[:3, 3] = -joints[b]
        ibm[i] = m.T.ravel()  # column-major
    j['skins'] = [{'name': name + '_skin', 'joints': [bone_node[b] for b in BONES], 'skeleton': bone_node['Hips'],
                   'inverseBindMatrices': g.acc(ibm, 'MAT4', 5126)}]
    mesh_node = len(nodes); nodes.append({'name': name + '_Mesh', 'mesh': 0, 'skin': 0})
    root = len(nodes); nodes.append({'name': name, 'children': [bone_node['Hips'], mesh_node]})
    j['nodes'] = nodes; j['scenes'] = [{'name': 'Scene', 'nodes': [root]}]; j['scene'] = 0
    # animations
    anims_out = []
    for cname, (fn, dur, loop) in clipset.items():
        n = int(round(dur * anims.FPS)) + 1
        times = np.linspace(0, dur, n).astype(np.float32)
        poses = [fn(float(t)) for t in times]
        tacc = g.acc(times, 'SCALAR', 5126, minmax=True)
        samplers, channels = [], []
        for b in BONES:
            q = np.array([quat_euler(*p.get(b, (0, 0, 0))) for p in poses], np.float32)
            for i in range(1, len(q)):
                if np.dot(q[i], q[i - 1]) < 0: q[i] = -q[i]
            samplers.append({'input': tacc, 'output': g.acc(q, 'VEC4', 5126), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': bone_node[b], 'path': 'rotation'}})
        tr = np.array([joints['Hips'] + np.array([p.get('hx', 0), p.get('hy', 0), p.get('hz', 0)]) for p in poses], np.float32)
        samplers.append({'input': tacc, 'output': g.acc(tr, 'VEC3', 5126), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': bone_node['Hips'], 'path': 'translation'}})
        anims_out.append({'name': cname, 'samplers': samplers, 'channels': channels, 'extras': {'loop': loop}})
    j['animations'] = anims_out
    g.write(out_path)
    return len(V), len(F)

if __name__ == '__main__':
    H = 1.82
    out = sys.argv[1] if len(sys.argv) > 1 else './work/out'
    import os; os.makedirs(out, exist_ok=True)
    names = sys.argv[2].split(',') if len(sys.argv) > 2 else ['OrionMascar', 'ThomasHawthorne']
    HT = {'TalinaAlvarez': 1.72}
    for name in names:
        cs = anims.rifle_set() if name == 'ThomasHawthorne' else anims.duelist_set() if name == 'TalinaAlvarez' else anims.sword_set()
        sc = HT.get(name, H) / 0.98
        nv, nf = build(name, f'./work/{name}_raw.npz', f'./work/{name}', f'{out}/{name}_rigged.glb', sc, cs)
        print(name, nv, nf, os.path.getsize(f'{out}/{name}_rigged.glb') // 1024, 'KB')
